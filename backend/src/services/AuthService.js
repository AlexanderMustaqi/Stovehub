/**
 * @class AuthService
 * @description Handles user authentication logic.
 */
class AuthService {
    /**
     * @private
     * @type {DbService}
     */
    dbService;

    /**
     * Creates an instance of AuthService.
     * @param {DbService} dbService - The database service instance.
     */
    constructor(dbService) {
        this.dbService = dbService;
    }

    /**
     * Authenticates a user based on email and password.
     * @param {string} email - User's email.
     * @param {string} password - User's password.
     * @returns {Promise<boolean>} True if authenticated, false otherwise.
     */
    async authenticateUser(email, password) {
        const [rows] = await this.dbService.query(
            `SELECT COUNT(*) AS c FROM user_base WHERE user_base.email = ? AND password = ?;`,
            [email, password]
        );
        return rows[0].c === 1;
    }
}

export default AuthService;
