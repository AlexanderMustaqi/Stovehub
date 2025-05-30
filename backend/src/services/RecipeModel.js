/**
 * @class RecipeModel
 * @description Manages all recipe-related database operations and business logic.
 */
class RecipeModel {
    /**
     * @private
     * @type {DbService}
     */
    dbService;

    /**
     * Creates an instance of RecipeModel.
     * @param {DbService} dbService - The database service instance.
     */
    constructor(dbService) {
        this.dbService = dbService;
    }

    /**
     * Creates a new recipe.
     * @param {object} recipeData - Data for the new recipe.
     * @param {string} recipeData.title
     * @param {string} recipeData.description
     * @param {string} recipeData.difficulty
     * @param {number} recipeData.prep_time_value
     * @param {string} recipeData.prep_time_unit
     * @param {string} recipeData.category
     * @param {string} recipeData.ingredients
     * @param {string|null} recipeData.imageUrl
     * @param {string} recipeData.userEmail - Email of the user posting the recipe.
     * @returns {Promise<{userId: number, username: string}>} - User ID and username of the poster.
     */
    async createRecipe(recipeData) {
        const { title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, imageUrl, userEmail } = recipeData;

        const [userRows] = await this.dbService.query('SELECT user_id, username FROM user_base WHERE email = ?', [userEmail]);
        if (userRows.length === 0) {
            throw new Error(`User not found for email: ${userEmail}. Cannot create post.`);
        }
        const userId = userRows[0].user_id;
        const username = userRows[0].username;

        await this.dbService.query(
            `INSERT INTO recipes (title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, image_url, user_id, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, difficulty, prep_time_value, prep_time_unit, category, ingredients, imageUrl, userId, username]
        );
        return { userId, username };
    }

    /**
     * Retrieves all recipes.
     * @param {number|null} currentUserId - ID of the current logged-in user for reaction status.
     * @returns {Promise<Array<object>>} List of recipes.
     */
    async getAllRecipes(currentUserId = null) {
        let sqlQuery = `
            SELECT
                r.*,
                u.username AS posted_by,
                u.profile_image_url AS author_image_url,
                (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'like') AS likes_count,
                (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'dislike') AS dislikes_count,
                (SELECT COUNT(*) FROM recipe_comments rc WHERE rc.recipe_id = r.id) AS comment_count
        `;
        const queryParams = [];
        if (currentUserId) {
            sqlQuery += `,
                (SELECT rr_user.reaction FROM recipe_reactions rr_user WHERE rr_user.recipe_id = r.id AND rr_user.user_id = ?) AS current_user_reaction
            `;
            queryParams.push(currentUserId);
        }
        sqlQuery += `
            FROM recipes r
            LEFT JOIN user_base u ON r.user_id = u.user_id
            ORDER BY r.created_at DESC
        `;
        const [rows] = await this.dbService.query(sqlQuery, queryParams);
        return rows.map(row => ({
            ...row,
            likes_count: parseInt(row.likes_count) || 0,
            dislikes_count: parseInt(row.dislikes_count) || 0,
            comment_count: parseInt(row.comment_count) || 0
        }));
    }

    /**
     * Searches for recipes based on various filters.
     * @param {object} filters - Search filters (query, category, difficulty, prepTime, ingredients).
     * @param {number|null} currentUserId - ID of the current logged-in user for reaction status.
     * @returns {Promise<Array<object>>} List of matching recipes.
     */
    async searchRecipes(filters, currentUserId = null) {
        let sql = `
            SELECT
                r.*,
                u.username AS posted_by,
                u.profile_image_url AS author_image_url,
                (SELECT COUNT(*) FROM recipe_reactions rr_likes WHERE rr_likes.recipe_id = r.id AND rr_likes.reaction = 'like') AS likes_count,
                (SELECT COUNT(*) FROM recipe_reactions rr_dislikes WHERE rr_dislikes.recipe_id = r.id AND rr_dislikes.reaction = 'dislike') AS dislikes_count,
                (SELECT COUNT(*) FROM recipe_comments rc_count WHERE rc_count.recipe_id = r.id) AS comment_count
                ${currentUserId ? ', (SELECT rr_user.reaction FROM recipe_reactions rr_user WHERE rr_user.recipe_id = r.id AND rr_user.user_id = ?) AS current_user_reaction' : ''}
            FROM recipes r
            LEFT JOIN user_base u ON r.user_id = u.user_id
            WHERE 1=1`;
        const params = [];

        if (currentUserId) {
            params.push(currentUserId);
        }

        if (filters.query) {
            const likeQuery = `%${filters.query}%`;
            sql += ' AND (r.title LIKE ? OR r.description LIKE ?)';
            params.push(likeQuery, likeQuery);
        }
        if (filters.category) {
            sql += ' AND r.category = ?';
            params.push(filters.category);
        }
        if (filters.difficulty) {
            sql += ' AND r.difficulty = ?';
            params.push(filters.difficulty);
        }
        if (filters.prepTime) {
            sql += ' AND r.prep_time_value <= ?';
            params.push(parseInt(filters.prepTime));
        }
        if (filters.ingredients) {
            sql += ' AND r.ingredients LIKE ?';
            params.push(`%${filters.ingredients}%`);
        }

        sql += ' ORDER BY r.created_at DESC';

        const [rows] = await this.dbService.query(sql, params);
        return rows.map(row => ({
            ...row,
            likes_count: parseInt(row.likes_count) || 0,
            dislikes_count: parseInt(row.dislikes_count) || 0,
            comment_count: parseInt(row.comment_count) || 0
        }));
    }

    /**
     * Retrieves a single recipe by ID.
     * @param {number} recipeId - The ID of the recipe.
     * @param {number|null} currentUserId - ID of the current logged-in user for reaction status.
     * @returns {Promise<object|null>} The recipe object or null if not found.
     */
    async getRecipeById(recipeId, currentUserId = null) {
        let sqlQuery = `
            SELECT
                r.*,
                u.username AS posted_by,
                u.profile_image_url AS author_image_url,
                (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'like') AS likes_count,
                (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.recipe_id = r.id AND rr.reaction = 'dislike') AS dislikes_count,
                (SELECT COUNT(*) FROM recipe_comments rc WHERE rc.recipe_id = r.id) AS comment_count
        `;
        const queryParams = [];
        if (currentUserId) {
            sqlQuery += `,
                (SELECT rr_user.reaction FROM recipe_reactions rr_user WHERE rr_user.recipe_id = r.id AND rr_user.user_id = ?) AS current_user_reaction
            `;
            queryParams.push(currentUserId);
        }
        sqlQuery += `
            FROM recipes r
            LEFT JOIN user_base u ON r.user_id = u.user_id
            WHERE r.id = ?
        `;
        queryParams.push(recipeId);
        const [rows] = await this.dbService.query(sqlQuery, queryParams);
        if (rows.length === 0) return null;
        return {
            ...rows[0],
            likes_count: parseInt(rows[0].likes_count) || 0,
            dislikes_count: parseInt(rows[0].dislikes_count) || 0,
            comment_count: parseInt(rows[0].comment_count) || 0
        };
    }

    /**
     * Handles adding, updating, or removing a recipe reaction (like/dislike).
     * @param {number} recipeId - The ID of the recipe.
     * @param {number} userId - The ID of the user reacting.
     * @param {'like'|'dislike'|'none'} reactionType - The type of reaction. 'none' to remove.
     * @returns {Promise<string>} A message indicating the action performed.
     */
    async handleRecipeReaction(recipeId, userId, reactionType) {
        const [existingReactions] = await this.dbService.query(
            'SELECT id, reaction FROM recipe_reactions WHERE recipe_id = ? AND user_id = ?',
            [recipeId, userId]
        );

        if (existingReactions.length > 0) {
            const existingReaction = existingReactions[0];
            if (reactionType === 'none' || existingReaction.reaction === reactionType) {
                await this.dbService.query('DELETE FROM recipe_reactions WHERE id = ?', [existingReaction.id]);
                return 'Reaction removed.';
            } else {
                await this.dbService.query(
                    'UPDATE recipe_reactions SET reaction = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [reactionType, existingReaction.id]
                );
                return 'Reaction updated.';
            }
        } else {
            if (reactionType === 'like' || reactionType === 'dislike') {
                await this.dbService.query(
                    'INSERT INTO recipe_reactions (recipe_id, user_id, reaction) VALUES (?, ?, ?)',
                    [recipeId, userId, reactionType]
                );
                return 'Reaction added.';
            } else {
                return 'No action taken for reaction type "none".';
            }
        }
    }

    /**
     * Retrieves comments for a specific recipe.
     * @param {number} recipeId - The ID of the recipe.
     * @returns {Promise<Array<object>>} List of comments.
     */
    async getRecipeComments(recipeId) {
        const [comments] = await this.dbService.query(
            `SELECT rc.comment_id, rc.comment_text, rc.created_at,
                    u.user_id, u.username, u.profile_image_url
             FROM recipe_comments rc
             JOIN user_base u ON rc.user_id = u.user_id
             WHERE rc.recipe_id = ?
             ORDER BY rc.created_at DESC`,
            [recipeId]
        );
        return comments;
    }

    /**
     * Adds a new comment to a recipe.
     * @param {number} recipeId - The ID of the recipe.
     * @param {number} userId - The ID of the user posting the comment.
     * @param {string} commentText - The text of the comment.
     * @returns {Promise<object>} The newly added comment object.
     */
    async addRecipeComment(recipeId, userId, commentText) {
        const [result] = await this.dbService.query(
            'INSERT INTO recipe_comments (recipe_id, user_id, comment_text) VALUES (?, ?, ?)',
            [recipeId, userId, commentText]
        );
        const [newCommentRows] = await this.dbService.query(
            `SELECT rc.comment_id, rc.comment_text, rc.created_at,
                    u.user_id, u.username, u.profile_image_url
             FROM recipe_comments rc
             JOIN user_base u ON rc.user_id = u.user_id
             WHERE rc.comment_id = ?`,
            [result.insertId]
        );
        return newCommentRows[0];
    }

    /**
     * Retrieves recipes posted by a specific user.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array<object>>} List of recipes.
     */
    async getRecipesByUserId(userId) {
        const [rows] = await this.dbService.query(`SELECT recipes.* FROM recipes WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows;
    }

    /**
     * Retrieves recipes associated with a specific gallery.
     * @param {number} galleryId - The ID of the gallery.
     * @returns {Promise<Array<object>>} List of recipes in the gallery.
     */
    async getRecipesByGalleryId(galleryId) {
        const [result] = await this.dbService.query(
            `SELECT * FROM gal_rec
             JOIN recipes ON gal_rec.recipe_id = recipes.id
             WHERE gallery_id = ?`,
            [galleryId]
        );
        return result;
    }
}

export default RecipeModel;