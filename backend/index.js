import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// multer για εικόνες
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req,file,cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// σύνδεση MySQL
const db = mysql.createConnection({ host:'localhost', user:'root', password:'', database:'softeng2025' });
db.connect(err => console.log(err ? err : 'MySQL OK'));

// POST /api/posts
app.post('/api/posts', upload.single('image'), (req, res) => {
  const { title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  db.query(
    `INSERT INTO recipes (title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, imageUrl],
    err => err ? res.status(500).send('Error') : res.send('OK')
  );
});

// GET /api/posts
app.get('/api/posts', (req, res) => {
  db.query('SELECT * FROM recipes ORDER BY created_at DESC', (err, rows) =>
    err ? res.status(500).send('Error') : res.json(rows)
  );
});

// GET /api/posts/search
app.get('/api/posts/search', (req, res) => {
  console.log("🔍 Search filters received:", req.query); // Debug log
  
  let sql = 'SELECT * FROM recipes WHERE 1=1';
  const params = [];

  if (req.query.query) {
    const likeQuery = `%${req.query.query}%`;
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(likeQuery, likeQuery);
  }

  if (req.query.category) {
    sql += ' AND category = ?';
    params.push(req.query.category);
  }

  if (req.query.difficulty) {
    sql += ' AND difficulty = ?';
    params.push(req.query.difficulty);
  }

  if (req.query.prepTime) {
    sql += ' AND prep_time_value <= ?';
    params.push(parseInt(req.query.prepTime));
  }

  if (req.query.ingredients) {
    sql += ' AND ingredients LIKE ?';
    params.push(`%${req.query.ingredients}%`);
  }

  sql += ' ORDER BY created_at DESC';

  console.log("📝 Final SQL:", sql, params); // Debug log

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("🔥 Database error:", err);
      return res.status(500).send('DB Error');
    }
    console.log("✅ Found recipes:", rows.length);
    res.json(rows);
  });
});



// GET /api/posts/:id (Για μία συνταγή)
app.get('/api/posts/:id', (req, res) => {
  const recipeId = req.params.id;
  db.query('SELECT * FROM recipes WHERE id = ?', [recipeId], (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    if (rows.length === 0) return res.status(404).send('Recipe not found');
    res.json(rows[0]); // Επιστροφή της μίας συνταγής
  });
});

// στατικός φάκελος
app.use('/uploads', express.static(path.join(process.cwd(), '/uploads')));





app.listen(3001, () => console.log('Server: http://localhost:3001'));


app.get('/test-image', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'uploads', '1746785144181.jpg'));
});
