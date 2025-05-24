import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import http from 'http'; // Added for WebSocket server
import { WebSocketServer, WebSocket } from 'ws'; // Corrected import for WebSocket server and WebSocket class

const app = express();
const server = http.createServer(app); // Create HTTP server for Express and WS
const wss = new WebSocketServer({ server: server }); // WebSocket server

const PORT = 5000; // Using port 5000 as defined in the second file

const corsOptions = {
  origin: [
    'http://localhost:3000', // Ενημερωμένο port για το frontend
    'http://127.0.0.1:3000'  // Ενημερωμένο port για το frontend
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // Using corsOptions from the second file
app.use(express.json());

// multer για εικόνες
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req,file,cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// σύνδεση MySQL
const pool = mysql.createPool({ // Using connection pool from the second file
  host:'localhost',
  user:'root',
  password:'',
  database:'softeng2025',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Check database connection
pool.getConnection()
  .then(connection => {
    console.log('MySQL OK');
    connection.release(); // Release the connection immediately
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// WEBSOCKET SERVER
wss.on('connection', async (ws) => {
  console.log('A new client has connected to the server!');
  let chat_id = 0;

  ws.on('message', async (m) => {
    try {
      const ClientResponse = JSON.parse(m);
      if (ClientResponse.type == 'id') {
        chat_id = ClientResponse.message;
        const [result] = await pool.query(`select user_base.user_id, user_base.username, message_string.message, message.message_date, chat.chat_name, chat.chat_settings from message_string
                                    left join message on message.message_id = message_string.message_id
                                      left join user_base on message.user_id = user_base.user_id
                                        left join chat on chat.chat_id = message.chat_id
                                          where message.chat_id = ?;`, [chat_id]);
        const ServerRequest = {
          type: 'old',
          message: result
        };
        ws.send(JSON.stringify(ServerRequest));
      } else if (ClientResponse.type == 'test') {
        console.log(ClientResponse.message);
      } else {
        // Assuming ClientResponse.message contains { message: '...', user_id: ... }
        await pool.query(`call PostMessage(?, ?, ?)`, [ClientResponse.message.message, ClientResponse.message.user_id, chat_id]); // Using prepared statement for safety
        const ServerRequest = {
          type: 'new',
          message: ClientResponse.message
        };
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) { // Check if client is ready, using WebSocket.OPEN
            client.send(JSON.stringify(ServerRequest));
          }
        });
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
      ws.send(JSON.stringify(`ERROR ${err.message}`)); // Send error message back to client
    }
  });

  ws.on('error', (err) => {
    console.error("WebSocket error:", err);
  });

  ws.on('close', () => {
    console.log('Client has disconnected');
  });
});

// HTTP Verbs & Routes

// Endpoints from the second file
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the server homepage!<h1>');
});

// GET user_id
app.get('/api/user_id/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const [rows] = await pool.query(`select user_id from user_base where email = ?`, [email]); // Using prepared statement
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error("Error fetching user_id:", err);
    res.status(500).send('DB Error');
  }
});

// GET * users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('select * from user_base;');
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send('DB Error');
  }
});

// GET * chats for user_id
app.get('/api/chats/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const [userRows] = await pool.query(`select user_id from user_base where email=?;`, [email]); // Using prepared statement
    if (userRows.length === 0) {
      return res.status(404).send('User not found');
    }
    const user_id = userRows[0]['user_id'];
    const [chatRows] = await pool.query(`select chat.chat_id, chat.chat_name from chat
                                left join chat_user on chat.chat_id = chat_user.chat_id
                                  where chat_user.user_id = ?;`, [user_id]); // Using prepared statement
    res.json(chatRows);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).send('DB Error');
  }
});

// GET messages for chat_id
app.get('/api/messages/:chat', async (req, res) => {
  const chat = req.params.chat;

  try {
    const [rows] = await pool.query(`select user_base.user_id, user_base.username, message_string.message, message.message_date, chat.chat_name, chat.chat_settings from message_string
                                left join message on message.message_id = message_string.message_id
                                  left join user_base on message.user_id = user_base.user_id
                                    left join chat on chat.chat_id = message.chat_id
                                      where message.chat_id=?;`, [chat]); // Using prepared statement
    res.json(rows);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send('DB Error');
  }
});

// GET followers for user_id
app.get('/api/followers/:user', async (req, res) => {
  const user = req.params.user;

  try {
    const [rows] = await pool.query(`select username, user_base.user_id from followers
                                      left join user_base on followers.secondary_user_id = user_base.user_id
                                        where main_user_id = ?;`, [user]); // Using prepared statement
    res.json(rows);
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).send('DB Error');
  }
});

// GET profile
app.get(`/api/profile_info/:email`, async (req, res) => {
  const email = req.params.email;

  try {
    const [rows] = await pool.query(`select username, bio, rank from user_base where email = ?`, [email]); // Using prepared statement
    if (rows.length > 0) {
      res.json(rows[0]); // Return single object
    } else {
      res.status(404).send('Profile not found');
    }
  } catch (err) {
    console.error("Error fetching profile info:", err);
    res.status(500).send('DB Error');
  }
});

// GET profile_recipies
app.get(`/api/profile_recipies/:email`, async (req, res) => {
  const email = req.params.email;

  try {
    const [rows] = await pool.query(`select recipe.* from recipe join user_base on user_base.user_id = recipe.user_id where email=?`, [email]); // Using prepared statement
    res.json(rows);
  } catch (err) {
    console.error("Error fetching profile recipes:", err);
    res.status(500).send('DB Error');
  }
});

// POST chat
app.post('/api/postChat', async (req, res) => {
  const ClientRequest = req.body;
  console.log(ClientRequest);
  const { chat_name, chat_users, user_email } = ClientRequest;
  let userId;
  let connection;

  try {
    const [userRows] = await pool.query(`select user_id from user_base where email = ?`, [user_email]); // Using prepared statement
    if (userRows.length === 0) {
      return res.status(404).send('User not found');
    }
    userId = userRows[0].user_id; // Correctly get user_id

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(`insert into chat(chat_name, chat_settings) values (?, 1)`, [chat_name]); // Using prepared statement
    const chat_id = result.insertId;

    for (const chatUser of chat_users) {
      await connection.execute(`INSERT INTO chat_user(chat_id, user_id) values (?, ?)`, [chat_id, chatUser]); // Using prepared statement
    }
    await connection.execute(`Insert into chat_user(chat_id, user_id) values (?, ?)`, [chat_id, userId]); // Using prepared statement

    await connection.commit();
    res.status(201).send('Chat created successfully');
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error posting chat:", err);
    res.status(500).send('DB Error');
  } finally {
    if (connection) connection.release();
  }
});

// POST registeredUser
app.post('/api/postRegisteredUser', async (req, res) => {
  const message = req.body;

  try {
    // Assuming PostMessage is a stored procedure that handles user registration
    await pool.query(`call postRegisteredUser(?, ?, ?)`, [message.username, message.password, message.email]); // Using prepared statement
    res.sendStatus(201);
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).send('DB Error');
  }
});

// POST new follower
app.post(`/api/postFollower`, async (req, res) => {
  const message = req.body;

  try {
    const [mainUserRows] = await pool.query(`select user_id from user_base where email=?`, [message.main_user]); // Using prepared statement
    if (mainUserRows.length === 0) {
      return res.status(404).send('Main user not found');
    }
    const m_user = mainUserRows[0].user_id; // Correctly get user_id

    const [secUserRows] = await pool.query(`select user_id from user_base where email=?`, [message.sec_user]); // Using prepared statement
    if (secUserRows.length === 0) {
      return res.status(404).send('Secondary user not found');
    }
    const s_user = secUserRows[0].user_id; // Correctly get user_id

    await pool.query(`insert into followers(main_user_id, secondary_user_id) values (?, ?)`, [m_user, s_user]); // Using prepared statement
    res.send('success');
  } catch (err) {
    console.error("Error posting follower:", err);
    res.status(500).send('DB Error');
  }
});

// GET authentication
app.get('/api/getAuth/:user', async (req, res) => {
  const ClientRequest = req.params.user;
  let user;
  try {
    user = JSON.parse(ClientRequest);
  } catch (parseErr) {
    console.error("Error parsing user JSON:", parseErr);
    return res.status(400).send('Invalid user data format');
  }

  try {
    const [rows] = await pool.query(`select count(*) as c from user_base
                                where user_base.email = ? AND password=?;`, [user.email, user.password]); // Using prepared statement
    if (rows[0].c == 1) {
      res.send("Found");
    } else {
      res.send("Not Found");
    }
  } catch (err) {
    console.error("Error during authentication:", err);
    res.status(500).send('DB Error');
  }
});

// Endpoints from the first file (Recipes) - Refactored to use async/await with pool

// POST /api/posts
app.post('/api/posts', upload.single('image'), (req, res) => {
  const { title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  pool.query( // Using pool.query
    `INSERT INTO recipes (title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, imageUrl]
  )
  .then(() => res.status(201).send('OK')) // Send 201 for resource creation
  .catch(err => {
    console.error("Error inserting recipe:", err);
    res.status(500).send('Error');
  });
});

// GET /api/posts
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recipes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error("Error fetching recipes:", err);
    res.status(500).send('Error');
  }
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

  pool.query(sql, params) // Using pool.query with params
    .then(([rows]) => {
      console.log("✅ Found recipes:", rows.length);
      res.json(rows);
    })
    .catch(err => {
      console.error("🔥 Database error:", err);
      res.status(500).send('DB Error');
    });
});

// GET /api/posts/:id (Για μία συνταγή)
app.get('/api/posts/:id', (req, res) => {
  const recipeId = req.params.id;
  pool.query('SELECT * FROM recipes WHERE id = ?', [recipeId]) // Using pool.query with placeholder
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(404).send('Recipe not found');
      }
      res.json(rows[0]); // Επιστροφή της μίας συνταγής
    })
    .catch(err => {
      console.error("Error fetching recipe by ID:", err);
      res.status(500).send('DB Error');
    });
});

// στατικός φάκελος
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // Corrected path.join usage

// Test image route (kept from the first file)
app.get('/test-image', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'uploads', '1746785144181.jpg')); // Note: This file might not exist
});

// Start the server using the http server instance
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`HTTP: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});



/**Σημειώσεις για τις αλλαγές:**

1.  **Imports:** Συνδυάστηκαν όλα τα απαραίτητα imports, χρησιμοποιώντας το `mysql2/promise`.
2.  **Server Setup:** Χρησιμοποιείται το `http.createServer(app)` και το `server.listen(PORT, ...)` από το δεύτερο αρχείο, καθώς αυτό είναι απαραίτητο για τη λειτουργία του WebSocket server. Η πόρτα που χρησιμοποιείται είναι η 5000.
3.  **CORS:** Χρησιμοποιούνται οι πιο συγκεκριμένες ρυθμίσεις `corsOptions` από το δεύτερο αρχείο.
4.  **Database Connection:** Αντικαταστάθηκε η απλή σύνδεση `mysql.createConnection` με το `mysql.createPool` από το δεύτερο αρχείο. Όλες οι κλήσεις στη βάση δεδομένων έχουν μετατραπεί σε ασύγχρονες (`await pool.query` ή `await connection.execute`) και έχουν προστεθεί `try...catch` blocks για τη διαχείριση σφαλμάτων.
5.  **Prepared Statements:** Χρησιμοποιούνται prepared statements (`?` placeholders) στις κλήσεις `pool.query` και `connection.execute` για λόγους ασφαλείας (αποφυγή SQL injection).
6.  **WebSocket Server:** Ενσωματώθηκε ο κώδικας για τον WebSocket server. Προστέθηκε ένας έλεγχος `client.readyState === webSocket.OPEN` πριν την αποστολή μηνυμάτων στους clients.
7.  **HTTP Routes:** Όλες οι διαδρομές από τα δύο αρχεία έχουν ενσωματωθεί. Οι διαδρομές για τις συνταγές από το πρώτο αρχείο έχουν μετατραπεί για να χρησιμοποιούν το ασύγχρονο `pool.query`.
8.  **Error Handling:** Έχει γίνει προσπάθεια για πιο συνεπή διαχείριση σφαλμάτων, καταγράφοντας τα σφάλματα στην κονσόλα του server και επιστρέφοντας status 500 στον client.
9.  **Static Files:** Διατηρήθηκε η ρύθμιση για το serving του φακέλου `uploads`. Διορθώθηκε η χρήση του `path.join`.
10. **Test Route:** Η διαδρομή `/test-image` από το πρώτο αρχείο διατηρήθηκε.

Αυτό το merged αρχείο περιέχει πλέον όλη τη λειτουργικότητα από τα δύο αρχεία. Θυμηθείτε να εγκαταστήσετε το `mysql2` αν δεν το έχετε ήδη (`npm install mysql2`).

Για να εφαρμόσετε αυτή την αλλαγή, απλά αντικαταστήστε το περιεχόμενο του αρχείου `c:\Users\Panos\Desktop\TL_kwdikas\Stovehub\backend\index.js` με τον κώδικα που προκύπτει από την εφαρμογή του παραπάνω diff.*/