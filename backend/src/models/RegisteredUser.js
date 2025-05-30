import { User } from './User.js';
import RecipeModel from './RecipeModel.js';
import UserModel from './UserModel.js';
/**
 * @class RegisteredUser
 * @description Represents a standard registered user ('reg' or 'chef').
 * @extends User
 */
export class RegisteredUser extends User {
    /**
     * Creates an instance of RegisteredUser.
     * @param {import('../services/DbService.js').default} dbService - The database service instance.
     * @param {object} userData - The raw user data from the database.
     */
    constructor(dbService, userData) {
        super(dbService, userData);
        
        if (this.rank !== 'reg' && this.rank !== 'chef') {
            console.warn(`RegisteredUser instance created for user ${this.username} with unexpected rank ${this.rank}`);
        }
    }

    /**
     *  Posts a new recipe on behalf of the current registered user.
     * Ensures the recipe is associated with this user's email.
     * @param {object} recipeData 
     * @param {string} recipeData.title 
     * @param {string} recipeData.description 
     * @param {string} recipeData.difficulty 
     * @param {number} recipeData.prep_time_value 
     * @param {string} recipeData.prep_time_unit 
     * @param {string} recipeData.category 
     * @param {Array<string>|string} recipeData.ingredients 
     * @param {string|null} [recipeData.imageUrl] 
      * @returns {Promise<object>} The result from RecipeModel.createRecipe (e.g., { userId, username }).
     */
    async postRecipe(recipeData) {
        console.log(`User ${this.username} (ID: ${this.userId}, Rank: ${this.rank}) is posting a recipe: ${recipeData.title}`);
        const recipeModelInstance = new RecipeModel(this.dbService);
        const recipePayload = {
            ...recipeData, // recipeData comes from the frontend
            userEmail: this.email 
        };
        return await recipeModelInstance.createRecipe(recipePayload);
    }
    

    /**
     /**
     * Creates a new gallery for the current user.
     * @param {string} galleryName - The name of the new gallery.
     * @param {string} [galleryImageUrl='NaN'] - The image URL for the gallery.
     * @returns {Promise<{insertId: number, message: string}>} Result of the gallery creation.
     */
    
    async createGallery(galleryName, galleryImageUrl = 'NaN') {
        console.log(`User ${this.username} (ID: ${this.userId}) is creating a gallery named: ${galleryName}.`);
        const [result] = await this.dbService.query(
            'INSERT INTO gallery (gallery_name, gallery_img_url, user_id) VALUES (?, ?, ?)',
            [galleryName, galleryImageUrl, this.userId]
        );
        if (result.insertId) {
            return { insertId: result.insertId, message: "Gallery created successfully" };
        }
        throw new Error("Failed to create gallery.");
    };

    /**
     * Retrieves all galleries belonging to the current user.
     * @returns {Promise<Array<object>>}
     */
    async getMyGalleries() {
        const userModelInstance = new UserModel(this.dbService);
        return await userModelInstance.getUserGalleries(this.userId);
    }

    /**
     * Adds a recipe to one of the user's galleries.
     * @param {number} galleryId - The ID of the gallery.
     * @param {number} recipeId - The ID of the recipe.
     * @returns {Promise<{insertId: number, message: string}>}
     */
    async addRecipeToGallery(galleryId, recipeId) {
        const [galleryRows] = await this.dbService.query('SELECT user_id FROM gallery WHERE gallery_id = ? AND user_id = ?', [galleryId, this.userId]);
        if (galleryRows.length === 0) {
            throw new Error('Gallery not found or permission denied.');
        }
        const [result] = await this.dbService.query('INSERT INTO gal_rec (gallery_id, recipe_id) VALUES (?, ?)', [galleryId, recipeId]);
        if (result.insertId) {
            console.log(`Recipe ${recipeId} added to gallery ${galleryId} by user ${this.username}`);
            return { insertId: result.insertId, message: "Recipe added to gallery successfully." };
        }
        throw new Error("Failed to add recipe to gallery.");
    }

    /**
     * Removes a recipe from one of the user's galleries.
     * @param {number} galleryId - The ID of the gallery.
     * @param {number} recipeId - The ID of the recipe.
     * @returns {Promise<boolean>} True if removal was successful.
     */
    async removeRecipeFromGallery(galleryId, recipeId) {
        const [galleryRows] = await this.dbService.query('SELECT user_id FROM gallery WHERE gallery_id = ? AND user_id = ?', [galleryId, this.userId]);
        if (galleryRows.length === 0) {
            throw new Error('Gallery not found or permission denied for removing recipe.');
        }
        const [result] = await this.dbService.query('DELETE FROM gal_rec WHERE gallery_id = ? AND recipe_id = ?', [galleryId, recipeId]);
        return result.affectedRows > 0;
    }

    /**
     * Deletes one of the user's galleries.
     * @param {number} galleryId - The ID of the gallery to delete.
     * @returns {Promise<boolean>} True if deletion was successful.
     */
    async deleteGallery(galleryId) {
        const [result] = await this.dbService.query('DELETE FROM gallery WHERE gallery_id = ? AND user_id = ?', [galleryId, this.userId]);
        if (result.affectedRows > 0) {
            console.log(`Gallery ${galleryId} deleted by user ${this.username}`);
            
            return true;
        }
        return false; // Gallery not found or not owned by user
    }

    
}
