import mysql from 'mysql2/promise';

/**
 * @class DbService
 * @description Encapsulates database operations using a MySQL connection pool.
 */
class DbService {
    /**
     * @private
     * @type {mysql.Pool}
     */
    pool;

    /**
     * @param {object} config 
     */
    constructor(config) {
        this.pool = mysql.createPool(config);
    }

    /**
     * SQL query.
     * @param {string} sql 
     * @param {Array<any>} [params=[]] 
     * @returns {Promise<[Array<any>, mysql.FieldPacket[]]>} 
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
     * @returns {Promise<mysql.PoolConnection>} 
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

