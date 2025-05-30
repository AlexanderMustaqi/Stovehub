/**
 * @class ChatModel
 * @description Manages all chat and message-related database operations and business logic.
 */
class ChatModel {
    /**
     * @private
     * @type {DbService}
     */
    dbService;

    /**
     * Creates an instance of ChatModel.
     * @param {DbService} dbService - The database service instance.
     */
    constructor(dbService) {
        this.dbService = dbService;
    }

    /**
     * Retrieves chats for a given user email.
     * @param {string} email - User's email.
     * @returns {Promise<Array<object>>} List of chat objects.
     */
    async getChatsForUser(email) {
        const [userRows] = await this.dbService.query(`SELECT user_id FROM user_base WHERE email = ?;`, [email]);
        if (userRows.length === 0) {
            throw new Error('User not found');
        }
        const userId = userRows[0].user_id;
        const [chatRows] = await this.dbService.query(
            `SELECT chat.chat_id, chat.chat_name FROM chat
             LEFT JOIN chat_user ON chat.chat_id = chat_user.chat_id
             WHERE chat_user.user_id = ?;`,
            [userId]
        );
        return chatRows;
    }

    /**
     * Retrieves messages for a specific chat ID.
     * @param {number} chatId - The ID of the chat.
     * @returns {Promise<Array<object>>} List of message objects.
     */
    async getMessagesForChat(chatId) {
        const [rows] = await this.dbService.query(
            `SELECT user_base.user_id, user_base.username, message_string.message, message.message_date, chat.chat_name, chat.chat_settings FROM message_string
             LEFT JOIN message ON message.message_id = message_string.message_id
             LEFT JOIN user_base ON message.user_id = user_base.user_id
             LEFT JOIN chat ON chat.chat_id = message.chat_id
             WHERE message.chat_id = ?;`,
            [chatId]
        );
        return rows;
    }

    /**
     * Posts a new message to a chat.
     * @param {string} messageText - The message content.
     * @param {number} userId - The ID of the user sending the message.
     * @param {number} chatId - The ID of the chat.
     * @returns {Promise<void>}
     */
    async postMessage(messageText, userId, chatId) {
        await this.dbService.query(`CALL PostMessage(?, ?, ?)`, [messageText, userId, chatId]);
    }

    /**
     * Creates a new chat.
     * @param {string} chatName - Name of the new chat.
     * @param {Array<number>} chatUsers - Array of user IDs to include in the chat.
     * @param {string} userEmail - Email of the user creating the chat (also added to chat_user).
     * @returns {Promise<void>}
     */
    async createChat(chatName, chatUsers, userEmail) {
        let connection;
        try {
            const [result] = await this.dbService.query(`SELECT user_id FROM user_base WHERE email = ?`, [userEmail]);
            if (result.length === 0) {
                throw new Error('User creating chat not found.');
            }
            const userId = result[0].user_id;

            connection = await this.dbService.getConnection();
            await connection.beginTransaction();

            const [chatResult] = await connection.execute(`INSERT INTO chat(chat_name, chat_settings) VALUES (?, 1)`, [chatName]);
            const chatId = chatResult.insertId;

            for (const chatUser of chatUsers) {
                await connection.execute(`INSERT INTO chat_user(chat_id, user_id) VALUES (?, ?)`, [chatId, chatUser]);
            }
            await connection.execute(`INSERT INTO chat_user(chat_id, user_id) VALUES (?, ?)`, [chatId, userId]);

            await connection.commit();
        } catch (err) {
            if (connection) await connection.rollback();
            throw err;
        } finally {
            if (connection) connection.release();
        }
    }
}

export default ChatModel;