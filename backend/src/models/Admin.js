// File: c:/Users/Panos/Desktop/neo_backend/src/models/Admin.js
import { User } from './User.js';

/**
 * @class Admin
 * @description Represents an administrator user with special privileges.
 * @extends User
 */
export class Admin extends User {
    /**
     * Creates an instance of Admin.
     * @param {import('../services/DbService.js').default} dbService - The database service instance.
     * @param {object} userData - The raw user data from the database.
     */
    constructor(dbService, userData) {
        super(dbService, userData);
        if (this.rank !== 'admin') {
            throw new Error(`User ${this.username} (ID: ${this.userId}) is not an admin. Actual rank: ${this.rank}`);
        }
    }

    /**
     * Edits the profile of another user.
     * @param {number} targetUserId - The ID of the user whose profile is to be edited.
     * @param {object} newData - Data to update (e.g., { username, email, bio, rank, profile_image_url }).
     * @returns {Promise<{message: string, updatedFields: object}>}
     */
    async editUserProfile(targetUserId, newData) {
        console.log(`Admin ${this.username} (ID: ${this.userId}) is attempting to edit profile of user ${targetUserId}`);

        const fieldsToUpdate = {};
        const validFields = ['username', 'email', 'bio', 'rank', 'profile_image_url']; // Define updatable fields
        const validRanks = ['reg', 'chef', 'admin'];

        for (const key in newData) {
            if (validFields.includes(key) && newData[key] !== undefined) {
                if (key === 'rank' && !validRanks.includes(newData[key])) {
                    throw new Error(`Invalid rank value: ${newData[key]}. Valid ranks are: ${validRanks.join(', ')}.`);
                }
                // For database column names, ensure they match your user_base table
                const dbKey = key === 'profileImageUrl' ? 'profile_image_url' : key;
                fieldsToUpdate[dbKey] = newData[key];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            throw new Error("No valid data provided for user profile update.");
        }

        if (targetUserId === this.userId && fieldsToUpdate.rank && fieldsToUpdate.rank !== this.rank) {
             console.warn("Admin is attempting to change their own rank. This might require a separate, more controlled process.");
             // Depending on policy, you might throw an error:
             // throw new Error("Admin cannot change their own rank through this general edit method.");
        }

        const setClauses = Object.keys(fieldsToUpdate).map(dbKey => `${dbKey} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), targetUserId];

        const [result] = await this.dbService.query(`UPDATE user_base SET ${setClauses} WHERE user_id = ?`, values);

        if (result.affectedRows === 0) {
            const [userCheck] = await this.dbService.query('SELECT user_id FROM user_base WHERE user_id = ?', [targetUserId]);
            if (userCheck.length === 0) {
                throw new Error(`User with ID ${targetUserId} not found.`);
            }
            // If user exists but no rows affected, it means the data was the same
            console.warn(`User with ID ${targetUserId} found, but no data changed. Values might be the same.`);
            return { message: `No changes applied to user ${targetUserId}. Data may be identical.`, updatedFields: {} };
        }
        console.log(`Admin ${this.username} successfully edited profile of user ${targetUserId}. Fields: ${Object.keys(fieldsToUpdate).join(', ')}`);
        return { message: `Profile for user ${targetUserId} updated successfully.`, updatedFields: fieldsToUpdate };
    }

    /**
     * Deletes another user's profile.
     * @param {number} targetUserId - The ID of the user to delete.
     * @returns {Promise<{message: string}>}
     */
    async deleteUserProfile(targetUserId) {
        console.log(`Admin ${this.username} (ID: ${this.userId}) is attempting to delete user ${targetUserId}`);
        if (targetUserId === this.userId) {
            throw new Error("Admin cannot delete their own account through this specific method.");
        }

        const [userCheck] = await this.dbService.query('SELECT user_id FROM user_base WHERE user_id = ?', [targetUserId]);
        if (userCheck.length === 0) {
            throw new Error(`User with ID ${targetUserId} not found. Cannot delete.`);
        }

        // IMPORTANT: Implement a robust deletion strategy.
        // This example shows a hard delete but you MUST consider related data.
        // Using transactions is highly recommended.
        const connection = await this.dbService.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Delete/anonymize data from related tables (recipes, comments, reactions, followers, chat_messages, etc.)
            //    This is CRITICAL to avoid orphaned records and foreign key constraint errors.
            //    Example (adjust table and column names as per your schema):
            //    await connection.query('DELETE FROM recipe_comments WHERE user_id = ?', [targetUserId]);
            //    await connection.query('DELETE FROM recipe_reactions WHERE user_id = ?', [targetUserId]);
            //    await connection.query('UPDATE recipes SET user_id = NULL, posted_by = "Deleted User" WHERE user_id = ?', [targetUserId]); // Anonymize
            //    await connection.query('DELETE FROM followers WHERE main_user_id = ? OR secondary_user_id = ?', [targetUserId, targetUserId]);
            //    await connection.query('DELETE FROM chat_user WHERE user_id = ?', [targetUserId]);
            //    // ... and so on for all tables referencing user_id

            // 2. Delete the user from user_base
            const [result] = await connection.query('DELETE FROM user_base WHERE user_id = ?', [targetUserId]);

            await connection.commit();

            if (result.affectedRows === 0) {
                // Should have been caught by userCheck, but good to have a fallback.
                throw new Error(`User with ID ${targetUserId} was not deleted. The user might have been deleted by another process.`);
            }
            console.log(`Admin ${this.username} successfully deleted user ${targetUserId} and related data (ensure all related data handling is complete).`);
            return { message: `User ${targetUserId} deleted successfully.` };
        } catch (error) {
            await connection.rollback();
            console.error(`Error deleting user ${targetUserId}:`, error);
            // Provide a more user-friendly error message if this error is exposed to the client
            throw new Error(`Failed to delete user ${targetUserId}. ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Handles a user-submitted report.
     * @param {number} reportId - The ID of the report.
     * @param {'resolved' | 'dismissed' | 'action_taken'} action - The action to take on the report.
     * @param {string} [adminNotes] - Optional notes from the admin.
     * @returns {Promise<{message: string}>}
     */
    async handleReport(reportId, action, adminNotes = '') {
        console.log(`Admin ${this.username} (ID: ${this.userId}) is handling report ${reportId} with action: ${action}, notes: "${adminNotes}"`);

        const validActions = ['resolved', 'dismissed', 'action_taken']; // Define your report statuses
        if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`);
        }

        // Assuming a 'reports' table exists with columns like:
        // report_id, status, resolved_at, resolved_by_admin_id, admin_notes
        const [reportRows] = await this.dbService.query('SELECT report_id, status FROM reports WHERE report_id = ?', [reportId]);
        if (reportRows.length === 0) {
            throw new Error(`Report with ID ${reportId} not found.`);
        }
        // Optional: Check if report is already processed
        // if (reportRows[0].status !== 'pending') { // Assuming 'pending' is the initial status
        //    throw new Error(`Report ${reportId} is already processed with status: ${reportRows[0].status}.`);
        // }

        const [result] = await this.dbService.query(
            'UPDATE reports SET status = ?, resolved_at = CURRENT_TIMESTAMP, resolved_by_admin_id = ?, admin_notes = ? WHERE report_id = ?',
            [action, this.userId, adminNotes, reportId]
        );

        if (result.affectedRows === 0) {
            // This might happen if the report_id is valid but was deleted just before this update.
            throw new Error(`Failed to update report ${reportId}. It might have been deleted or an issue occurred.`);
        }

        // If action is 'action_taken', you might trigger other logic here:
        // e.g., if the report was about a specific recipe or comment, you might fetch its details
        // and then call methods to delete content or warn/ban the reported user.
        // This would require more information about the 'reports' table structure and related entities.
        console.log(`Report ${reportId} status updated to ${action} by admin ${this.username}.`);
        return { message: `Report ${reportId} handled successfully with action: ${action}.` };
    }
}
