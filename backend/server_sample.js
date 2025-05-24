//URL --> ws://localhost:3000

const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
const server = require('http').createServer(app);
const webSocket = require('ws')

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

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:'localhost',
  user:'root',
  password:'',
  database:'softeng2025',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const PORT = 3000;

const wss = new webSocket.Server({ server:server })


//WEBSOCKET SERVER
wss.on('connection', async (ws) => {
  console.log('A new client has connected to the server!')
  // ws.send(JSON.stringify('Hello from the server!'));
  try {
    result = await pool.query(`select user_base.user_id, user_base.username, message_string.message, message.message_date, chat.chat_name, chat.chat_settings from message_string
                                left join message on message.message_id = message_string.message_id
                                  left join user_base on message.user_id = user_base.user_id
                                    left join chat on chat.chat_id = message.chat_id
                                      where message.chat_id=1;`)
    // console.log(result);
    ws.send(JSON.stringify(result[0]));
  }
  catch (err) {
    ws.send(JSON.stringify(`ERROR ${err}`))
  }

  ws.on('message', async (message) => {
    console.log(message);
    try {
      result = await pool.query(`call PostMessage("${message}",1,1)`)
      result = await pool.query(`select user_base.user_id, user_base.username, message_string.message, message.message_date, chat.chat_name, chat.chat_settings from message_string
                                    left join message on message.message_id = message_string.message_id
                                      left join user_base on message.user_id = user_base.user_id
                                        left join chat on chat.chat_id = message.chat_id
                                          where message.chat_id=1;`)
      // console.log(JSON.stringify(result[0]));
      wss.clients.forEach((client) => {
        client.send(JSON.stringify(result[0]));
      })
    }
    catch(err) {
      throw err;
    }
  })
})

//GET Endpoints

app.get('/', (req, res  ) => res.send('Hello World! Why are you here?'))

app.get('/api/hello', (req, res) => res.send('This is a sample message'));    

server.listen(PORT, () => {console.log(`Server Running on port ${PORT}`)})