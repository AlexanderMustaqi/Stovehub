import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import './RecipeDetailPage.css'; // Θα δημιουργήσουμε αυτό το CSS αρχείο

function RecipeDetailPage() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { recipeId } = useParams(); // Παίρνουμε το ID από το URL

  useEffect(() => {
    console.log('[RecipeDetailPage] recipeId from URL params:', recipeId); // Log the recipeId
    const controller = new AbortController();

    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/posts/${recipeId}`, { signal: controller.signal });
        setRecipe(res.data);
      } catch (err) {
        if (err.name === 'CanceledError') {
          // console.log('[RecipeDetailPage] Fetch aborted');
        } else {
          console.error('[RecipeDetailPage] Σφάλμα στο fetch της συνταγής:', err);
          if (err.response && err.response.status === 404) {
          setError('Η συνταγή δεν βρέθηκε.');
        } else {
          setError('Παρουσιάστηκε σφάλμα κατά την ανάκτηση της συνταγής.');
        }
      }
      // The finally block was misplaced. It should be part of the try...catch structure.
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();

    return () => {
      controller.abort();
    };
  }, [recipeId]); // Εκτέλεση ξανά αν αλλάξει το recipeId

  if (loading) {
    return <div className="recipe-detail-page"><p>Φόρτωση συνταγής...</p></div>;
  }

  if (error) {
    return <div className="recipe-detail-page error-message"><p>{error}</p></div>;
  }

  if (!recipe) {
    return <div className="recipe-detail-page"><p>Δεν βρέθηκε η συνταγή.</p></div>; // Επιπλέον έλεγχος
  }

  // Μετατροπή του χρόνου προετοιμασίας για εμφάνιση
  const displayPrepTime = () => {
    if (!recipe.prep_time_value) return 'Δ/Υ';
    return `${recipe.prep_time_value} ${recipe.prep_time_unit === 'hours' ? 'ώρες' : 'λεπτά'}`;
  };

  // Μετατροπή των υλικών σε λίστα για εμφάνιση
  const ingredientsList = recipe.ingredients ? recipe.ingredients.split(',').map(ing => ing.trim()) : [];

  return (
    <div className="recipe-detail-page">
      <Link to="/" className="back-link">← Επιστροφή στην Αρχική</Link>
      {recipe.image_url && (
        <div className="recipe-image-full-container">
          <img src={`http://localhost:3001${recipe.image_url}`} alt={recipe.title} className="recipe-image-full" />
        </div>
      )}
      <h1 className="recipe-title-full">{recipe.title}</h1>
      
      <div className="recipe-meta-full">
        <p><strong>Κατηγορία:</strong> {recipe.category || 'Δ/Υ'}</p>
        <p><strong>Δυσκολία:</strong> {recipe.difficulty || 'Δ/Υ'}</p>
        <p><strong>Χρόνος Προετοιμασίας:</strong> {displayPrepTime()}</p>
      </div>

      <div className="recipe-section">
        <h2>Περιγραφή</h2>
        <p className="recipe-description-full">{recipe.description || 'Δεν υπάρχει διαθέσιμη περιγραφή.'}</p>
      </div>

      {ingredientsList.length > 0 && (
        <div className="recipe-section">
          <h2>Υλικά</h2>
          <ul className="ingredients-list-full">
            {ingredientsList.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Ενότητα Σχολίων */}
      <div className="recipe-section recipe-comments-section">
        <h2>Σχόλια</h2>
        
        {/* Placeholder για φόρμα προσθήκης νέου σχολίου */}
        <div className="comment-form-placeholder">
          <p>Εδώ θα μπορείτε να αφήσετε το σχόλιό σας (η φόρμα θα υλοποιηθεί σύντομα).</p>
          {/* <textarea placeholder="Γράψτε το σχόλιό σας..." rows="4"></textarea> */}
          {/* <button type="button">Υποβολή Σχολίου</button> */}
        </div>

        {/* Placeholder για εμφάνιση λίστας σχολίων */}
        <div className="comments-list-placeholder">
          <p>Τα σχόλια των χρηστών θα εμφανίζονται εδώ (η λίστα θα υλοποιηθεί σύντομα).</p>
        </div>
      </div>
    </div>
  );
}

export default RecipeDetailPage;
