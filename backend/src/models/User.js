// File: c:/Users/Panos/Desktop/neo_backend/src/models/User.js
/**
 * @class User
 * @description Base class for all user types.
 */
export class User {
    /** @type {import('../services/DbService.js').default} */
    dbService;
    userId;
    username;
    email;
    // password; // It's generally better not to store the raw/hashed password on the instance after auth.
    profileImageUrl;
    rank; // 'reg', 'admin', 'chef' from user_base table
    bio;

    /**
     * Creates an instance of User.
     * @param {import('../services/DbService.js').default} dbService - The database service instance.
     * @param {object} userData - The raw user data from the database.
     * @param {number} userData.user_id
     * @param {string} userData.username
     * @param {string} userData.email
     * @param {string|null} [userData.profile_image_url]
     * @param {string|null} [userData.bio]
     * @param {'reg'|'chef'|'admin'} userData.rank
     */
    constructor(dbService, userData) {
        if (!dbService || typeof dbService.query !== 'function') {
            throw new Error("DbService instance with a query method is required for User constructor.");
        }
        if (!userData || userData.user_id === undefined || userData.username === undefined || userData.email === undefined || userData.rank === undefined) {
            throw new Error("UserData with user_id, username, email, and rank is required for User constructor.");
        }
        this.dbService = dbService;
        this.userId = userData.user_id;
        this.username = userData.username;
        this.email = userData.email;
        this.profileImageUrl = userData.profile_image_url;
        this.rank = userData.rank;
        this.bio = userData.bio;
    }

    /**
     * Updates the profile of the current user.
     * This method is for the user updating their OWN profile.
     * @param {object} newData - Object containing data to update.
     * @param {string} [newData.username]
     * @param {string} [newData.bio]
     * @param {string} [newData.profileImageUrl] // For profile_image_url, ensure path is correct
     * @returns {Promise<void>}
     */
    async updateProfile(newData) {
        const fieldsToUpdate = {};
        if (newData.username !== undefined) fieldsToUpdate.username = newData.username;
        if (newData.bio !== undefined) fieldsToUpdate.bio = newData.bio;
        if (newData.profileImageUrl !== undefined) fieldsToUpdate.profile_image_url = newData.profileImageUrl;

        if (Object.keys(fieldsToUpdate).length === 0) {
            console.log("No data provided to update profile.");
            return;
        }

        const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), this.userId];

        const [result] = await this.dbService.query(`UPDATE user_base SET ${setClauses} WHERE user_id = ?`, values);

        if (result.affectedRows > 0) {
            console.log(`Profile updated for user ${this.userId}`);
            // Update object properties
            if (newData.username !== undefined) this.username = newData.username;
            if (newData.bio !== undefined) this.bio = newData.bio;
            if (newData.profileImageUrl !== undefined) this.profileImageUrl = newData.profileImageUrl;
        } else {
            console.log(`Profile update for user ${this.userId} did not affect any rows. User might not exist or data is the same.`);
        }
    }

    /**
     * Retrieves profile information for the current user.
     * @returns {Promise<object|null>}
     */
    async getMyProfileData() {
        // This method can be used to refresh data or get a consistent object structure
        const [rows] = await this.dbService.query(
            `SELECT user_id, username, email, bio, rank, profile_image_url FROM user_base WHERE user_id = ?`,
            [this.userId]
        );
        return rows.length > 0 ? rows[0] : null;
    }
}
