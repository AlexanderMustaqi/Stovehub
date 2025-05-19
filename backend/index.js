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

// στατικός φάκελος
app.use('/uploads', express.static(path.join(process.cwd(), '/uploads')));

app.listen(3001, () => console.log('Server: http://localhost:3001'));


app.get('/test-image', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'uploads', '1746785144181.jpg'));
});