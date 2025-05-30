import React from 'react';
import { Link } from 'react-router-dom';
import './ProfileRecipeCard.css'; // Θα δημιουργήσουμε αυτό το αρχείο CSS
import No_ImageIcon from './assets/no_image.jpg'; // Εικονίδιο για όταν δεν υπάρχει εικόνα

const ProfileRecipeCard = ({ recipe }) => {
  if (!recipe) {
    return null;
  }

  
  const recipeImageUrl = recipe.image_url
    ? `http://localhost:5000${recipe.image_url}`
    : No_ImageIcon;

  return (
    <Link to={`/home/recipes/${recipe.id}`} className="profile-recipe-card">
      <div className="profile-recipe-card-image-container">
        <img
          src={recipeImageUrl}
          alt={recipe.title || 'Εικόνα Συνταγής'}
          className="profile-recipe-card-image"
          onError={(e) => {
            e.target.onerror = null; // Αποτρέπει ατέρμονα loops αν και η default εικόνα αποτύχει
            e.target.src = No_ImageIcon;
          }}
        />
      </div>
      <div className="profile-recipe-card-info">
        <h3 className="profile-recipe-card-title">{recipe.title || 'Συνταγή Χωρίς Τίτλο'}</h3>
      </div>
    </Link>
  );
};

export default ProfileRecipeCard;
