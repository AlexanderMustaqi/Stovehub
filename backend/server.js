//URL --> //localhost:5000

const mysql = require('mysql2/promise');
const cors = require('cors');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const webSocket = require('ws');
const { ClientRequest } = require('http');
const PORT = 5000;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

//CLASSES

class candidate{
  votes = 0;
  constructor(name){
    this.name = name;
  }

  plus = () => {
    votes++;
  }
}

class ballot{
  candidates = [];
  constructor(chat_id, name){
    this.chat_id = chat_id
    this.name = name
  }

  addCandidate = (name) => {
    const newCandidate = new candidate(name);
    this.candidates.push(newCandidate);
  }

  winner = () => {
    if (this.candidates.length == 0) return []
    let winner = this.candidates[0]
    let winners = [];
    winners.push(winner);
    this.candidates.forEach((e) => {
      if (e.votes > winner.votes) {winners.splice(0, winners.length);winner = e;winners.push(winner)}
      else if (e.votes == winner.votes) winners.push(e) 
    })
    if (winners.length > 1) return winners
    else return [winner]
  }
}

//Database Connection
const pool = mysql.createPool({
  host:'localhost',
  user:'root',
  password:'',
  database:'softeng2025',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

//WEBSOCKET SERVER

let ballots = []

const wss = new webSocket.Server({ server:server })

wss.on('connection', async (ws) => {
  console.log('A new client has connected to the server!')
  let chat_id = 0;

  ws.on('message', async (m) => {
    const ClientResponse = JSON.parse(m);
    if(ClientResponse.type == 'id') {
      chat_id = ClientResponse.message;
      try {
        result = await pool.query(`select user_base.user_id, user_base.username, message_string.message, message.message_date, chat.chat_name, chat.chat_settings from message_string
                                    left join message on message.message_id = message_string.message_id
                                      left join user_base on message.user_id = user_base.user_id
                                        left join chat on chat.chat_id = message.chat_id
                                          where message.chat_id=${chat_id};`);
        const ServerRequest = {
          type: 'old',
          message: result[0]
        };
        ws.send(JSON.stringify(ServerRequest));
      }
      catch (err) {
        ws.send(JSON.stringify(`ERROR ${err}`))
        throw err;
      }
    }
    else if(ClientResponse.type == 'test') {
      console.log(ClientResponse.message);
    } 
    else if(ClientResponse.type == 'ballot') {
      const new_ballot = new ballot(ClientResponse.id, ClientResponse.name)
      ClientResponse.candidates.forEach((e) => {
        new_ballot.addCandidate(e);
      })
      ballots.push(new_ballot)
      const ServerResponse = {
        type: 'ballot index',
        message: ballots.length-1
      }
      ws.send(JSON.stringify(ServerResponse)) //Sending Ballot Index
    }
    else if(ClientResponse.type == 'winner') {
      const ServerResponse = {
        type: 'winner',
        message: ballots[ClientResponse.index].winner()
      }
      ws.send(JSON.stringify(ServerResponse)) //Sending Ballot Winner
    }
    else if(ClientResponse.type == 'vote') {
      ballots[ClientResponse.index].candidates.forEach((e) => {if (e.name == `${ClientResponse.name}`) e.plus()})
    }
    else {
      try {
        result = await pool.query(`call PostMessage("${ClientResponse.message.message}",${ClientResponse.message.user_id},${chat_id})`);
        ServerRequest = {
          type: 'new',
          message: ClientResponse.message
        };
        wss.clients.forEach((client) => {
          client.send(JSON.stringify(ServerRequest));
        })
      }
      catch(err) {
        throw err;
      }
    }
    
  })
})


//HTTP Verbs & Routes

//Endpoints

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the server homepage!<h1>');  
})

//GET user_id

app.get('/api/user_id/:email', async (req, res) => {
  const email = req.params.email
  
  try {
    const ClientRequest = await pool.query(`select user_id from user_base where email = ${email}`);
    res.json(JSON.stringify(ClientRequest[0]));
  }
  catch (err) {
    res.status(500);
    throw err;
  }
})

//GET * users
app.get('/api/users', async (req, res) => {
    try {
      result = await pool.query('select * from user_base;');
      res.json(result[0]);
    }
    catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
})

//GET * chats for user_id
app.get('/api/chats/:email', async (req, res) => {
  const email = req.params.email;

  try {
    result = await pool.query(`select user_id from user_base where email='${email}';`);
    user_id = result[0][0]['user_id'];
    result = await pool.query(`select chat.chat_id, chat.chat_name from chat
                                left join chat_user on chat.chat_id = chat_user.chat_id
                                  where chat_user.user_id = ${user_id};`);
    res.json(result[0]);
  }
  catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
})

//GET messages for chat_id
app.get('/api/messages/:chat', async (req, res) => {
  const chat = req.params.chat;

  try{
    result = await pool.query(`select user_base.user_id, user_base.username, message_string.message, message.message_date, chat.chat_name, chat.chat_settings from message_string
                                left join message on message.message_id = message_string.message_id
                                  left join user_base on message.user_id = user_base.user_id
                                    left join chat on chat.chat_id = message.chat_id
                                      where message.chat_id=${chat};`)
    res.json(result[0]); 
  }
  catch(err) {
    throw err;
    res.sendStatus(500);
  }
})

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

//GET profile
app.get(`/api/profile_info/:email`, async (req,res) => {
  const email = req.params.email;

  try {
    const result = await pool.query(`select username, bio, rank from user_base where email = "${email}"`);
    // console.log(result[0]);
    res.send(JSON.stringify(result[0]));
  }
  catch(err) {
    res.status(500);
    throw err;
  }
})

//GET galleries
app.get('/api/galleries/:email' , async (req, res) => {
  const email = req.params.email;
  try {
    result = await pool.query(`select gallery_id, gallery_name, gallery_image_url from gallery 
                                join user_base on user_base.user_id = gallery.user_id
                                  where email = ${email};`);
    res.json(JSON.stringify(result[0]));
  }
  catch(err) {
    res.status(500);
    throw err
  }
})

//GET recipies for gallery
app.get(`/api/gal_recipes/:id` , async (req, res) => {
  const gallery_id = req.params.id;

  try {
    result = await pool.query(`select * from gal_rec 
                                join recipes on gal_rec.recipe_id = recipes.id
                                  where gallery_id=${gallery_id}`);
    res.json(JSON.stringify(result[0]));
  }
  catch(err) {
    res.status(500);
    throw err
  }
})

//GET authentication
app.get('/api/getAuth/:user', async (req, res) => {
  const ClientRequest = req.params.user;
  const user = JSON.parse(ClientRequest);

  try {
    result = await pool.query(`select count(*) as c from user_base
                                where user_base.email = "${user.email}" AND password="${user.password}";`)
    if (result[0][0].c == 1) (res.send("Found"))
    else {res.send("Not Found")};
  }
  catch (err) {
    res.sendStatus(500);
    throw err;
  }
})

//GET posts
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



//POST chat
app.post('/api/postChat', async (req, res) => {
  const ClientRequest = req.body;
  // console.log(ClientRequest);
  const { chat_name, chat_users, user_email} = ClientRequest;
  var userId;
  let connection

  try {
    result = await pool.query(`select user_id from user_base where email = ${user_email}`)
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

    res.status(500);
    throw err;
  }
  finally {
    if (connection) connection.release();
  }
})

//POST registeredUser
app.post('/api/postRegisteredUser', async (req, res) => {
  const message = req.body;

  try {
    post = await pool.query(`call postRegisteredUser("${message.username}", "${message.password}", "${message.email}")`);
    res.sendStatus(201);
  }
  catch (err) {
    res.sendStatus(500);
    throw err;
  }
})

//POST new follower
app.post(`/api/postFollower`, async (req, res) => {
  const message = req.body;

  try {
    result = await pool.query(`select user_id from user_base where email="${message.main_user}"`);
    const m_user = result[0];
    result = await pool.query(`select user_id from user_base where email="${message.sec_user}"`);
    const s_user = result[0];
    post = await pool.query(`insert into followers(main_user_id, secondary_user_id) values (${m_user},${s_user})`)
    res.send('success');
  }
  catch (err) {
    res.status(500);
    throw err;
  }
})

//POST new name
app.post(`/api/newName`, async (req, res) => {
  const message = req.body;

  try {
    result = await pool.query(`update user_base set username="${message.name}" where email="${message.email}"`);
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
    result = await pool.query(`update user_base set bio="${message.bio}" where email="${message.email}"`);
    res.sendStatus(201);
  }
  catch(err) {
    res.status(500);
    throw err;
  }
})

//POST add gal
app.post(`/api/add_gal`, async (req, res) => {
  const message = req.body;

  try {
    const result1 =  await pool.query(`select user_id from user_base where email = "${message.email}"`)
    const result2 = await pool.query(`INSERT INTO gallery(gallery_name, gallery_image_url, user_id) values ("${message.newGal}",'NaN',${result1[0][0].user_id})`)
    res.sendStatus(201)
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

//POST gal_rec
app.post(`/api/gal_rec`, async (req, res) => {
  const message = req.body;
  // console.log(message);

  try {
    const result = await pool.query(`insert into gal_rec(gallery_id, recipe_id) values (${message.gal},${message.rec})`);
    res.sendStatus(200);
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

//POST ballot

//DELETE galleries
app.delete(`/api/galleries/:ids`, async (req, res) => {
  const message = JSON.parse(req.params.ids);

  try {
    for (const e of message) {
      await pool.query(`delete from gallery where gallery_id=${e}`)
    }
    res.sendStatus(200);
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

//DELETE gal_rec
app.delete(`/api/gal_recipes/:message`, async(req, res) => {
  const message = JSON.parse(req.params.message);

  try { 
    for (const e of message.recs) {
      await pool.query(`delete from gal_rec where gallery_id = ${message.gal} and recipe_id = ${e}`);
    }
    res.sendStatus(200);
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

server.listen(PORT, () => {console.log(`Server is running in port ${PORT}`)})