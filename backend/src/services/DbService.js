import mysql from 'mysql2/promise';

/**
 * @class DbService
 * @description Handles all database connection and query operations.
 */
class DbService {
    /**
     * @private
     * @type {mysql.Pool}
     */
    pool;

    /**
     * Creates an instance of DbService.
     * @param {object} config - Database connection configuration.
     */
    constructor(config) {
        this.pool = mysql.createPool(config);
    }

    /**
     * Executes a SQL query.
     * @param {string} sql - The SQL query string.
     * @param {Array<any>} [params=[]] - Parameters for the prepared statement.
     * @returns {Promise<[Array<any>, mysql.FieldPacket[]]>} - Query result.
     */
    async query(sql, params = []) {
        try {
            return await this.pool.query(sql, params);
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    /**
     * Gets a connection from the pool.
     * Useful for transactions.
     * @returns {Promise<mysql.PoolConnection>} - A database connection.
     */
    async getConnection() {
        try {
            return await this.pool.getConnection();
        } catch (error) {
            console.error('Error getting database connection:', error);
            throw error;
        }
    }
}

export default DbService;

