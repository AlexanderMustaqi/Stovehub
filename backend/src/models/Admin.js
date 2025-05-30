import { User } from './User.js';


export class Admin extends User {
    /**
     * Creates an instance of Admin.
     * @param {import('../services/DbService.js').default} dbService 
     * @param {object} userData 
     */
    constructor(dbService, userData) {
        super(dbService, userData);
        if (this.rank !== 'admin') {
            throw new Error(`User ${this.username} (ID: ${this.userId}) is not an admin. Actual rank: ${this.rank}`);
        }
    }

    /**
     * Edits the profile of another user.
     * @param {number} targetUserId 
     * @param {object} newData 
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
                const dbKey = key === 'profileImageUrl' ? 'profile_image_url' : key;
                fieldsToUpdate[dbKey] = newData[key];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            throw new Error("No valid data provided for user profile update.");
        }

        if (targetUserId === this.userId && fieldsToUpdate.rank && fieldsToUpdate.rank !== this.rank) {
             console.warn("Admin is attempting to change their own rank. This might require a separate, more controlled process.");
             
        }

        const setClauses = Object.keys(fieldsToUpdate).map(dbKey => `${dbKey} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), targetUserId];

        const [result] = await this.dbService.query(`UPDATE user_base SET ${setClauses} WHERE user_id = ?`, values);

        if (result.affectedRows === 0) {
            const [userCheck] = await this.dbService.query('SELECT user_id FROM user_base WHERE user_id = ?', [targetUserId]);
            if (userCheck.length === 0) {
                throw new Error(`User with ID ${targetUserId} not found.`);
            }
            
            console.warn(`User with ID ${targetUserId} found, but no data changed. Values might be the same.`);
            return { message: `No changes applied to user ${targetUserId}. Data may be identical.`, updatedFields: {} };
        }
        console.log(`Admin ${this.username} successfully edited profile of user ${targetUserId}. Fields: ${Object.keys(fieldsToUpdate).join(', ')}`);
        return { message: `Profile for user ${targetUserId} updated successfully.`, updatedFields: fieldsToUpdate };
    }

    /**
     * Deletes another user's profile.
     * @param {number} targetUserId 
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

    
        const connection = await this.dbService.getConnection();
        try {
            await connection.beginTransaction();

         
            
            const [result] = await connection.query('DELETE FROM user_base WHERE user_id = ?', [targetUserId]);

            await connection.commit();

            if (result.affectedRows === 0) {
                
                throw new Error(`User with ID ${targetUserId} was not deleted. The user might have been deleted by another process.`);
            }
            console.log(`Admin ${this.username} successfully deleted user ${targetUserId} and related data (ensure all related data handling is complete).`);
            return { message: `User ${targetUserId} deleted successfully.` };
        } catch (error) {
            await connection.rollback();
            console.error(`Error deleting user ${targetUserId}:`, error);
            
            throw new Error(`Failed to delete user ${targetUserId}. ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Handles a user-submitted report.
     * @param {number} reportId 
     * @param {'resolved' | 'dismissed' | 'action_taken'} action 
     * @param {string} [adminNotes] 
     * @returns {Promise<{message: string}>}
     */
    async handleReport(reportId, action, adminNotes = '') {
        console.log(`Admin ${this.username} (ID: ${this.userId}) is handling report ${reportId} with action: ${action}, notes: "${adminNotes}"`);

        const validActions = ['resolved', 'dismissed', 'action_taken']; // Define your report statuses
        if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`);
        }

        
        const [reportRows] = await this.dbService.query('SELECT report_id, status FROM reports WHERE report_id = ?', [reportId]);
        if (reportRows.length === 0) {
            throw new Error(`Report with ID ${reportId} not found.`);
        }
        

        const [result] = await this.dbService.query(
            'UPDATE reports SET status = ?, resolved_at = CURRENT_TIMESTAMP, resolved_by_admin_id = ?, admin_notes = ? WHERE report_id = ?',
            [action, this.userId, adminNotes, reportId]
        );

        if (result.affectedRows === 0) {
            // If no rows were affected
            throw new Error(`Failed to update report ${reportId}. It might have been deleted or an issue occurred.`);
        }
        // Log the action
        console.log(`Report ${reportId} status updated to ${action} by admin ${this.username}.`);
        return { message: `Report ${reportId} handled successfully with action: ${action}.` };
    }
}
