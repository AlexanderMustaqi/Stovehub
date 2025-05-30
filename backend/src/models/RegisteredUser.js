// File: c:/Users/Panos/Desktop/neo_backend/src/models/RegisteredUser.js
import { User } from './User.js';

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
        // Optional: Add a check if rank is 'reg' or 'chef'
        // if (this.rank !== 'reg' && this.rank !== 'chef') {
        //     console.warn(`RegisteredUser instance created for user ${this.username} with unexpected rank ${this.rank}`);
        // }
    }

    /**
     * Placeholder for posting a recipe.
     * (Actual logic might call RecipeModel or be implemented here)
     * @param {object} recipeData - Data for the new recipe.
     * @param {string} recipeData.title
     * @returns {Promise<{message: string, title: string}>}
     */
    async postRecipe(recipeData) {
        console.log(`User ${this.username} (ID: ${this.userId}, Rank: ${this.rank}) is posting a recipe: ${recipeData.title}`);
        // Example:
        // const recipeService = new RecipeModel(this.dbService); // Or pass RecipeModel instance
        // const newRecipe = await recipeService.createRecipe({ ...recipeData, userEmail: this.email });
        // return newRecipe;
        // For now, this is a placeholder.
        return { message: "Recipe posted (placeholder)", title: recipeData.title };
    }

    /**
     * Placeholder for creating a gallery.
     * @param {string} galleryName
     * @returns {Promise<{message: string, galleryName: string}>}
     */
    async createGallery(galleryName) {
        console.log(`User ${this.username} (ID: ${this.userId}) is creating a gallery named: ${galleryName}.`);
        // Example:
        // const [result] = await this.dbService.query(
        //  'INSERT INTO gallery (user_id, gallery_name, created_at) VALUES (?, ?, NOW())',
        //  [this.userId, galleryName]
        // );
        // return { galleryId: result.insertId, galleryName };
        return { message: "Gallery created (placeholder)", galleryName };
    }

    // Other methods specific to RegisteredUser (and by extension, Chef if Chef doesn't have its own class):
    // async searchRecipes(criteria) { /* ... */ }
    // async commentRecipe(recipeId, commentData) { /* ... */ }
    // async rateRecipe(recipeId, rating) { /* ... */ }
}
