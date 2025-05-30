import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import { ballots, ballot, candidate } from './src/models/VotingSystem.js';

// Import the new service classes
import DbService from './src/services/DbService.js';
import UserModel from './src/services/UserModel.js';
import RecipeModel from './src/services/RecipeModel.js';
import ChatModel from './src/services/ChatModel.js';
import AuthService from './src/services/AuthService.js';
import FileUploaderService from './src/services/FileUploaderService.js';
import { Admin } from './src/models/Admin.js';
import { authMiddleware, isAdminMiddleware } from './src/middleware/authMiddleware.js';

const app = express();
const server = http.createServer(app); // Create HTTP server for Express and WS
const wss = new WebSocketServer({ server: server }); // WebSocket server

const PORT = 5000;

const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());

// Initialize DB Service
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'softeng2025',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
const dbService = new DbService(dbConfig);

// Check database connection
dbService.pool.getConnection()
    .then(connection => {
        console.log('MySQL OK');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1); // Exit if DB connection fails
    });

// Initialize Models and Services with DbService dependency
const userModel = new UserModel(dbService);
const recipeModel = new RecipeModel(dbService);
const chatModel = new ChatModel(dbService);
const authService = new AuthService(dbService);
const fileUploaderService = new FileUploaderService();

// Endpoint για Login και δημιουργία JWT
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Χρησιμοποιήστε το authService για την αυθεντικοποίηση
        const isAuthenticated = await authService.authenticateUser(email, password);

        if (isAuthenticated) {
            // Αν η αυθεντικοποίηση είναι επιτυχής, πάρτε το user_id
            // (Το userModel είναι ήδη διαθέσιμο στο app.locals ή μπορείτε να το χρησιμοποιήσετε απευθείας εδώ)
            const userId = await app.locals.userModel.getUserIdByEmail(email);
            if (!userId) {
                 // Αυτό δεν θα έπρεπε να συμβεί αν η authenticateUser πέρασε
                 console.error(`User ${email} authenticated but ID not found.`);
                 return res.status(500).json({ message: "Authentication inconsistency." });
            }

            // Δημιουργία JWT Token
            // Βεβαιωθείτε ότι το JWT_SECRET είναι το ίδιο με αυτό στο authMiddleware.js
            const JWT_SECRET_FOR_SIGNING = process.env.JWT_SECRET || 'KeyForAuth'; // Αυτό πρέπει να είναι το ίδιο με το secret που χρησιμοποιείται στο authMiddleware
            const token = jwt.sign(
                { userId: userId /* Μπορείτε να προσθέσετε και άλλα δεδομένα όπως το rank αν θέλετε, αλλά το userId αρκεί */ },
                JWT_SECRET_FOR_SIGNING,
                { expiresIn: '1h' } // π.χ. λήξη σε 1 ώρα, ή '7d' για 7 ημέρες
            );

            // Επιστρέψτε το token στον client
            // Ο client θα πρέπει να το αποθηκεύσει (π.χ., σε localStorage)
            // και να το στέλνει σε κάθε αίτημα στο Authorization header.
            res.json({ message: "Login successful", token: token, userId: userId });
        } else {
            res.status(401).json({ message: "Invalid email or password." });
        }
    } catch (err) {
        console.error("Error in /api/login:", err);
        res.status(500).json({ message: 'Server Error during login.' });
    }
});

// Make UserModel available to middlewares via req.app.locals
app.locals.userModel = userModel;
app.locals.dbService = dbService; // Αν χρειαστεί και το dbService απευθείας

// Expose uploads directory statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Test image route (kept from the first file)
app.get('/test-image', (req, res) => {
    // Note: This file might not exist, ensure 'uploads/1746785144181.jpg' is present
    res.sendFile(path.join(process.cwd(), 'uploads', '1746785144181.jpg'));
});

const Ballots = new ballots();

// WEBSOCKET SERVER
wss.on('connection', async (ws) => {
    console.log('A new client has connected to the server!');
    let chat_id = 0;

    ws.on('message', async (m) => {
        try {
            const ClientResponse = JSON.parse(m);
            if (ClientResponse.type === 'id') {
                chat_id = ClientResponse.message;
                const messages = await chatModel.getMessagesForChat(chat_id);
                const serverRequest = {
                    type: 'old',
                    message: messages
                };
                ws.send(JSON.stringify(serverRequest));
            } else if (ClientResponse.type === 'test') {
                console.log(ClientResponse.message);
            }
            else if(ClientResponse.type == 'ballot') {
                const new_ballot = new ballot(ClientResponse.id, ClientResponse.name)
                ClientResponse.candidates.forEach((e) => {
                    new_ballot.addCandidate(e);
                })
                Ballots.addBallot(new_ballot)
                const ServerResponse = {
                    type: 'ballot index',
                    message: Ballots.length-1
                }
                try {
                    const result = await pool.query(`update chat set chat_settings = "ballot" where chat_id = ${chat_id}`)
                }
                catch(err) {
                    ServerResponse = {
                    type: 'error',
                    message: err
                    }
                    throw err;
                }
                ws.send(JSON.stringify(ServerResponse)) //Sending Ballot Index
                }
                else if(ClientResponse.type == 'winner') {
                const Winner = Ballots.winner(ClientResponse.index)
                try {
                    const result = await pool.query(`call postMessage("Winner: ${Winner}",18,${chat_id})`)
                    result = await pool.query(`update chat set chat_settings="none" where chat_id = ${chat_id}`)
                    const message = {
                    message: `Winner: ${Winner}`,
                    user_id: 18
                    }
                    ServerRequest = {
                    type: 'new',
                    message: message
                    };
                    ws.send(JSON.stringify(ServerRequest))
                }
                catch(err) {
                    const ServerResponse = {
                    type: 'error',
                    message: err
                    }
                    ws.send(JSON.stringify(ServerResponse))
                    throw err;
                    
                }
                }
                else if(ClientResponse.type == 'vote') {
                Ballots.vote(ClientResponse.index, ClientResponse.name)
                }
                else {
                // Assuming clientResponse.message contains { message: '...', user_id: ... }
                const { message, user_id } = ClientResponse.message;
                await chatModel.postMessage(message, user_id, chat_id);

                const serverRequest = {
                    type: 'new',
                    message: ClientResponse.message // Send back the original message for broadcast
                };
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(serverRequest));
                    }
                });
            }
        } catch (err) {
            console.error("WebSocket message error:", err);
            ws.send(JSON.stringify(`ERROR ${err.message}`));
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

app.get('/', (req, res) => {
    res.send('<h1>Welcome to the server homepage!<h1>');
});

// User Endpoints
app.get('/api/user_id/:email', async (req, res) => {
    try {
        const userId = await userModel.getUserIdByEmail(req.params.email);
        if (userId) {
            res.json({ user_id: userId });
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error("Error in /api/user_id/:email:", err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.json(users);
    } catch (err) {
        console.error("Error in /api/users:", err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/users/search', async (req, res) => {
    try {
        const users = await userModel.searchUsers(req.query.query);
        res.json(users);
    } catch (err) {
        console.error("Error in /api/users/search:", err);
        res.status(500).send('Server Error');
    }
});

app.post('/api/postRegisteredUser', async (req, res) => {
    try {
        await userModel.registerUser(req.body.username, req.body.password, req.body.email);
        res.sendStatus(201);
    } catch (err) {
        console.error("Error in /api/postRegisteredUser:", err);
        res.status(500).send('Server Error');
    }
});

app.post(`/api/newName`, async (req, res) => {
    try {
        await userModel.updateUsername(req.body.email, req.body.name);
        res.sendStatus(201);
    } catch (err) {
        console.error("Error in /api/newName:", err);
        res.status(500).send('Server Error');
    }
});

app.post(`/api/newBio`, async (req, res) => {
    try {
        await userModel.updateUserBio(req.body.email, req.body.bio);
        res.sendStatus(201);
    } catch (err) {
        console.error("Error in /api/newBio:", err);
        res.status(500).send('Server Error');
    }
});

app.post('/api/profile/pfp', fileUploaderService.uploadPfp.single('profileImage'), async (req, res) => {
    try {
        const { email } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No image file uploaded.' });
        if (!email) return res.status(400).json({ message: 'Email is required to update profile picture.' });

        const imageUrlPath = `/uploads/pfp/${req.file.filename}`;
        await userModel.updateProfilePicture(email, imageUrlPath);
        res.status(200).json({ message: 'Profile picture updated successfully.', imageUrl: `http://localhost:${PORT}${imageUrlPath}` });
    } catch (err) {
        console.error("Error in /api/profile/pfp:", err);
        res.status(500).json({ message: 'Server error while updating profile picture.' });
    }
});

app.get('/api/getAuth/:user', async (req, res) => {
    try {
        const user = JSON.parse(req.params.user);
        const isAuthenticated = await authService.authenticateUser(user.email, user.password);
        if (isAuthenticated) {
            res.send("Found");
        } else {
            res.send("Not Found");
        }
    } catch (err) {
        console.error("Error in /api/getAuth/:user:", err);
        res.status(500).send('Server Error');
    }
});

app.get(`/api/my_profile_info/:email`, async (req, res) => {
    try {
        const profileInfo = await userModel.getMyProfileInfo(req.params.email);
        if (profileInfo) {
            res.json(profileInfo);
        } else {
            res.status(404).send('Profile not found');
        }
    } catch (err) {
        console.error("Error in /api/my_profile_info/:email:", err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/follower_count/:id', async (req, res) => {
    try {
        const count = await userModel.getFollowerCount(req.params.id);
        if (count !== null) {
            res.json({ follower_count: count });
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error("Error in /api/follower_count/:id:", err);
        res.status(500).send('Server Error');
    }
});

app.get(`/api/profile_info/:id`, async (req, res) => {
    try {
        const profileInfo = await userModel.getProfileInfoById(req.params.id);
        if (profileInfo) {
            res.json(profileInfo);
        } else {
            res.status(404).send('Profile not found');
        }
    } catch (err) {
        console.error("Error in /api/profile_info/:id:", err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/followers/:user', async (req, res) => {
    try {
        const followers = await userModel.getFollowers(req.params.user);
        res.json(followers);
    } catch (err) {
        console.error("Error in /api/followers/:user:", err);
        res.status(500).send('Server Error');
    }
});

app.post(`/api/postFollower`, async (req, res) => {
    try {
        const { main_user, sec_user } = req.body;
        await userModel.addFollower(main_user, sec_user);
        res.send('success');
    } catch (err) {
        console.error('[POST /api/postFollower] Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.post(`/api/removeFollower`, async (req, res) => {
    try {
        const { main_user_email, sec_user_email } = req.body;
        const success = await userModel.removeFollower(main_user_email, sec_user_email);
        if (success) {
            res.status(200).json({ message: 'Successfully unfollowed user.' });
        } else {
            res.status(404).json({ message: 'Follow relationship not found or already unfollowed.' });
        }
    } catch (err) {
        console.error("Error in /api/removeFollower:", err);
        res.status(500).json({ message: 'Server error while attempting to unfollow user.' });
    }
});

// Chat Endpoints
app.get('/api/chats/:email', async (req, res) => {
    try {
        const chats = await chatModel.getChatsForUser(req.params.email);
        res.json(chats);
    } catch (err) {
        console.error("Error in /api/chats/:email:", err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/messages/:chat', async (req, res) => {
    try {
        const messages = await chatModel.getMessagesForChat(req.params.chat);
        res.json(messages);
    } catch (err) {
        console.error("Error in /api/messages/:chat:", err);
        res.status(500).send('Server Error');
    }
});

app.post('/api/postChat', async (req, res) => {
    try {
        const { chat_name, chat_users, user_email } = req.body;
        await chatModel.createChat(chat_name, chat_users, user_email);
        res.sendStatus(201);
    } catch (err) {
        console.error("Error in /api/postChat:", err);
        res.status(500).send('Server Error');
    }
});

// Recipe Endpoints
app.post('/api/posts', fileUploaderService.uploadRecipeImage.single('image'), async (req, res) => {
    try {
        const { title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, userEmail } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        if (!userEmail) return res.status(400).send('User email is required to create a post.');

        const result = await recipeModel.createRecipe({
            title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, imageUrl, userEmail
        });
        res.status(201).json({ message: 'Recipe created successfully', userId: result.userId, posted_by: result.username });
    } catch (err) {
        console.error("Error in /api/posts (POST):", err);
        res.status(500).send('Error creating recipe');
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const currentUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;
        const recipes = await recipeModel.getAllRecipes(currentUserId);
        res.json(recipes);
    } catch (err) {
        console.error("Error in /api/posts (GET):", err);
        res.status(500).send('Error fetching recipes');
    }
});

app.get('/api/posts/search', async (req, res) => {
    try {
        const currentUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;
        const recipes = await recipeModel.searchRecipes(req.query, currentUserId);
        res.json(recipes);
    } catch (err) {
        console.error("Error in /api/posts/search:", err);
        res.status(500).send('Server Error');
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        const currentUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;
        if (isNaN(recipeId)) return res.status(400).send('Invalid recipe ID.');

        const recipe = await recipeModel.getRecipeById(recipeId, currentUserId);
        if (recipe) {
            res.json(recipe);
        } else {
            res.status(404).send('Recipe not found');
        }
    } catch (err) {
        console.error("Error in /api/posts/:id:", err);
        res.status(500).send('Server Error');
    }
});

app.post('/api/recipes/:recipeId/react', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.recipeId, 10);
        const { userId, reactionType } = req.body;
        if (isNaN(recipeId) || !userId || !reactionType) {
            return res.status(400).json({ message: 'Recipe ID, User ID, and Reaction Type are required.' });
        }
        const message = await recipeModel.handleRecipeReaction(recipeId, userId, reactionType);
        res.status(200).json({ message });
    } catch (err) {
        console.error(`Error in /api/recipes/:recipeId/react:`, err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error while processing reaction.' });
    }
});


// Endpoint for reporting a recipe
app.post('/api/recipes/:recipeId/report', authMiddleware, async (req, res) => {
    try {
        const recipeId = parseInt(req.params.recipeId, 10);
        const reportingUserId = req.user.user_id; // From authMiddleware
        const { reason, notes } = req.body;

        if (isNaN(recipeId)) {
            return res.status(400).json({ message: 'Invalid recipe ID.' });
        }
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Reason for reporting is required.' });
        }

        // Check if recipe exists
        const [recipeExists] = await dbService.query('SELECT id FROM recipes WHERE id = ?', [recipeId]);
        if (recipeExists.length === 0) {
            return res.status(404).json({ message: 'Recipe to report not found.' });
        }

        await dbService.query(
            'INSERT INTO reports (reporting_user_id, reported_recipe_id, reason, user_notes, status) VALUES (?, ?, ?, ?, ?)',
            [reportingUserId, recipeId, reason, notes || null, 'pending']
        );

        res.status(201).json({ message: 'Report submitted successfully.' });

    } catch (err) {
        console.error(`Error in POST /api/recipes/${req.params.recipeId}/report:`, err);
        res.status(500).json({ message: 'Server error while submitting report.' });
    }
});

// Endpoint for reporting a comment
app.post('/api/comments/:commentId/report', authMiddleware, async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId, 10);
        const reportingUserId = req.user.user_id; // From authMiddleware
        const { reason, notes } = req.body;

        if (isNaN(commentId)) {
            return res.status(400).json({ message: 'Invalid comment ID.' });
        }
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Reason for reporting is required.' });
        }

        // Check if comment exists
        const [commentExists] = await dbService.query('SELECT comment_id FROM recipe_comments WHERE comment_id = ?', [commentId]);
        if (commentExists.length === 0) {
            return res.status(404).json({ message: 'Comment to report not found.' });
        }

        await dbService.query(
            'INSERT INTO reports (reporting_user_id, reported_comment_id, reason, user_notes, status) VALUES (?, ?, ?, ?, ?)',
            [reportingUserId, commentId, reason, notes || null, 'pending']
        );

        res.status(201).json({ message: 'Comment report submitted successfully.' });

    } catch (err) {
        console.error(`Error in POST /api/comments/${req.params.commentId}/report:`, err);
        res.status(500).json({ message: 'Server error while submitting comment report.' });
    }
});


app.get('/api/recipes/:recipeId/comments', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.recipeId, 10);
        if (isNaN(recipeId)) return res.status(400).json({ message: 'Invalid Recipe ID.' });
        const comments = await recipeModel.getRecipeComments(recipeId);
        res.json(comments);
    } catch (err) {
        console.error(`Error in /api/recipes/:recipeId/comments (GET):`, err);
        res.status(500).json({ message: 'Server error while fetching comments.' });
    }
});

app.post('/api/recipes/:recipeId/comments', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.recipeId, 10);
        const { userId, commentText } = req.body;
        if (isNaN(recipeId) || !userId || !commentText || commentText.trim() === '') {
            return res.status(400).json({ message: 'Recipe ID, User ID, and Comment Text are required.' });
        }
        const newComment = await recipeModel.addRecipeComment(recipeId, userId, commentText.trim());
        res.status(201).json(newComment);
    } catch (err) {
        console.error(`Error in /api/recipes/:recipeId/comments (POST):`, err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error while posting comment.' });
    }
});

app.get(`/api/profile_recipies/:id`, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) return res.status(400).send('Invalid user ID.');
        const recipes = await recipeModel.getRecipesByUserId(userId);
        res.json(recipes);
    } catch (err) {
        console.error("Error in /api/profile_recipies/:id:", err);
        res.status(500).send('Server Error');
    }
});

app.get(`/api/recipes/:id`, async (req, res) => { // This endpoint name is ambiguous, consider renaming if it's for gallery recipes
    try {
        const galleryId = parseInt(req.params.id, 10);
        if (isNaN(galleryId)) return res.status(400).send('Invalid gallery ID.');
        const recipes = await recipeModel.getRecipesByGalleryId(galleryId);
        res.json(recipes);
    } catch (err) {
        console.error("Error in /api/recipes/:id (for gallery):", err);
        res.status(500).send('Server Error');
    }
});



// Endpoint για επεξεργασία προφίλ χρήστη από Admin
app.put('/api/admin/users/:targetUserId/edit', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const adminUserData = req.user; // Δεδομένα του admin που κάνει την ενέργεια (από το authMiddleware)
        const targetUserId = parseInt(req.params.targetUserId, 10);
        const newData = req.body;

        if (isNaN(targetUserId)) {
            return res.status(400).json({ message: 'Invalid target user ID.' });
        }

        // Δημιουργία instance της κλάσης Admin
        // Το dbService είναι ήδη αρχικοποιημένο και διαθέσιμο (π.χ. app.locals.dbService ή απευθείας)
        const adminInstance = new Admin(dbService, adminUserData);

        const result = await adminInstance.editUserProfile(targetUserId, newData);
        res.status(200).json(result);

    } catch (err) {
        console.error(`Error in PUT /api/admin/users/${req.params.targetUserId}/edit:`, err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('Invalid rank value') || err.message.includes('No valid data')) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message.includes('not an admin')) { // Από τον constructor του Admin
             return res.status(403).json({ message: "Forbidden: Authenticated user is not an admin."});
        }
        res.status(500).json({ message: err.message || 'Server Error during user profile edit.' });
    }
});

// Endpoint για διαγραφή προφίλ χρήστη από Admin
app.delete('/api/admin/users/:targetUserId', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const adminUserData = req.user;
        const targetUserId = parseInt(req.params.targetUserId, 10);

        if (isNaN(targetUserId)) {
            return res.status(400).json({ message: 'Invalid target user ID.' });
        }

        const adminInstance = new Admin(dbService, adminUserData);
        const result = await adminInstance.deleteUserProfile(targetUserId);
        res.status(200).json(result);

    } catch (err) {
        console.error(`Error in DELETE /api/admin/users/${req.params.targetUserId}:`, err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('cannot delete their own account')) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message.includes('not an admin')) {
             return res.status(403).json({ message: "Forbidden: Authenticated user is not an admin."});
        }
        res.status(500).json({ message: err.message || 'Server Error during user deletion.' });
    }
});

// Endpoint για διαχείριση αναφορών από Admin
app.post('/api/admin/reports/:reportId/handle', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const adminUserData = req.user;
        const reportId = parseInt(req.params.reportId, 10);
        const { action, adminNotes } = req.body; // action: 'resolved', 'dismissed', 'action_taken'

        if (isNaN(reportId)) {
            return res.status(400).json({ message: 'Invalid report ID.' });
        }
        if (!action) {
            return res.status(400).json({ message: 'Action is required.' });
        }

        const adminInstance = new Admin(dbService, adminUserData);
        const result = await adminInstance.handleReport(reportId, action, adminNotes);
        res.status(200).json(result);

    } catch (err) {
        console.error(`Error in POST /api/admin/reports/${req.params.reportId}/handle:`, err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message.includes('Invalid action')) {
            return res.status(400).json({ message: err.message });
        }
         if (err.message.includes('not an admin')) {
             return res.status(403).json({ message: "Forbidden: Authenticated user is not an admin."});
        }
        res.status(500).json({ message: err.message || 'Server Error during report handling.' });
    }
});

// Endpoint για να παίρνει ο admin μια λίστα με όλες τις αναφορές
app.get('/api/admin/reports', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        // const adminUserData = req.user; // Δεδομένα του admin από το authMiddleware (αν χρειάζονται για κάτι συγκεκριμένο)

        const query = `
            SELECT
                r.report_id,
                r.reporting_user_id,
                reporter.username AS reporting_username,
                r.reported_user_id,
                reported_user.username AS reported_username,
                r.reported_recipe_id,
                rec.title AS reported_recipe_title,
                r.reported_comment_id,
                LEFT(rc.comment_text, 100) AS reported_comment_snippet,
                r.reason,
                r.user_notes,
                r.admin_notes,
                r.status,
                r.resolved_at,
                resolver.username AS resolved_by_admin_username,
                r.created_at AS report_created_at
            FROM reports r
            JOIN user_base reporter ON r.reporting_user_id = reporter.user_id
            LEFT JOIN user_base reported_user ON r.reported_user_id = reported_user.user_id
            LEFT JOIN recipes rec ON r.reported_recipe_id = rec.id
            LEFT JOIN recipe_comments rc ON r.reported_comment_id = rc.comment_id
            LEFT JOIN user_base resolver ON r.resolved_by_admin_id = resolver.user_id
            ORDER BY r.status = 'pending' DESC, r.created_at DESC
        `;
        const [reports] = await dbService.query(query);
        res.status(200).json(reports);
    } catch (err) {
        console.error("Error in GET /api/admin/reports:", err);
        res.status(500).json({ message: err.message || 'Server Error fetching reports for admin.' });
    }
});

// Endpoint για να παίρνει ο admin μια λίστα χρηστών
app.get('/api/admin/users', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        // Χρησιμοποιούμε την υπάρχουσα μέθοδο userModel.getAllUsers()
        // Βεβαιωθείτε ότι επιστρέφει τα πεδία που χρειάζεται ο admin
        // (user_id, username, email, rank, etc.)
        const users = await userModel.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error in GET /api/admin/users:", err);
        res.status(500).json({ message: 'Server Error fetching users for admin.' });
    }
});

//POST gal_rec
app.post(`/api/gal_rec`, async (req, res) => {
  const message = req.body;
  // console.log(message);

  try {
    const result = await dbService.query(`insert into gal_rec(gallery_id, recipe_id) values (${message.gal},${message.rec})`);
    res.sendStatus(200);
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

//POST add gal
app.post(`/api/add_gal`, async (req, res) => {
  const message = req.body;

  try {
    const result1 =  await dbService.query(`select user_id from user_base where email = "${message.email}"`)
    const result2 = await dbService.query(`INSERT INTO gallery(gallery_name, gallery_img_url, user_id) values ("${message.newGal}",'NaN',${result1[0][0].user_id})`)
    res.sendStatus(201)
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

//DELETE galleries
app.delete(`/api/galleries/:ids`, async (req, res) => {
  const message = JSON.parse(req.params.ids);

  try {
    for (const e of message) {
      await dbService.query(`delete from gallery where gallery_id=${e}`)
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
      await dbService.query(`delete from gal_rec where gallery_id = ${message.gal} and recipe_id = ${e}`);
    }
    res.sendStatus(200);
  }
  catch(err) {
    res.sendStatus(500);
    throw err;
  }
})

//GET galleries
app.get('/api/galleries/:email' , async (req, res) => {
  const email = req.params.email;
  try {
    const result = await dbService.query(`select gallery_id, gallery_name, gallery_img_url from gallery 
                                    join user_base on user_base.user_id = gallery.user_id
                                    where email = "${email}";`);
    res.json(JSON.stringify(result[0]));
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
    const [rows] = await dbService.query(`SELECT recipes.* FROM recipes WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching profile recipes:", err);
    res.status(500).send('DB Error');
  }
});

//GET recipies for gallery
app.get(`/api/gal_recipes/:id` , async (req, res) => {
  const gallery_id = req.params.id;

  try {
    const result = await dbService.query(`select * from gal_rec 
                                join recipes on gal_rec.recipe_id = recipes.id
                                  where gallery_id=${gallery_id}`);
    res.json(JSON.stringify(result[0]));
  }
  catch(err) {
    res.status(500);
    throw err
  }
})


// Start the server using the http server instance
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`HTTP: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
});