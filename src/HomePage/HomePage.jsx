import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import './HomePage.css'; 
import api from '../api/api'; 



function HomePage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get('/posts')
      .then(res => setPosts(res.data))
      .catch(err => console.error('Σφάλμα στο fetch:', err));
  }, []);

  return (
    <div className="home-page">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={{
            ...post,
            imageUrl: `http://localhost:3001${post.image_url}`, // κάνουμε resolve την εικόνα
            commentCount: 0,
            comments: [] // placeholder, εκτός αν φέρνεις και σχόλια
          }}
        />
      ))}
    </div>
  );
}

export default HomePage;