import jwt from 'jsonwebtoken';
// Θα χρειαστούμε πρόσβαση στο userModel για να πάρουμε τα πλήρη στοιχεία του χρήστη.
// Πρέπει να βρούμε έναν τρόπο να το κάνουμε διαθέσιμο εδώ.
// Μια προσέγγιση είναι να το κάνουμε import απευθείας αν η αρχικοποίησή του δεν εξαρτάται από το request.
// Ωστόσο, το userModel αρχικοποιείται στο server.js με το dbService.
// Για τώρα, θα υποθέσουμε ότι μπορούμε να το κάνουμε import και θα δούμε πώς θα το συνδέσουμε.
// Μια καλύτερη λύση ίσως είναι να περνάμε το userModel ως παράμετρο κατά τη χρήση του middleware,
// ή να το κάνουμε export από το server.js και import εδώ.
//
// ΠΡΟΣΩΡΙΝΗ ΛΥΣΗ: Θα κάνουμε import το UserModel και θα το αρχικοποιήσουμε εδώ
// με ένα dbService που θα πρέπει επίσης να γίνει import. Αυτό δεν είναι ιδανικό
// γιατί δημιουργεί πολλαπλά instances ή απαιτεί το dbService να είναι singleton.
//
// ΚΑΛΥΤΕΡΗ ΠΡΟΣΕΓΓΙΣΗ: Το middleware θα πρέπει να δέχεται το userModel ως παράμετρο
// ή να το παίρνει από το `req.app.locals` αν το έχετε ορίσει εκεί.
//
// Για την απλότητα αυτού του παραδείγματος, θα δείξω πώς θα μπορούσε να γίνει
// αν το userModel ήταν προσβάσιμο. Στην πράξη, θα χρειαστεί να προσαρμόσετε
// τον τρόπο που το userModel γίνεται διαθέσιμο στο middleware.

// Ας υποθέσουμε ότι έχετε έναν τρόπο να πάρετε το userModel instance.
// Για παράδειγμα, αν το εξάγετε από το server.js (πράγμα που δεν είναι συνηθισμένο για το app instance)
// ή αν το middleware είναι μέρος μιας κλάσης που παίρνει το userModel στον constructor.

// Για τώρα, θα το αφήσω ως σχόλιο και θα δείξω τη λογική.
// import userModel from '../services/UserModel.js'; // Αυτό θα χρειαζόταν το dbService
// import dbService from '../services/DbService.js'; // Και αυτό θα χρειαζόταν config

// SECRET_KEY: Αυτό πρέπει να είναι ένα ισχυρό, μυστικό κλειδί και ιδανικά να φορτώνεται από environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'KeyForAuth';

/**
 * Middleware για αυθεντικοποίηση χρήστη μέσω JWT.
 * Αναμένει το userModel να είναι διαθέσιμο, π.χ., μέσω req.app.locals.userModel
 * ή περνώντας το ως παράμετρο κατά τη δημιουργία του middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided or malformed token.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userIdFromToken = decoded.userId; // Προσαρμόστε το ανάλογα με το τι περιέχει το token σας

        if (!userIdFromToken) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token payload (userId missing).' });
        }

        // ΠΡΟΣΒΑΣΗ ΣΤΟ USERMODEL:
        // Εδώ χρειαζόμαστε έναν τρόπο να καλέσουμε το userModel.
        // Αν το userModel είναι στο req.app.locals (ορίζεται στο server.js):
        const userModelInstance = req.app.locals.userModel;
        if (!userModelInstance) {
            console.error("UserModel not found in req.app.locals. Ensure it's set in server.js.");
            return res.status(500).json({ message: 'Server configuration error: UserModel not available.' });
        }

        const userData = await userModelInstance.getProfileInfoById(userIdFromToken);

        if (!userData) {
            return res.status(401).json({ message: 'Unauthorized: User not found for token.' });
        }

        // Επισυνάπτουμε τα δεδομένα του χρήστη (συμπεριλαμβανομένου του rank) στο request object
        req.user = {
            user_id: userData.user_id,
            username: userData.username,
            email: userData.email,
            rank: userData.rank,
            bio: userData.bio,
            profile_image_url: userData.profile_image_url
            // Προσθέστε όποια άλλα πεδία από το userData χρειάζονται οι κλάσεις User/Admin
        };

        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired.' });
        }
        console.error("Auth middleware error:", err);
        return res.status(500).json({ message: 'Server error during authentication.' });
    }
};

/**
 * Middleware για έλεγχο αν ο χρήστης είναι Admin.
 * Πρέπει να εκτελείται μετά το authMiddleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const isAdminMiddleware = (req, res, next) => {
    if (!req.user) { // Θα πρέπει να έχει οριστεί από το authMiddleware
        // Αυτό το σφάλμα δεν θα έπρεπε κανονικά να συμβεί αν το authMiddleware προηγείται πάντα.
        console.error("isAdminMiddleware called without req.user. Ensure authMiddleware runs first.");
        return res.status(500).json({ message: 'Server configuration error: User not authenticated.' });
    }
    if (req.user.rank !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};
