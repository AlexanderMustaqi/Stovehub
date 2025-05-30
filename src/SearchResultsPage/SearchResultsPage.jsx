import React, { useState, useEffect, useContext } from 'react'; 
import { useLocation } from 'react-router-dom';
import PostCard from '../HomePage/PostCard'; 
import '../HomePage/HomePage.css'; 
import UserCard from '../Profile/UserCard'; 
import api from '../api/api';
import { IdContext } from '../ChatsBar/ChatsBar'; 

function SearchResultsPage() {
  const [posts, setPosts] = useState([]);
  const [currentSearchType, setCurrentSearchType] = useState(null); 
  const location = useLocation(); 
  const currentUserId = useContext(IdContext); 

  useEffect(() => {
    const controller = new AbortController(); 

    const fetchFilteredPosts = async () => {
      const queryParams = new URLSearchParams(location.search);
      // Δημιουργία αντικειμένου filters από τις παραμέτρους URL
      const filtersFromUrl = {
        query: queryParams.get('query'),
        type: queryParams.get('type'), 
        category: queryParams.get('category'),
        difficulty: queryParams.get('difficulty'),
        prepTime: queryParams.get('prepTime'),
        ingredients: queryParams.get('ingredients'),
      };

      // Καθαρισμός από null/undefined τιμές για να μην σταλούν ως κενές παράμετροι
      const activeFilters = Object.entries(filtersFromUrl)
        .filter(([_, value]) => value != null && value !== '')
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
      
      // Ενημέρωση του τύπου αναζήτησης για χρήση στο rendering
      if (activeFilters.type) {
        setCurrentSearchType(activeFilters.type);
      } else {
        setCurrentSearchType(null); 
      }
      console.log("[SearchResultsPage] Active filters from URL (including type):", JSON.stringify(activeFilters));

      if (Object.keys(activeFilters).length === 0) {
        console.log("[SearchResultsPage] No active search filters from URL, clearing posts.");
        setPosts([]);
        return;
      }

      try {
        let url;
        const paramsForApi = new URLSearchParams(); 
        let shouldUseSearchEndpoint = false;

        // Λογική κατασκευής URL παρόμοια με το HomePage.jsx
        if (activeFilters.query) {
          paramsForApi.append('query', activeFilters.query);
          shouldUseSearchEndpoint = true;
        }

        if (activeFilters.type === 'recipes') {
          shouldUseSearchEndpoint = true;
          if (activeFilters.category) paramsForApi.append('category', activeFilters.category);
          if (activeFilters.difficulty) paramsForApi.append('difficulty', activeFilters.difficulty);
          if (activeFilters.prepTime) paramsForApi.append('prepTime', activeFilters.prepTime);
          if (activeFilters.ingredients) paramsForApi.append('ingredients', activeFilters.ingredients);
        }

        if (shouldUseSearchEndpoint) {
          url = (activeFilters.type === 'users') ? '/users/search' : '/posts/search'; // Παράδειγμα για users
          if (paramsForApi.toString()) {
            if (activeFilters.type === 'recipes' && currentUserId) {
              paramsForApi.append('userId', currentUserId);
            }
            url += `?${paramsForApi.toString()}`;
          }
        } else { 
          console.log("[SearchResultsPage] Conditions for search endpoint not met, clearing posts.");
          setPosts([]);
          return;
        }
        
        console.log("[SearchResultsPage] Attempting to fetch URL:", url); 
        const res = await api.get(url, { signal: controller.signal }); 
        setPosts(res.data); // Ενημέρωση μόνο αν το request δεν ακυρώθηκε
      } catch (err) {
        if (err.name === 'CanceledError') {
          // console.log('[SearchResultsPage] Fetch aborted'); 
        } else {
          console.error('[SearchResultsPage] Σφάλμα στο fetch:', err);
          setPosts([]); 
        }
      }
    };
    // Εκτέλεση του fetch μόνο αν υπάρχουν query parameters
    if (location.search) {
      fetchFilteredPosts();
    } else {
      setPosts([]); // Καθάρισμα των posts αν δεν υπάρχουν query params
    }

    return () => {
      controller.abort();
    };
  }, [location.search, currentUserId]); 

  if (posts.length === 0 && location.search) {
    return (
      <div className="home-page search-feedback-container">
        <div className="search-feedback-content">
          <span className="search-feedback-icon">😕</span>
          <h2>Δεν βρέθηκαν αποτελέσματα</h2>
          <p>Λυπούμαστε, δεν μπορέσαμε να βρούμε κάτι που να ταιριάζει με την αναζήτησή σας. Δοκιμάστε διαφορετικούς όρους ή προσαρμόστε τα φίλτρα.</p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="home-page">
      {currentSearchType === 'users' && posts.map(user => (
        <UserCard key={user.user_id} user={user} />
      ))}
      {currentSearchType === 'recipes' && posts.map(post => (
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

export default SearchResultsPage;
