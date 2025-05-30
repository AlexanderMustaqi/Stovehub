import React, { useState, useEffect, useContext } from 'react'; 
import PostCard from './PostCard';
import './HomePage.css'; 
import api from '../api/api'; 
import { IdContext } from '../ChatsBar/ChatsBar';


function HomePage() {
  const [posts, setPosts] = useState([]);
  const currentUserId = useContext(IdContext);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        // Δημιουργία του endpoint δυναμικά, προσθέτοντας το userId αν υπάρχει
        const endpoint = currentUserId ? `/posts?userId=${currentUserId}` : '/posts';
        // console.log(`[HomePage] Fetching posts with endpoint: ${endpoint}`); // Για debugging
        const res = await api.get(endpoint); 
        setPosts(res.data);
      } catch (err) {
        console.error('[HomePage] Σφάλμα στο fetch όλων των posts:', err);
      }
    };
    fetchAllPosts();
  }, [currentUserId]); 

  return (
    <div className="home-page">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={{
            ...post,
            imageUrl: `http://localhost:5000${post.image_url}`,
            commentCount: post.comment_count || 0,
            comments: []
          }}
        />
      ))}
    </div>
  );
}

export default HomePage;