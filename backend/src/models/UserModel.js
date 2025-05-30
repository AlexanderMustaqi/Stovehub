import { WebSocket } from 'ws'; // Import WebSocket for type hinting if needed, though not directly used in this class

/**
 * @class UserModel
 * @description Manages all user-related database operations and business logic.
 */
class UserModel {
    /**
     * @private
     * @type {DbService}
     */
    dbService;

    /**
     * Creates an instance of UserModel.
     * @param {DbService} dbService - The database service instance.
     */
        constructor(dbService) {
        this.dbService = dbService;
    }

    /**
     * Retrieves user ID by email.
     * @param {string} email - User's email.
     * @returns {Promise<number|null>} User ID or null if not found.
     */
    async getUserIdByEmail(email) {
        console.log(`[UserModel] Attempting to fetch user_id for email: ${email}`);
        const [rows] = await this.dbService.query(`SELECT user_id FROM user_base WHERE email = ?`, [email]);
        return rows.length > 0 ? rows[0].user_id : null;
    }

    /**
     * Retrieves all users.
     * @returns {Promise<Array<object>>} List of all users.
     */
    async getAllUsers() {
        const [rows] = await this.dbService.query('SELECT * FROM user_base;');
        return rows;
    }

    /**
     * Searches for users by username.
     * @param {string} query - Search query string.
     * @returns {Promise<Array<object>>} List of matching users.
     */
    async searchUsers(query) {
        if (!query) {
            return [];
        }
        const [rows] = await this.dbService.query(
            'SELECT user_id, username, email, profile_image_url FROM user_base WHERE username LIKE ?',
            [`%${query}%`]
        );
        return rows;
    }

    /**
     * Registers a new user.
     * @param {string} username - New user's username.
     * @param {string} password - New user's password.
     * @param {string} email - New user's email.
     * @returns {Promise<void>}
     */
    async registerUser(username, password, email) {
        await this.dbService.query(`CALL postRegisteredUser(?, ?, ?)`, [username, password, email]);
    }

    /**
     * Updates a user's username.
     * @param {string} email - User's email.
     * @param {string} newName - New username.
     * @returns {Promise<void>}
     */
    async updateUsername(email, newName) {
        await this.dbService.query(`UPDATE user_base SET username = ? WHERE email = ?`, [newName, email]);
    }

    /**
     * Updates a user's bio.
     * @param {string} email - User's email.
     * @param {string} newBio - New bio text.
     * @returns {Promise<void>}
     */
    async updateUserBio(email, newBio) {
        await this.dbService.query(`UPDATE user_base SET bio = ? WHERE email = ?`, [newBio, email]);
    }

    /**
     * Updates a user's profile picture URL.
     * @param {string} email - User's email.
     * @param {string} imageUrlPath - New profile image URL path.
     * @returns {Promise<void>}
     */
    async updateProfilePicture(email, imageUrlPath) {
        const [userRows] = await this.dbService.query('SELECT user_id FROM user_base WHERE email = ?', [email]);
        if (userRows.length === 0) {
            throw new Error('User not found.');
        }
        await this.dbService.query('UPDATE user_base SET profile_image_url = ? WHERE email = ?', [imageUrlPath, email]);
        console.log(`[UserModel] Profile picture updated for ${email} to ${imageUrlPath}`);
    }

    /**
     * Retrieves profile information for a user by email.
     * @param {string} email - User's email.
     * @returns {Promise<object|null>} User profile info or null if not found.
     */
    async getMyProfileInfo(email) {
        const [rows] = await this.dbService.query(`SELECT username, bio, rank, profile_image_url FROM user_base WHERE email = ?`, [email]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Retrieves follower count for a user by ID.
    param {number} userId - User's ID.
    @returns {Promise<number|null>} Follower count or null if user not found.
     */
    async getFollowerCount(userId) {
        const [rows] = await this.dbService.query(`SELECT COUNT(*) AS follower_count FROM followers WHERE main_user_id = ?`, [userId]);
        return rows.length > 0 ? rows[0].follower_count : null;
    }

    /**
     * Retrieves profile information for a user by ID.
     * @param {number} userId - User's ID.
     * @returns {Promise<object|null>} User profile info or null if not found.
     */
    async getProfileInfoById(userId) {
        const [rows] = await this.dbService.query(`SELECT user_id, username, email, bio, rank, profile_image_url FROM user_base WHERE user_id = ?`, [userId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Retrieves followers for a given user ID.
     * @param {number} userId - The ID of the user whose followers are to be retrieved.
     * @returns {Promise<Array<object>>} A list of follower objects.
     */
    async getFollowers(userId) {
        const [result] = await this.dbService.query(
            `SELECT username, user_base.user_id FROM followers
             LEFT JOIN user_base ON followers.secondary_user_id = user_base.user_id
             WHERE main_user_id = ?`,
            [userId]
        );
        return result;
    }

    /**
     * Adds a follower relationship.
     * @param {string} mainUserEmail - Email of the user being followed.
     * @param {string} secUserEmail - Email of the user who is following.
     * @returns {Promise<void>}
     */
    async addFollower(mainUserEmail, secUserEmail) {
        const mainUser = await this.getUserIdByEmail(mainUserEmail);
        const secUser = await this.getUserIdByEmail(secUserEmail);

        if (!mainUser || !secUser) {
            throw new Error('Invalid user email(s) for follow operation.');
        }

        await this.dbService.query(`INSERT INTO followers(main_user_id, secondary_user_id) VALUES (?, ?)`, [mainUser, secUser]);
        console.log(`[UserModel] User ${secUser} followed user ${mainUser}`);
    }

    /**
     * Removes a follower relationship.
     * @param {string} mainUserEmail - Email of the user being unfollowed.
     * @param {string} secUserEmail - Email of the user who is unfollowing.
     * @returns {Promise<boolean>} True if unfollowed successfully, false otherwise.
     */
    async removeFollower(mainUserEmail, secUserEmail) {
        const mainUser = await this.getUserIdByEmail(mainUserEmail);
        const secUser = await this.getUserIdByEmail(secUserEmail);

        if (!mainUser || !secUser) {
            throw new Error('Invalid user email(s) for unfollow operation.');
        }

        const [result] = await this.dbService.query(
            `DELETE FROM followers WHERE main_user_id = ? AND secondary_user_id = ?`,
            [mainUser, secUser]
        );
        return result.affectedRows > 0;
    }

    /**
     * Retrieves galleries for a given user ID.
     * @param {number} userId - The ID of the user whose galleries are to be retrieved.
     * @returns {Promise<Array<object>>} A list of gallery objects.
     */
    async getUserGalleries(userId) {
        const [result] = await this.dbService.query(`SELECT * FROM gallery WHERE user_id = ?`, [userId]);
        return result;
    }
}

export default UserModel;