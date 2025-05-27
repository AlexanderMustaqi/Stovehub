import React, { useState, useEffect, useContext } from 'react'; // Αφαιρέθηκε το useContext
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import './RecipeDetailPage.css'; 
import './CommentSection.css';
import ThumbsUpIcon from '../HomePage/assets/thumbs-up-outline.svg'; // Εισαγωγή εικονιδίων
import ThumbsDownIcon from '../HomePage/assets/thumbs-down-outline.svg'; // Εισαγωγή εικονιδίων
import { IdContext } from '../ChatsBar/ChatsBar';

// Ορισμός μιας generic εικόνας προφίλ (αντίστοιχα με το PostCard)
const GENERIC_PROFILE_IMAGE_URL = 'http://localhost:5000/uploads/pfp/default-pfp.svg';

function Comment({ comment }) {
  return (
    <div className="comment-item">
      <img 
        src={comment.profile_image_url || GENERIC_PROFILE_IMAGE_URL} 
        alt={comment.username} 
        className="comment-author-pic" 
        onError={(e) => { e.target.onerror = null; e.target.src=GENERIC_PROFILE_IMAGE_URL }}
      />
      <div className="comment-content">
        <p className="comment-author-name">{comment.username || 'Anonymous'}</p>
        <p className="comment-text">{comment.comment_text}</p> {/* Χρήση comment_text */}
        <p className="comment-date">{new Date(comment.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

function RecipeDetailPage() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { recipeId } = useParams(); // Παίρνουμε το ID από το URL
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const currentUserId = useContext(IdContext); // Χρήση του IdContext για να πάρουμε το userId του συνδεδεμένου χρήστη
  // State για τα reactions, παρόμοια με το PostCard
  const [localLikes, setLocalLikes] = useState(0);
  const [localDislikes, setLocalDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState(null);

  useEffect(() => {
    console.log('[RecipeDetailPage] recipeId from URL params:', recipeId); // Log the recipeId
    const controller = new AbortController();

    const fetchRecipe = async () => {
      setLoading(true);
      
      setError(null);
      try {
        // Προσθήκη currentUserId για να πάρουμε το user's reaction στη συνταγή
        const recipeUrl = currentUserId 
          ? `/posts/${recipeId}?userId=${currentUserId}`  
          : `/posts/${recipeId}`;                       
        const res = await api.get(recipeUrl, { signal: controller.signal });
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
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();

    // Fetch comments
    const fetchComments = async () => {
      if (recipeId) {
        try {
          const res = await api.get(`/recipes/${recipeId}/comments`, { signal: controller.signal }); // Αφαιρέθηκε το /api
          setComments(res.data);
        } catch (err) {
          if (err.name !== 'CanceledError') {
            console.error("[RecipeDetailPage] Error fetching comments:", err);
          }
        }
      }
    };
    fetchComments();

    return () => {
      controller.abort();
    };
  }, [recipeId, currentUserId]); // Προσθήκη currentUserId στις εξαρτήσεις για να ξανατρέξει αν αλλάξει

  // useEffect για την αρχικοποίηση των τοπικών likes/dislikes/userReaction όταν το recipe φορτωθεί/αλλάξει
  useEffect(() => {
    if (recipe) {
      setLocalLikes(recipe.likes_count || 0);
      setLocalDislikes(recipe.dislikes_count || 0);
      setUserReaction(recipe.current_user_reaction || null);
    }
  }, [recipe]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUserId) {
      alert(currentUserId ? "Το σχόλιο δεν μπορεί να είναι κενό." : "Πρέπει να είστε συνδεδεμένος για να σχολιάσετε.");
      return;
    }
    try {
      const response = await api.post(`/recipes/${recipeId}/comments`, { // Αφαιρέθηκε το /api
        userId: currentUserId,
        commentText: newCommentText // Το backend περιμένει commentText
      });
      setComments(prevComments => [response.data, ...prevComments]); // Προσθήκη νέου σχολίου στην αρχή
      setNewCommentText(''); // Καθαρισμός πεδίου
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Σφάλμα κατά την υποβολή του σχολίου.");
    }
  };

  // Λογική για τα reactions, παρόμοια με το PostCard
  const handleReaction = async (reactionType) => {
    if (!currentUserId) {
      alert("Πρέπει να είστε συνδεδεμένος για να κάνετε like/dislike.");
      return;
    }
    if (!recipe || !recipe.id) {
        console.error("Recipe or recipe ID is not available for reaction.");
        return;
    }

    let newReactionType = reactionType;
    if (userReaction === reactionType) { // Αν πατήσει το ίδιο κουμπί, αφαιρείται το reaction
      newReactionType = 'none';
    }

    try {
      await api.post(`/recipes/${recipe.id}/react`, { userId: currentUserId, reactionType: newReactionType });
      
      const previousReaction = userReaction;
      setUserReaction(newReactionType);

      // Ενημέρωση των counts (localLikes, localDislikes)
      if (previousReaction === 'like' && newReactionType !== 'like') {
        setLocalLikes(prev => Math.max(0, prev - 1)); // Αποφυγή αρνητικών τιμών
      }
      if (previousReaction === 'dislike' && newReactionType !== 'dislike') {
        setLocalDislikes(prev => Math.max(0, prev - 1)); // Αποφυγή αρνητικών τιμών
      }
      if (newReactionType === 'like' && previousReaction !== 'like') {
        setLocalLikes(prev => prev + 1);
      }
      if (newReactionType === 'dislike' && previousReaction !== 'dislike') {
        setLocalDislikes(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error submitting reaction:", err);
      alert("Σφάλμα κατά την υποβολή του reaction.");
    }
  };

  const handleLike = (e) => {
    e.stopPropagation(); 
    handleReaction('like');
  };

  const handleDislike = (e) => {
    e.stopPropagation(); 
    handleReaction('dislike');
  };


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
  let ingredientsList = [];
  if (recipe.ingredients) {
    try {
      ingredientsList = JSON.parse(recipe.ingredients); // Κάνε parse το JSON string
    } catch (e) {
      console.error("Failed to parse ingredients JSON:", e, recipe.ingredients);
      // Fallback αν δεν είναι έγκυρο JSON, αν και ιδανικά θα έπρεπε πάντα να είναι
      ingredientsList = recipe.ingredients.split(',').map(ing => ing.trim()); 
    }
  }

  return (
    <div className="recipe-detail-page">
      <Link to="/home" className="back-link">← Επιστροφή στην Αρχική</Link>

       {/* Εμφάνιση εικόνας προφίλ και ονόματος χρήστη του δημιουργού */}
      {recipe.user_id && ( // Ελέγχουμε αν υπάρχει user_id για να εμφανίσουμε την ενότητα
        <div className="recipe-author-container">
          <img
            src={recipe.author_image_url ? `http://localhost:5000${recipe.author_image_url}` : GENERIC_PROFILE_IMAGE_URL}
            alt={recipe.posted_by || 'Author'}
            className="author-profile-pic-detail"
            onError={(e) => { e.target.onerror = null; e.target.src = GENERIC_PROFILE_IMAGE_URL; }}
          />
          <p className="recipe-author-text">
            <Link to={`/profile/${recipe.user_id}`}>{recipe.posted_by || 'Άγνωστος Χρήστης'}</Link>
          </p>
        </div>
      )}

      {recipe.image_url && (
        <div className="recipe-image-full-container">
          <img src={`http://localhost:5000${recipe.image_url}`} alt={recipe.title} className="recipe-image-full" />
        </div>
      )}
      <h1 className="recipe-title-full">{recipe.title}</h1>

      
      {/* Ενότητα Reactions κάτω από τον τίτλο */}
      <div className="recipe-detail-actions">
        <button
          onClick={handleLike}
          className={`like-dislike-btn ${userReaction === 'like' ? 'active-like' : ''}`}
        >
          <img src={ThumbsUpIcon} alt="Like" className="icon meta-icon" />
          {localLikes}
        </button>
        <button
          onClick={handleDislike}
          className={`like-dislike-btn ${userReaction === 'dislike' ? 'active-dislike' : ''}`}
        >
          <img src={ThumbsDownIcon} alt="Dislike" className="icon meta-icon" />
          {localDislikes}
        </button>
      </div>
      
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

        {currentUserId && ( // Εμφάνιση φόρμας μόνο αν ο χρήστης είναι "συνδεδεμένος"
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea 
              placeholder="Γράψτε το σχόλιό σας..." 
              rows="3"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              required
            />
            <button type="submit">Υποβολή Σχολίου</button>
          </form>
        )}

        {comments.length > 0 ? (
          <div className="comments-list">
            {comments.map(comment => <Comment key={comment.comment_id} comment={comment} />)}
          </div>
        ) : (
          <p>Δεν υπάρχουν σχόλια ακόμα. Γίνετε ο πρώτος που θα σχολιάσει!</p>
        )}
      </div>
    </div>
  );
}

export default RecipeDetailPage;
