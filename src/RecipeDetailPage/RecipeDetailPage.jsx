import React, { useState, useEffect, useContext } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import './RecipeDetailPage.css'; 
import './CommentSection.css';
import ThumbsUpIcon from '../HomePage/assets/thumbs-up-outline.svg'; // Εισαγωγή εικονιδίων
import ThumbsDownIcon from '../HomePage/assets/thumbs-down-outline.svg'; // Εισαγωγή εικονιδίων
import ReportIcon from '../HomePage/assets/alert-circle-outline.svg'; // Εικονίδιο για Report
import { IdContext } from '../ChatsBar/ChatsBar';
import ReportModal from '../shared/ReportModal.jsx'; // Import το ReportModal

// Ορισμός μιας generic εικόνας προφίλ 
const GENERIC_PROFILE_IMAGE_URL = 'http://localhost:5000/uploads/pfp/default-pfp.svg';

function Comment({ comment, onReportComment, currentUserId }) {
  return (
    <div className="comment-item">
      <div className="comment-main-content">
        <img 
          src={comment.profile_image_url ? `http://localhost:5000${comment.profile_image_url}` : GENERIC_PROFILE_IMAGE_URL}
          alt={comment.username} 
          className="comment-author-pic" 
          onError={(e) => { e.target.onerror = null; e.target.src=GENERIC_PROFILE_IMAGE_URL }}
        />
        <div className="comment-text-content">
          <p className="comment-author-name">{comment.username || 'Anonymous'}</p>
          <p className="comment-text">{comment.comment_text}</p>
          <p className="comment-date">{new Date(comment.created_at).toLocaleString()}</p>
        </div>
      </div>
      {currentUserId && currentUserId !== comment.user_id && ( // Εμφάνιση κουμπιού report αν ο χρήστης είναι συνδεδεμένος και δεν είναι το δικό του σχόλιο
        <button 
          onClick={() => onReportComment(comment.comment_id)} 
          className="comment-report-button" 
          title="Report this comment">
          <img src={ReportIcon} alt="Report comment" />
        </button>
      )}
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
  const currentUserId = useContext(IdContext); 
  const [localLikes, setLocalLikes] = useState(0);
  const [localDislikes, setLocalDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  // State για τις διατροφικές πληροφορίες
  const [showNutritionInfo, setShowNutritionInfo] = useState(false);
  const [nutritionalData, setNutritionalData] = useState(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState(null);
   // State για το report modal των σχολίων
  const [showReportCommentModal, setShowReportCommentModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null);
  // State για το report modal της συνταγής
  const [showReportRecipeModal, setShowReportRecipeModal] = useState(false);

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
          const res = await api.get(`/recipes/${recipeId}/comments`, { signal: controller.signal }); 
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
  }, [recipeId, currentUserId]); 

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
      const response = await api.post(`/recipes/${recipeId}/comments`, { 
        userId: currentUserId,
        commentText: newCommentText 
      });
      setComments(prevComments => [response.data, ...prevComments]); 
      setNewCommentText(''); // Καθαρισμός πεδίου
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Σφάλμα κατά την υποβολή του σχολίου.");
    }
  };

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

  const handleOpenReportCommentModal = (commentId) => {
    if (!currentUserId) {
      alert("Please log in to report content.");
      return;
    }
    setReportingCommentId(commentId);
    setShowReportCommentModal(true);
  };

  const handleSubmitReportComment = async (reportData) => {
    const token = sessionStorage.getItem('authToken');
    if (!reportingCommentId) return;

    try {
      await api.post(`/comments/${reportingCommentId}/report`, reportData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Comment report submitted successfully. Thank you.');
      setShowReportCommentModal(false);
    } catch (error) {
      console.error("Error submitting report for comment:", error);
      alert(error.response?.data?.message || 'Failed to submit comment report. Please try again.');
    }
  };


  const handleOpenReportRecipeModal = () => {
    if (!currentUserId) {
      alert("Please log in to report content.");
      return;
    }
    if (!recipe || !recipe.id) {
        console.error("Recipe data is not available for reporting.");
        alert("Cannot report recipe: recipe data missing.");
        return;
    }
    setShowReportRecipeModal(true);
  };

  const handleSubmitReportRecipe = async (reportData) => {
    const token = sessionStorage.getItem('authToken');
    if (!recipe || !recipe.id) return;
    try {
      await api.post(`/recipes/${recipe.id}/report`, reportData, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Recipe report submitted successfully. Thank you.');
      setShowReportRecipeModal(false);
    } catch (error) {
      console.error("Error submitting report for recipe:", error);
      alert(error.response?.data?.message || 'Failed to submit recipe report. Please try again.');
    }
  };

  // Συνάρτηση για την εναλλαγή και φόρτωση (mock) διατροφικών πληροφοριών
  const handleToggleNutritionInfo = async () => {
    if (!showNutritionInfo) { 
      if (!nutritionalData && recipe && ingredientsList && ingredientsList.length > 0) { 
        setNutritionLoading(true);
        setNutritionError(null);
        try {
          // MOCK API CALL / DATA GENERATION
          // Σε πραγματική εφαρμογή, εδώ θα γινόταν κλήση σε API
          // console.log("[RecipeDetailPage] Mock fetching nutritional data for:", ingredientsList);
          const mockData = ingredientsList.map(ingredient => ({
            name: ingredient, 
            calories: (Math.random() * 180 + 40).toFixed(0), // Τυχαίες θερμίδες
            protein: (Math.random() * 15 + 1).toFixed(1),  // Τυχαία πρωτεΐνη
            carbs: (Math.random() * 25 + 3).toFixed(1),    // Τυχαίοι υδατάνθρακες
            fat: (Math.random() * 12 + 1).toFixed(1)       // Τυχαία λιπαρά
          }));
          
          // Προσομοίωση καθυστέρησης API
          await new Promise(resolve => setTimeout(resolve, 700)); 

          setNutritionalData(mockData);
        } catch (error) {
          console.error("[RecipeDetailPage] Error fetching/mocking nutritional data:", error);
          setNutritionError("Σφάλμα κατά την ανάκτηση των διατροφικών στοιχείων.");
        } finally {
          setNutritionLoading(false);
        }
      } else if (ingredientsList && ingredientsList.length === 0) {
        setNutritionError("Δεν υπάρχουν συστατικά για ανάλυση.");
        setNutritionalData(null); // Καθαρισμός προηγούμενων δεδομένων
      }
    }
    setShowNutritionInfo(prev => !prev);
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
      ingredientsList = JSON.parse(recipe.ingredients); 
    } catch (e) {
      console.error("Failed to parse ingredients JSON:", e, recipe.ingredients);
      ingredientsList = recipe.ingredients.split(',').map(ing => ing.trim()); 
    }
  }

  return (
    <div className="recipe-detail-page">
      <Link to="/home" className="back-link">← Επιστροφή στην Αρχική</Link>

      {recipe.user_id && (
        <div className="recipe-author-container">
          <img
            src={recipe.author_image_url ? `http://localhost:5000${recipe.author_image_url}` : GENERIC_PROFILE_IMAGE_URL}
            alt={recipe.posted_by || 'Author'}
            className="author-profile-pic-detail"
            onError={(e) => { e.target.onerror = null; e.target.src = GENERIC_PROFILE_IMAGE_URL; }}
          />
          <p className="recipe-author-text">
            <Link to={`/user-profile/${recipe.user_id}`}>{recipe.posted_by || 'Άγνωστος Χρήστης'}</Link>
          </p>
        </div>
      )}

      {recipe.image_url && (
        <div className="recipe-image-full-container">
          <img src={`http://localhost:5000${recipe.image_url}`} alt={recipe.title} className="recipe-image-full" />
        </div>
      )}
      <h1 className="recipe-title-full">{recipe.title}</h1>

      <div className="recipe-detail-actions">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`like-dislike-btn ${userReaction === 'like' ? 'active-like' : ''}`}
        >
          <img src={ThumbsUpIcon} alt="Like" className="icon meta-icon" />
          {localLikes}
        </button>
        {/* Dislike Button */}
        <button
          onClick={handleDislike}
          className={`like-dislike-btn ${userReaction === 'dislike' ? 'active-dislike' : ''}`}
        >
          <img src={ThumbsDownIcon} alt="Dislike" className="icon meta-icon" />
          {localDislikes}
        </button>
        {/* Report Recipe Button */}
        {currentUserId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReportRecipeModal();
            }}
            className="like-dislike-btn recipe-action-report-btn"
            title="Report this recipe"
          >
            <img src={ReportIcon} alt="Report Recipe" className="icon meta-icon" />
          </button>
        )}
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
          {/* Κουμπί για Διατροφική Αξία */}
          <button onClick={handleToggleNutritionInfo} className="nutrition-toggle-btn">
            {showNutritionInfo ? 'Απόκρυψη' : 'Εμφάνιση'} Διατροφικής Αξίας
          </button>
        </div>
      )}

      {/* Ενότητα Διατροφικών Πληροφοριών */}
      {showNutritionInfo && (
        <div className="recipe-section nutrition-section">
          <h3>Διατροφική Αξία (Εκτίμηση ανά συστατικό)</h3>
          {nutritionLoading && <p>Φόρτωση διατροφικών στοιχείων...</p>}
          {nutritionError && <p className="error-message">{nutritionError}</p>}
          {nutritionalData && !nutritionLoading && !nutritionError && (
            <table className="nutrition-table">
              <thead>
                <tr>
                  <th>Συστατικό</th>
                  <th>Θερμίδες (kcal)</th>
                  <th>Πρωτεΐνη (g)</th>
                  <th>Υδατάνθρακες (g)</th>
                  <th>Λιπαρά (g)</th>
                </tr>
              </thead>
              <tbody>
                {nutritionalData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.calories}</td>
                    <td>{item.protein}</td>
                    <td>{item.carbs}</td>
                    <td>{item.fat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!nutritionalData && !nutritionLoading && !nutritionError && ingredientsList && ingredientsList.length > 0 && (
            <p>Πατήστε "Εμφάνιση Διατροφικής Αξίας" για να δείτε τα στοιχεία.</p>
          )}
          {!nutritionalData && !nutritionLoading && !nutritionError && (!ingredientsList || ingredientsList.length === 0) && (
            <p>Δεν υπάρχουν συστατικά για την εμφάνιση διατροφικών στοιχείων.</p>
          )}
        </div>
      )}

      {/* Ενότητα Σχολίων */}
      <div className="recipe-section recipe-comments-section">
        <h2>Σχόλια</h2>
        {currentUserId && (
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
            {comments.map(comment => (
              <Comment
                key={comment.comment_id}
                comment={comment}
                onReportComment={handleOpenReportCommentModal}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <p>Δεν υπάρχουν σχόλια ακόμα. Γίνετε ο πρώτος που θα σχολιάσει!</p>
        )}
      </div>
      {/* Modal για Αναφορά Σχολίου */}
      {showReportCommentModal && reportingCommentId && (
        <ReportModal
          show={showReportCommentModal}
          onClose={() => { setShowReportCommentModal(false); setReportingCommentId(null); }}
          onSubmit={handleSubmitReportComment}
          itemType="comment"
          itemId={reportingCommentId}
        />
      )}
      {/* Modal για Αναφορά Συνταγής */}
      {showReportRecipeModal && recipe && recipe.id && (
        <ReportModal
          show={showReportRecipeModal}
          onClose={() => setShowReportRecipeModal(false)}
          onSubmit={handleSubmitReportRecipe}
          itemType="recipe"
          itemId={recipe.id}
        />
      )}
    </div>
  );
}

export default RecipeDetailPage;
