import React, { useState, useEffect, useContext } from 'react'; // Προσθήκη useContext
import { useNavigate } from 'react-router-dom'; // Εισαγωγή του useNavigate
import './PostCard.css';
import ThumbsUpIcon from './assets/thumbs-up-outline.svg';
import ThumbsDownIcon from './assets/thumbs-down-outline.svg';
import ReportIcon from './assets/alert-circle-outline.svg'; // Εικονίδιο για Report
import api from '../api/api'; // Υποθέτοντας ότι έχεις ένα api instance
import { IdContext } from '../ChatsBar/ChatsBar';
import ReportModal from '../shared/ReportModal.jsx'; // Διορθωμένη διαδρομή

const GENERIC_PROFILE_IMAGE_URL = 'http://localhost:5000/uploads/pfp/default-pfp.svg';

function PostCard({ post }) {
  const usernameToDisplay = post.posted_by || 'Anonymous';
  const navigate = useNavigate(); // Αρχικοποίηση του useNavigate
  const currentUserId = useContext(IdContext); // Παίρνουμε το user_id του τρέχοντος χρήστη

  // Τοπικό state για άμεση ενημέρωση του UI, αλλά η "αλήθεια" έρχεται από το post prop
  const [localLikes, setLocalLikes] = useState(post.likes_count || 0);
  const [localDislikes, setLocalDislikes] = useState(post.dislikes_count || 0);
  const [userReaction, setUserReaction] = useState(post.current_user_reaction || null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingItemId, setReportingItemId] = useState(null);

  useEffect(() => {
    setLocalLikes(post.likes_count || 0);
    setLocalDislikes(post.dislikes_count || 0);
    setUserReaction(post.current_user_reaction || null);
    
  }, [post.likes_count, post.dislikes_count, post.current_user_reaction]);

  const handleReaction = async (reactionType) => {
    if (!currentUserId) {
      alert("Πρέπει να είστε συνδεδεμένος για να κάνετε like/dislike.");
      return;
    }

    let newReactionType = reactionType;
    if (userReaction === reactionType) { // Αν πατήσει το ίδιο κουμπί, αφαιρείται το reaction
      newReactionType = 'none';
    }

    try {
      await api.post(`/recipes/${post.id}/react`, { userId: currentUserId, reactionType: newReactionType });
      // Βελτιωμένη λογική για άμεση ενημέρωση του τοπικού state (localLikes, localDislikes, userReaction)
      const previousReaction = userReaction; // Η αντίδραση πριν την τρέχουσα ενέργεια

      // 1. Ενημέρωσε το userReaction state
      setUserReaction(newReactionType);

      // 2. Ενημέρωσε τα counts (localLikes, localDislikes)
      // Μείωσε τον μετρητή αν η προηγούμενη αντίδραση αφαιρέθηκε
      if (previousReaction === 'like' && newReactionType !== 'like') {
        setLocalLikes(prev => prev - 1);
      }
      if (previousReaction === 'dislike' && newReactionType !== 'dislike') {
        setLocalDislikes(prev => prev - 1);
      }

      // Αύξησε τον μετρητή αν προστέθηκε νέα αντίδραση (και δεν ήταν ήδη αυτού του τύπου)
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
    e.stopPropagation(); // Αποτροπή του event να φτάσει στον onClick handler της κάρτας
    handleReaction('like');
  };

  const handleDislike = (e) => {
    e.stopPropagation(); // Αποτροπή του event να φτάσει στον onClick handler της κάρτας
    handleReaction('dislike');
  };

  const handleCardClick = () => {
    navigate(`/home/recipes/${post.id}`); // Προγραμματιστική πλοήγηση
  };

  const handleOpenReportModal = (e, itemId) => {
    e.stopPropagation(); // Για να μην ενεργοποιηθεί το handleCardClick
    if (!currentUserId) {
      alert("Please log in to report content.");
      // navigate("/"); // Προαιρετικά, ανακατεύθυνση στη σελίδα login
      return;
    }
    setReportingItemId(itemId);
    setShowReportModal(true);
  };

  const handleSubmitReport = async (reportData) => {
    const token = sessionStorage.getItem('authToken'); // Χρειαζόμαστε το token για το authMiddleware
    try {
      await api.post(`/api/recipes/${reportingItemId}/report`, reportData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Report submitted successfully. Thank you for your feedback.');
      setShowReportModal(false); // Κλείσιμο του modal
    } catch (error) {
      console.error("Error submitting report for post:", error);
      alert(error.response?.data?.message || 'Failed to submit report. Please try again.');
    }
  };


  return (
    
    <div className="post-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      
        <div className="post-author-container">
          <img 
            src={post.author_image_url ? `http://localhost:5000${post.author_image_url}` : GENERIC_PROFILE_IMAGE_URL} 
            alt={usernameToDisplay} 
            className="author-profile-pic" 
            onError={(e) => { e.target.onerror = null; e.target.src=GENERIC_PROFILE_IMAGE_URL }} // Fallback σε περίπτωση σφάλματος φόρτωσης
          />
          <p className="post-author">{usernameToDisplay}</p>
        </div>

        {/* Εμφάνιση της εικόνας της συνταγής ή του placeholder */}
        <div className="post-image-container">
          <img 
            src={post.imageUrl ? post.imageUrl : No_imageIcon} 
            alt={post.title} 
            className="post-image" 
            onError={(e) => {
              // Αν το post.imageUrl υπάρχει αλλά αποτύχει να φορτώσει, βάλε το No_imageIcon
              e.target.onerror = null; // Αποτρέπει ατέρμονο loop αν και το No_imageIcon αποτύχει
              e.target.src = No_imageIcon;
            }}
          />
        </div>
        <div className="post-info">
          <h2 className="post-title">{post.title}</h2>
          {/* Το username αφαιρέθηκε από εδώ */}
          <p className="post-meta">
            {/* Τα κουμπιά like/dislike και τα σχόλια παραμένουν εδώ ή μπορούν να μετακινηθούν ανάλογα με το design */}
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

            <span>💬 {post.commentCount || 0}</span>
          </p>

          {post.comments && post.comments.length > 0 && (
            <p className="post-comment">
              {post.comments[0]?.text?.substring(0, 50) + '...'}
            </p>
          )}
        </div>
        
    </div>
  );
}

export default PostCard;
