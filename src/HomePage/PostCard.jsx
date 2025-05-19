import React from 'react';
import './PostCard.css';

function PostCard({ post }) {
  const usernameToDisplay = post.username || 'Anonymous';

  return (
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
          <span>❤️ {post.likes || 0}</span> {/* Προσθέτουμε || 0 για προστασία αν είναι undefined */}
          <span>👎 {post.dislikes || 0}</span>
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