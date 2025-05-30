import React from 'react';
import { Link } from 'react-router-dom'; // Για σύνδεσμο προς το προφίλ
import './UserCard.css'; 

const UserCard = ({ user }) => {
  if (!user) {
    return null;
  }

  const defaultPfp = `http://localhost:5000/uploads/pfp/default-pfp.svg`;
  const profileImageUrl = user.profile_image_url 
    ? `http://localhost:5000${user.profile_image_url}` 
    : defaultPfp;

  return (
    <div className="user-card">
      <Link to={`/user-profile/${user.user_id}`} className="user-card-link">
        <img 
          src={profileImageUrl} 
          alt={user.username} 
          className="user-card-avatar"
          onError={(e) => { e.target.onerror = null; e.target.src = defaultPfp; }} // Fallback σε περίπτωση σφάλματος φόρτωσης
        />
        <div className="user-card-info">
          <h3 className="user-card-username">{user.username}</h3>
        </div>
      </Link>
    </div>
  );
};

export default UserCard;
