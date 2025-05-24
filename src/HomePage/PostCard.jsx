import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PostCard.css';
import ThumbsUpIcon from './assets/thumbs-up-outline.svg';
import ThumbsDownIcon from './assets/thumbs-down-outline.svg';

function PostCard({ post }) {
  const usernameToDisplay = post.username || 'Anonymous';

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleLike = (e) => {
    e.preventDefault();
    setLiked(prev => !prev);       // toggle το like
    if (disliked) setDisliked(false); // αν ήταν dislike, το βγάζουμε
  };

  const handleDislike = (e) => {
    e.preventDefault();
    setDisliked(prev => !prev);     // toggle το dislike
    if (liked) setLiked(false);     // αν ήταν like, το βγάζουμε
  };

  return (
    <Link to={`/recipes/${post.id}`} className="post-card-link">
      <div className="post-card">
        {post.imageUrl && (
          <div className="post-image-container">
            <img src={post.imageUrl} alt={post.title} className="post-image" />
          </div>
        )}
        <div className="post-info">
          <h2 className="post-title">{post.title}</h2>
          <p className="post-meta">
            <span>Από: {usernameToDisplay}</span>

            <button
              onClick={handleLike}
              className={`like-dislike-btn ${liked ? 'active-like' : ''}`}
            >
              <img src={ThumbsUpIcon} alt="Like" className="icon meta-icon" />
              {post.likes || 0}
            </button>

            <button
              onClick={handleDislike}
              className={`like-dislike-btn ${disliked ? 'active-dislike' : ''}`}
            >
              <img src={ThumbsDownIcon} alt="Dislike" className="icon meta-icon" />
              {post.dislikes || 0}
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
    </Link>
  );
}

export default PostCard;
