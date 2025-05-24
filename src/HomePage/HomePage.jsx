import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import './HomePage.css'; 
import api from '../api/api'; 


// Αν η HomePage προορίζεται μόνο για την εμφάνιση όλων των posts, δεν χρειάζεται το prop 'filters'
function HomePage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        // console.log("[HomePage] Fetching all posts"); // Μπορεί να ενεργοποιηθεί για debugging
        const res = await api.get('/posts'); // Πάντα φορτώνει όλα τα posts
        setPosts(res.data);
      } catch (err) {
        console.error('[HomePage] Σφάλμα στο fetch όλων των posts:', err);
      }
    };
    fetchAllPosts();
  }, []); // Κενό dependency array, εκτελείται μία φορά κατά το mount

  return (
    <div className="home-page">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={{
            ...post,
            imageUrl: `http://localhost:5000${post.image_url}`,
            commentCount: 0,
            comments: []
          }}
        />
      ))}
    </div>
  );
}

export default HomePage;