import jwt from 'jsonwebtoken';


// SECRET_KEY: 
const JWT_SECRET = process.env.JWT_SECRET || 'KeyForAuth';

/**
 * Middleware για αυθεντικοποίηση χρήστη μέσω JWT.
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
    if (!req.user) { 
        console.error("isAdminMiddleware called without req.user. Ensure authMiddleware runs first.");
        return res.status(500).json({ message: 'Server configuration error: User not authenticated.' });
    }
    if (req.user.rank !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};
