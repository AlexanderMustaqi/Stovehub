import UserModel from './UserModel.js';
import RecipeModel from './RecipeModel.js';
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

     /**
     * Allows the current user to follow another user.
     * @param {string} targetUserEmail - The email of the user to follow.
     * @returns {Promise<void>}
     */
    async follow(targetUserEmail) {
        if (this.email === targetUserEmail) {
            throw new Error('You cannot follow yourself.');
        }
        const userModelInstance = new UserModel(this.dbService);
        // UserModel.addFollower expects (userBeingFollowedEmail, userFollowingEmail)
        await userModelInstance.addFollower(targetUserEmail, this.email);
        console.log(`User ${this.username} (Email: ${this.email}) is now following ${targetUserEmail}`);
    }

    /**
     * Allows the current user to unfollow another user.
     * @param {string} targetUserEmail - The email of the user to unfollow.
     * @returns {Promise<boolean>} True if unfollowed successfully, false otherwise.
     */
    async unfollow(targetUserEmail) {
        const userModelInstance = new UserModel(this.dbService);
        const success = await userModelInstance.removeFollower(targetUserEmail, this.email);
        if (success) {
            console.log(`User ${this.username} (Email: ${this.email}) has unfollowed ${targetUserEmail}`);
        } else {
            console.warn(`User ${this.username} (Email: ${this.email}) could not unfollow ${targetUserEmail} (perhaps not followed or target not found).`);
        }
        return success;
    }

     /**
     * Gets the follower count for the current user.
     * @returns {Promise<number|null>}
     */
    async getMyFollowerCount() {
        const userModelInstance = new UserModel(this.dbService);
        return await userModelInstance.getFollowerCount(this.userId);
    }

    /**
     * Gets the list of followers for the current user.
     * @returns {Promise<Array<object>>}
     */
    async getMyFollowers() {
        const userModelInstance = new UserModel(this.dbService);
        return await userModelInstance.getFollowers(this.userId);
    }

    /**
     * Gets the count of users the current user is following.
     * @returns {Promise<number>}
     */
    async getMyFollowingCount() {
        const userModelInstance = new UserModel(this.dbService);
        // Example: return await userModelInstance.getFollowingCount(this.userId);
        const [rows] = await this.dbService.query(`SELECT COUNT(*) AS following_count FROM followers WHERE secondary_user_id = ?`, [this.userId]);
        return rows.length > 0 ? rows[0].following_count : 0;
    }

    /**
     * Gets the list of users the current user is following.
     * @returns {Promise<Array<object>>}
     */
    async getMyFollowing() {
        // This would require a new method in UserModel, e.g., getFollowing(userId)
        // For now, let's assume UserModel has or will have it.
        const userModelInstance = new UserModel(this.dbService);
        // Example: return await userModelInstance.getFollowing(this.userId);
        const [result] = await this.dbService.query(
            `SELECT ub.user_id, ub.username, ub.profile_image_url FROM followers f
             JOIN user_base ub ON f.main_user_id = ub.user_id
             WHERE f.secondary_user_id = ?`,
            [this.userId]
        );
        return result;
    }

    /**
     * Retrieves all recipes posted by the current user.
     * @returns {Promise<Array<object>>}
     */
    async getMyRecipes() {
        const recipeModelInstance = new RecipeModel(this.dbService);
        return await recipeModelInstance.getRecipesByUserId(this.userId);
    }

    /**
     * Retrieves the user's rank.
     * @returns {string} The user's rank (e.g., 'reg', 'chef', 'admin').
     */ 
    async getMyRank() {
        return this.rank;
    }
}

