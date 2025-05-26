import React, { useState, useEffect, useContext } from 'react'; // Προσθήκη useContext
import { useLocation } from 'react-router-dom';
import PostCard from '../HomePage/PostCard'; // Προσαρμογή διαδρομής αν χρειάζεται
import '../HomePage/HomePage.css'; // Χρήση ίδιων στυλ ή δημιουργία νέων
import api from '../api/api';
import { IdContext } from '../ChatsBar/ChatsBar'; // Υποθέτουμε ότι αυτό είναι το σωστό Context

function SearchResultsPage() {
  const [posts, setPosts] = useState([]);
  const location = useLocation(); // Για πρόσβαση στις παραμέτρους URL
  const currentUserId = useContext(IdContext); // Λήψη του currentUserId

  useEffect(() => {
    const controller = new AbortController(); // Δημιουργία AbortController

    const fetchFilteredPosts = async () => {
      const queryParams = new URLSearchParams(location.search);
      // Δημιουργία αντικειμένου filters από τις παραμέτρους URL
      const filtersFromUrl = {
        query: queryParams.get('query'),
        type: queryParams.get('type'), // Το 'type' είναι σημαντικό για τη λογική αναζήτησης
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
      
      console.log("[SearchResultsPage] Active filters from URL (including type):", JSON.stringify(activeFilters));

      if (Object.keys(activeFilters).length === 0) {
        console.log("[SearchResultsPage] No active search filters from URL, clearing posts.");
        setPosts([]);
        return;
      }

      try {
        let url;
        const paramsForApi = new URLSearchParams(); // Παράμετροι για την κλήση API
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
        // Εδώ μπορείς να προσθέσεις λογική για activeFilters.type === 'users' αν χρειάζεται
        // και να καλέσεις ένα διαφορετικό endpoint, π.χ., /users/search

        if (shouldUseSearchEndpoint) {
          url = (activeFilters.type === 'users') ? '/users/search' : '/posts/search'; // Παράδειγμα για users
          if (paramsForApi.toString()) {
            // Προσθήκη userId στις παραμέτρους αν υπάρχει και ψάχνουμε για recipes
            if (activeFilters.type === 'recipes' && currentUserId) {
              paramsForApi.append('userId', currentUserId);
            }
            url += `?${paramsForApi.toString()}`;
          }
        } else {
          // Αν δεν πρέπει να χρησιμοποιηθεί το search endpoint αλλά υπάρχουν φίλτρα,
          // αποφάσισε τη συμπεριφορά (π.χ. εμφάνιση μηνύματος)
          console.log("[SearchResultsPage] Conditions for search endpoint not met, clearing posts.");
          setPosts([]);
          return;
        }
        
        console.log("[SearchResultsPage] Attempting to fetch URL:", url); 
        const res = await api.get(url, { signal: controller.signal }); // Πέρασμα του signal στο request
        setPosts(res.data); // Ενημέρωση μόνο αν το request δεν ακυρώθηκε
      } catch (err) {
        if (err.name === 'CanceledError') {
          // console.log('[SearchResultsPage] Fetch aborted'); // Το request ακυρώθηκε, δεν είναι πραγματικό σφάλμα
        } else {
          console.error('[SearchResultsPage] Σφάλμα στο fetch:', err);
          setPosts([]); // Καθάρισμα σε περίπτωση πραγματικού σφάλματος
        }
      }
    };

    // Εκτέλεση του fetch μόνο αν υπάρχουν query parameters
    if (location.search) {
      fetchFilteredPosts();
    } else {
      setPosts([]); // Καθάρισμα των posts αν δεν υπάρχουν query params
    }

    // Cleanup συνάρτηση για ακύρωση του request αν το component γίνει unmount ή το effect ξανατρέξει
    return () => {
      controller.abort();
    };
  }, [location.search, currentUserId]); // Επαναφόρτωση όταν αλλάζουν οι παράμετροι URL ή το currentUserId

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
      {posts.map(post => (
        <PostCard
          key={post.id} // Βεβαιώσου ότι το post.id είναι μοναδικό
          post={{
            ...post,
            imageUrl: `http://localhost:5000${post.image_url}`,
            // Προσαρμογή για να είναι συνεπές με το HomePage.jsx
            commentCount: post.comment_count || 0, // Χρησιμοποιούμε comment_count όπως στο HomePage
            comments: [] // Περιττό να περνάμε τα comments εδώ, όπως και στο HomePage
          }}
        />
      ))}
    </div>
  );
}

export default SearchResultsPage;
