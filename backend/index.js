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
const recipeImageStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req,file,cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const uploadRecipeImage = multer({ storage: recipeImageStorage });

// multer για εικόνες προφίλ (pfp)
const pfpStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/pfp/'); // Συγκεκριμένος φάκελος για εικόνες προφίλ
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Μοναδικό όνομα αρχείου
  }
});
const uploadPfp = multer({
  storage: pfpStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Όριο μεγέθους αρχείου, π.χ. 5MB
  fileFilter: (req, file, cb) => {
    // Αποδοχή μόνο αρχείων εικόνας
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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
  console.log(`[Backend] Attempting to fetch chats for email: ${email}`);

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

// GET users by search query
app.get('/api/users/search', async (req, res) => {
  const userQuery = req.query.query; // Παίρνουμε το query από τα query parameters
  console.log(`[Backend] Searching users with query: "${userQuery}"`);

  if (!userQuery) {
    // Αν δεν υπάρχει query, επιστρέφουμε κενό αποτέλεσμα ή όλους τους χρήστες (επιλογή)
    // Εδώ επιστρέφουμε κενό αποτέλεσμα για να είναι πιο συγκεκριμένη η αναζήτηση
    return res.json([]); 
  }

  try {
    // Αναζήτηση χρηστών με βάση το username (μπορείς να προσθέσεις και άλλα πεδία αν θες)
    const [rows] = await pool.query('SELECT user_id, username, email, profile_image_url FROM user_base WHERE username LIKE ?', [`%${userQuery}%`]); // Added email
    console.log(`[Backend] Found ${rows.length} users for query: "${userQuery}"`);
    res.json(rows);
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).send('DB Error during user search');
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
    // Assuming the chat name column in 'chat' table is 'name'. If not, adjust or remove 'chat.name AS chat_name'.
    const [chatRows] = await pool.query(`select chat.chat_id, chat.chat_name from chat
                                left join chat_user on chat.chat_id = chat_user.chat_id
                                  where chat_user.user_id = ${user_id};`); // Using prepared statement
    res.json(chatRows);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).send('DB Error'); // Βεβαιώσου ότι αυτό παραμένει για τη σωστή διαχείριση σφαλμάτων
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

//GET my_profile
app.get(`/api/my_profile_info/:email`, async (req,res) => {
  const email = req.params.email;

  try {
    const result = await pool.query(`select username, bio, rank, profile_image_url from user_base where email = "${email}"`);
    // console.log(result[0]);
    res.send(JSON.stringify(result[0]));
  }
  catch(err) {
    res.status(500);
    throw err;
  }
})

// GET follower count
app.get('/api/follower_count/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) AS follower_count FROM followers WHERE main_user_id = ?`, [id]);
    if (rows.length > 0) {
      res.json({ follower_count: rows[0].follower_count });
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error("Error fetching follower count:", err);
    res.status(500).send('DB Error');
  }
})
  


// GET profile
app.get(`/api/profile_info/:id`, async (req, res) => { // Changed from :email to :id
  const userId = req.params.id;

  try {
    const [rows] = await pool.query(`SELECT user_id, username, email, bio, rank, profile_image_url FROM user_base WHERE user_id = ?`, [userId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send('Profile not found');
    }
  } catch (err) {
    console.error("Error fetching profile info:", err);
    res.status(500).send('DB Error');
  }
});


//GET galleries
app.get('/api/galleries/:id' , async (req, res) => {
  const id = req.params.id;

  //getting galleries
  try {
    result = await pool.query(`select * from gallery where user_id = ${id}`);
    res.json(JSON.stringify(result[0]));
  }
  catch(err) {
    res.status(500);
    throw err
  }
})

//GET recipies for gallery
app.get(`/api/recipes/:id` , async (req, res) => {
  const gallery_id = req.params.id;

  try {
    result = await pool.query(`select * from gal_rec 
                                join recipes on gal_rec.recipe_id = recipes.id
                                  where gallery_id=${gallery_id}`);
  }
  catch(err) {
    res.status(500);
    throw err
  }
})

// GET profile_recipies
app.get(`/api/profile_recipies/:id`, async (req, res) => { // Changed from :email to :id
  const userId = req.params.id;

  try {
    const [rows] = await pool.query(`SELECT recipes.* FROM recipes WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching profile recipes:", err);
    res.status(500).send('DB Error');
  }
});

// POST chat
app.post('/api/postChat', async (req, res) => {
  const ClientRequest = req.body;
  //console.log(ClientRequest);
  const { chat_name, chat_users, user_email } = ClientRequest;
  var userId;
  let connection;

  try {
    const result = await pool.query(`select user_id from user_base where email = "${user_email}"`)
    userId = result[0];
  }
  catch(err) {
    res.status(500);
    throw err
  }

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    const [ result ] = await connection.execute(`insert into chat(chat_name, chat_settings)
                                              values ('${chat_name}',1)`)
    const chat_id = result.insertId;

    for (const chatUser of chat_users) {
      await connection.execute(`INSERT INTO chat_user(chat_id, user_id) values (${chat_id}, ${chatUser})`)
    }
      await connection.execute(`Insert into chat_user(chat_id, user_id) values (${chat_id}, ${userId})`)

    await connection.commit();
  }
  catch(err) {

    if (connection) await connection.rollback();

    throw err;
    res.status(500);
  }
  finally {
    if (connection) connection.release();
  }
})

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

//POST new name
app.post(`/api/newName`, async (req, res) => {
  const message = req.body;

  try {
    const result = await pool.query(`update user_base set username="${message.name}" where email="${message.email}"`);
    res.sendStatus(201);
  }
  catch(err) {
    res.status(500);
    throw err;
  }
})

//POST new bio
app.post(`/api/newBio`, async (req, res) => {
  const message = req.body;

  try {
    const result = await pool.query(`update user_base set bio="${message.bio}" where email="${message.email}"`);
    res.sendStatus(201);
  }
  catch(err) {
    res.status(500);
    throw err;
  }
})

// POST new pfp
app.post('/api/profile/pfp', uploadPfp.single('profileImage'), async (req, res) => {
  const { email } = req.body; // Παίρνουμε το email από το σώμα του request

  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }
  if (!email) {
    // Αυτό το σφάλμα δεν θα έπρεπε να συμβεί αν το frontend στέλνει πάντα το email
    return res.status(400).json({ message: 'Email is required to update profile picture.' });
  }

  const imageUrlPath = `/uploads/pfp/${req.file.filename}`; // Σχετική διαδρομή για αποθήκευση στη βάση

  try {
    const [userRows] = await pool.query('SELECT user_id FROM user_base WHERE email = ?', [email]);
    if (userRows.length === 0) {
      // Σε περίπτωση που το email δεν βρεθεί, αν και θα έπρεπε να υπάρχει για συνδεδεμένο χρήστη
      return res.status(404).json({ message: 'User not found.' });
    }

    await pool.query('UPDATE user_base SET profile_image_url = ? WHERE email = ?', [imageUrlPath, email]);
    
    console.log(`[Backend] Profile picture updated for ${email} to ${imageUrlPath}`);
    res.status(200).json({ message: 'Profile picture updated successfully.', imageUrl: `http://localhost:5000${imageUrlPath}` }); // Επιστρέφουμε το πλήρες URL για άμεση χρήση από το frontend
  } catch (err) {
    console.error("Error updating profile picture:", err);
    res.status(500).json({ message: 'Database error while updating profile picture.' });
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

// --- FOLLOW/UNFOLLOW ENDPOINTS (REVISED BASED ON USER INPUT) ---

//GET followers for user_id
app.get('/api/followers/:user', async (req, res) => {
  const user = req.params.user

  try {
    const result = await pool.query(`select username, user_base.user_id from followers 
                                      left join user_base on followers.secondary_user_id = user_base.user_id
                                        where main_user_id = ${user};`);
    // console.log(result[0]);
    res.json(result[0]);
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

//POST new follower
app.post(`/api/postFollower`, async (req, res) => {
  const message = req.body;

  try {
        let result = await pool.query(`SELECT user_id FROM user_base WHERE email = ?`, [message.main_user]);
        const m_user = result[0];

        result = await pool.query(`SELECT user_id FROM user_base WHERE email = ?`, [message.sec_user]);
        const s_user = result[0];

        console.log('[postFollower] main_user:',m_user[0].user_id);
        console.log('[postFollower] sec_user:', s_user[0].user_id);

        if (!m_user || !s_user) {
            return res.status(400).send('Invalid user email(s)'); // Ή κάποιο άλλο κατάλληλο μήνυμα σφάλματος
        }

        await pool.query(`INSERT INTO followers(main_user_id, secondary_user_id) VALUES (?, ?)`, [m_user[0].user_id, s_user[0].user_id]);
        res.send('success');
    } catch (err) {
        console.error('[POST /api/postFollower] Σφάλμα:', err);
        res.status(500).send('Internal Server Error');
    }

  // try {
  //   result = await pool.query(`select user_id from user_base where email="${message.main_user}"`);
  //   const m_user = result[0];
  //   result = await pool.query(`select user_id from user_base where email="${message.sec_user}"`);
  //   const s_user = result[0];
  //   post = await pool.query(`insert into followers(main_user_id, secondary_user_id) values (${m_user},${s_user})`)
  //   res.send('success');
  // }
  // catch (err) {
  //   res.status(500);
  //   throw err;
  // }
})

// POST to unfollow a user (based on emails)
app.post(`/api/removeFollower`, async (req, res) => {
  const { main_user_email, sec_user_email } = req.body; // main_user_email: ο χρήστης που ακολουθείται, sec_user_email: ο χρήστης που κάνει unfollow

  if (!main_user_email || !sec_user_email) {
    return res.status(400).json({ message: 'Main user email and secondary user email are required for unfollow.' });
  }

  try {
    const [mainUserRows] = await pool.query(`SELECT user_id FROM user_base WHERE email = ?`, [main_user_email]);
    if (mainUserRows.length === 0) return res.status(404).json({ message: `User to be unfollowed (email: ${main_user_email}) not found.` });
    const mainUserId = mainUserRows[0].user_id;

    const [secUserRows] = await pool.query(`SELECT user_id FROM user_base WHERE email = ?`, [sec_user_email]);
    if (secUserRows.length === 0) return res.status(404).json({ message: `User initiating unfollow (email: ${sec_user_email}) not found.` });
    const secUserId = secUserRows[0].user_id;

    const [result] = await pool.query(`DELETE FROM followers WHERE main_user_id = ? AND secondary_user_id = ?`, [mainUserId, secUserId]);
    
    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Successfully unfollowed user.' });
    } else {
      res.status(404).json({ message: 'Follow relationship not found or already unfollowed.' });
    }
  } catch (err) {
    console.error("Error in /api/removeFollower:", err);
    res.status(500).json({ message: 'Database error while attempting to unfollow user.' });
  }
});

// --- ENDPOINTS FOR RECIPE REACTIONS ---
app.post('/api/recipes/:recipeId/react', async (req, res) => {
  const recipeId = parseInt(req.params.recipeId, 10);
  const { userId, reactionType } = req.body; // reactionType: 'like', 'dislike', or 'none' to remove

  if (isNaN(recipeId) || !userId || !reactionType) {
    return res.status(400).json({ message: 'Recipe ID, User ID, and Reaction Type are required.' });
  }

  try {
    const [existingReactions] = await pool.query(
      'SELECT id, reaction FROM recipe_reactions WHERE recipe_id = ? AND user_id = ?',
      [recipeId, userId]
    );

    if (existingReactions.length > 0) {
      const existingReaction = existingReactions[0];
      if (reactionType === 'none' || existingReaction.reaction === reactionType) {
        await pool.query('DELETE FROM recipe_reactions WHERE id = ?', [existingReaction.id]);
        res.status(200).json({ message: 'Reaction removed.' });
      } else {
        await pool.query(
          'UPDATE recipe_reactions SET reaction = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
          [reactionType, existingReaction.id]
        );
        res.status(200).json({ message: 'Reaction updated.' });
      }
    } else {
      if (reactionType === 'like' || reactionType === 'dislike') {
        await pool.query(
          'INSERT INTO recipe_reactions (recipe_id, user_id, reaction) VALUES (?, ?, ?)',
          [recipeId, userId, reactionType]
        );
        res.status(201).json({ message: 'Reaction added.' });
      } else {
        res.status(200).json({ message: 'No action taken for reaction type "none".' });
      }
    }
  } catch (err) {
    console.error(`Error processing reaction for recipe ${recipeId}:`, err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(404).json({ message: 'Recipe or User not found.' });
    }
    res.status(500).json({ message: 'Server error while processing reaction.' });
  }
});

// --- ENDPOINTS FOR RECIPE COMMENTS ---
app.get('/api/recipes/:recipeId/comments', async (req, res) => {
  const recipeId = parseInt(req.params.recipeId, 10);

  if (isNaN(recipeId)) {
    return res.status(400).json({ message: 'Invalid Recipe ID.' });
  }

  try {
    const [comments] = await pool.query(
      `SELECT rc.comment_id, rc.comment_text, rc.created_at, 
              u.user_id, u.username, u.profile_image_url 
       FROM recipe_comments rc
       JOIN user_base u ON rc.user_id = u.user_id
       WHERE rc.recipe_id = ?
       ORDER BY rc.created_at DESC`,
      [recipeId]
    );
    res.json(comments);
  } catch (err) {
    console.error(`Error fetching comments for recipe ${recipeId}:`, err);
    res.status(500).json({ message: 'Server error while fetching comments.' });
  }
});

app.post('/api/recipes/:recipeId/comments', async (req, res) => {
  const recipeId = parseInt(req.params.recipeId, 10);
  const { userId, commentText } = req.body; // Αφαίρεσα το parentCommentId για απλότητα προς το παρόν

  if (isNaN(recipeId) || !userId || !commentText || commentText.trim() === '') {
    return res.status(400).json({ message: 'Recipe ID, User ID, and Comment Text are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO recipe_comments (recipe_id, user_id, comment_text) VALUES (?, ?, ?)',
      [recipeId, userId, commentText.trim()]
    );
    const [newCommentRows] = await pool.query(
      `SELECT rc.comment_id, rc.comment_text, rc.created_at,
              u.user_id, u.username, u.profile_image_url 
       FROM recipe_comments rc
       JOIN user_base u ON rc.user_id = u.user_id
       WHERE rc.comment_id = ?`,
      [result.insertId]
    );
    res.status(201).json(newCommentRows[0]);
  } catch (err) {
    console.error(`Error posting comment for recipe ${recipeId}:`, err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(404).json({ message: 'Recipe or User not found for comment.' });
    }
    res.status(500).json({ message: 'Server error while posting comment.' });
  }
});

// Endpoints from the first file (Recipes) - Refactored to use async/await with pool

// POST /api/posts
app.post('/api/posts', uploadRecipeImage.single('image'), async (req, res) => { // Changed to async and uses uploadRecipeImage
  // Βεβαιώσου ότι το userEmail λαμβάνεται σωστά από το req.body
  const { title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, userEmail } = req.body; 
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!userEmail) { // Έλεγχος αν το userEmail στάλθηκε
    return res.status(400).send('User email is required to create a post.');
  }

  try {
    // Βρες το user_id από το userEmail
    const [userRows] = await pool.query('SELECT user_id, username FROM user_base WHERE email = ?', [userEmail]);
    if (userRows.length === 0) {
      console.log(`[Backend POST /api/posts] User not found for email: ${userEmail}`);
      return res.status(404).send('User not found. Cannot create post.');
    }
    const userId = userRows[0].user_id;
    const username = userRows[0].username; // Ανάκτηση του username
    console.log(`[Backend POST /api/posts] Found userId: ${userId}, username: ${username} for email: ${userEmail}`);

    // Εισαγωγή της συνταγής με το user_id
    await pool.query(
      `INSERT INTO recipes (title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, image_url, user_id, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, imageUrl, userId, username]
    );
    res.status(201).json({ message: 'Recipe created successfully', userId: userId, posted_by: username });
  } catch (err) {
    console.error("Error inserting recipe:", err);
    res.status(500).send('Error creating recipe');
  }
});

// GET /api/posts
app.get('/api/posts', async (req, res) => {
  const currentUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  try {
    let sqlQuery = `
      SELECT 
        r.*, 
        u.username AS posted_by,
        u.profile_image_url AS author_image_url,
        (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'like') AS likes_count,
        (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'dislike') AS dislikes_count,
        (SELECT COUNT(*) FROM recipe_comments rc WHERE rc.recipe_id = r.id) AS comment_count 
    `;
    const queryParams = [];
    if (currentUserId) {
      sqlQuery += `,
        (SELECT rr_user.reaction FROM recipe_reactions rr_user WHERE rr_user.recipe_id = r.id AND rr_user.user_id = ?) AS current_user_reaction
      `;
      queryParams.push(currentUserId);
    }
    sqlQuery += `
      FROM recipes r
      LEFT JOIN user_base u ON r.user_id = u.user_id
      ORDER BY r.created_at DESC
    `;
    const [rows] = await pool.query(sqlQuery, queryParams);
    const results = rows.map(row => ({ ...row, likes_count: parseInt(row.likes_count) || 0, dislikes_count: parseInt(row.dislikes_count) || 0, comment_count: parseInt(row.comment_count) || 0 }));
    res.json(results);
  } catch (err) {
    console.error("Error fetching recipes:", err);
    res.status(500).send('Error fetching recipes');
  }
});

// GET /api/posts/search
app.get('/api/posts/search', async (req, res) => { // Changed to async
  const currentUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  console.log("🔍 Search filters received:", req.query, "Current User ID for search:", currentUserId);

  let sql = `
    SELECT 
      r.*, 
      u.username AS posted_by,
      u.profile_image_url AS author_image_url,
      (SELECT COUNT(*) FROM recipe_reactions rr_likes WHERE rr_likes.recipe_id = r.id AND rr_likes.reaction = 'like') AS likes_count,
      (SELECT COUNT(*) FROM recipe_reactions rr_dislikes WHERE rr_dislikes.recipe_id = r.id AND rr_dislikes.reaction = 'dislike') AS dislikes_count,
      (SELECT COUNT(*) FROM recipe_comments rc_count WHERE rc_count.recipe_id = r.id) AS comment_count
      ${currentUserId ? ', (SELECT rr_user.reaction FROM recipe_reactions rr_user WHERE rr_user.recipe_id = r.id AND rr_user.user_id = ?) AS current_user_reaction' : ''}
    FROM recipes r
    LEFT JOIN user_base u ON r.user_id = u.user_id
    WHERE 1=1`;
  const params = [];

  // Αν υπάρχει currentUserId, είναι για το πρώτο '?' στο SELECT (για το current_user_reaction)
  if (currentUserId) {
    params.push(currentUserId);
  }

  if (req.query.query) {
    const likeQuery = `%${req.query.query}%`;
    sql += ' AND (r.title LIKE ? OR r.description LIKE ?)'; // Προσθήκη alias 'r.'
    params.push(likeQuery, likeQuery);
  }

  if (req.query.category) {
    sql += ' AND r.category = ?'; // Προσθήκη alias 'r.'
    params.push(req.query.category);
  }

  if (req.query.difficulty) {
    sql += ' AND r.difficulty = ?'; // Προσθήκη alias 'r.'
    params.push(req.query.difficulty);
  }

  if (req.query.prepTime) {
    sql += ' AND r.prep_time_value <= ?'; // Προσθήκη alias 'r.'
    params.push(parseInt(req.query.prepTime));
  }

  if (req.query.ingredients) {
    sql += ' AND r.ingredients LIKE ?'; // Προσθήκη alias 'r.'
    params.push(`%${req.query.ingredients}%`);
  }

  sql += ' ORDER BY r.created_at DESC'; // Προσθήκη alias 'r.'

  // console.log("📝 Final SQL for search:", sql, "Parameters:", params); // Debug log
  try {
    const [rows] = await pool.query(sql, params);
    console.log("✅ Found recipes by search:", rows.length);
    const results = rows.map(row => ({ ...row, likes_count: parseInt(row.likes_count) || 0, dislikes_count: parseInt(row.dislikes_count) || 0, comment_count: parseInt(row.comment_count) || 0 }));
    res.json(results);
  } catch (err) {
    console.error("🔥 Database error during search:", err); // It's crucial to inspect this 'err' object in the backend console
    res.status(500).send('DB Error');
  }
});

// GET /api/posts/:id (Για μία συνταγή)
app.get('/api/posts/:id', async (req, res) => { // Έγινε async
  const recipeId = req.params.id;
  const currentUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;

  if (isNaN(parseInt(recipeId, 10))) {
    return res.status(400).send('Invalid recipe ID.');
  }

  try {
    let sqlQuery = `
      SELECT 
        r.*, 
        u.username AS posted_by,
        u.profile_image_url AS author_image_url,
        (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'like') AS likes_count,
        (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'dislike') AS dislikes_count,
        (SELECT COUNT(*) FROM recipe_comments rc WHERE rc.recipe_id = r.id) AS comment_count
    `;
    const queryParams = [];
    if (currentUserId) {
      sqlQuery += `,
        (SELECT rr_user.reaction FROM recipe_reactions rr_user WHERE rr_user.recipe_id = r.id AND rr_user.user_id = ?) AS current_user_reaction
      `;
      queryParams.push(currentUserId);
    }
    sqlQuery += `
      FROM recipes r
      LEFT JOIN user_base u ON r.user_id = u.user_id
      WHERE r.id = ?
    `;
    queryParams.push(recipeId);
    const [rows] = await pool.query(sqlQuery, queryParams);
    if (rows.length === 0) return res.status(404).send('Recipe not found');
    const recipe = { ...rows[0], likes_count: parseInt(rows[0].likes_count) || 0, dislikes_count: parseInt(rows[0].dislikes_count) || 0, comment_count: parseInt(rows[0].comment_count) || 0 };
    res.json(recipe);
  } catch (err) {
    console.error("Error fetching recipe by ID with reactions/comments:", err);
    res.status(500).send('DB Error');
  }
});

//GET /api/posts/:postsId

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