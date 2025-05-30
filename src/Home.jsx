import React, { useContext, useState, useEffect } from 'react'; 
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'; 
import Navbar from "./Navbar/Navbar.jsx";
import ChatsBar from "./ChatsBar/ChatsBar.jsx";
import AddPostButton from './AddPostButton/AddPostButton.jsx';
import HomePage from './HomePage/HomePage.jsx';
import SearchResultsPage from './SearchResultsPage/SearchResultsPage.jsx';
import RecipeDetailPage from './RecipeDetailPage/RecipeDetailPage.jsx';
import { FilterSearchOverlay } from './Navbar/FilterSearchOverlay.jsx';
import AddPostModal from './AddPostButton/AddPostModal.jsx';
import api from './api/api.js';
import AdminPanel from './AdminPanel/AdminPanel.jsx'; // Εισαγωγή του AdminPanel
import { UserContext } from './App.jsx'; // Για έλεγχο του rank του χρήστη

import { IdContext } from './ChatsBar/ChatsBar.jsx'; 

// Το AppContent περιέχει τη λογική που χρειάζεται το useNavigate
function AppContent() {
  const [filterVisible, setFilterVisible] = useState(false);
  const { currentUser } = useContext(UserContext); // Πρόσβαση στο currentUser για έλεγχο rank
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserId = async () => {
      const email = sessionStorage.getItem('email');
      if (email) {
        try {
          const response = await api.get(`/user_id/${email}`);
          setCurrentUserId(response.data.user_id);
        } catch (error) {
          console.error("Error fetching user_id:", error);
          setCurrentUserId(null); 
        }
      }
    };
    fetchUserId();
  }, []);

  const handleNewPost = post => {
    console.log("Νέα συνταγή:", post);
  };

  const handleApplyFilters = criteria => {
    
    const activeCriteria = {};
    for (const key in criteria) {
      if (criteria[key] != null && criteria[key] !== '') {
        activeCriteria[key] = criteria[key];
      }
    }

    const queryParams = new URLSearchParams(activeCriteria).toString();
    const targetPath = `/home/search-results?${queryParams}`; 
    try {
      navigate(targetPath); 
      // console.log("[AppContent.jsx] Navigation successful");
    } catch (e) {
      console.error("[AppContent.jsx] Error during navigation:", e);
    }
    setFilterVisible(false);
  };

  const handleOpenAddPostModal = () => {
    const userEmail = sessionStorage.getItem('email');
    if (!userEmail) {
      alert('Παρακαλώ συνδεθείτε ή εγγραφείτε για να δημιουργήσετε μια συνταγή.');
    } else {
      setModalVisible(true); // Ανοίγουμε το modal μόνο αν υπάρχει email
    }
  };


  const handleSearchClick = () => {
    console.log('Filter icon clicked');
    setFilterVisible(true);
  };

  return (
    <IdContext.Provider value={currentUserId}>
      <>
        <div className="app">
          <Navbar onSearchClick={handleSearchClick} />
          <div className="lowerdiv">
            <AddPostButton onClick={handleOpenAddPostModal} /> 
            <Routes>
              <Route index element={<HomePage />} /> {/* Χρήση του 'index' για τη βασική διαδρομή /home */}
              <Route path="search-results" element={<SearchResultsPage />} /> 
              <Route path="recipes/:recipeId" element={<RecipeDetailPage />} /> 
              <Route
                path="admin-panel"
                element={
                  currentUser && currentUser.rank === 'admin' ? (
                    <AdminPanel />
                  ) : (
                    <Navigate to="/home" replace /> // Ανακατεύθυνση αν δεν είναι admin
                  )
                }
              />
            </Routes>
            <ChatsBar />
          </div>
        </div>
        <FilterSearchOverlay visible={filterVisible} onClose={() => setFilterVisible(false)} onApply={handleApplyFilters} />
        <AddPostModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={handleNewPost} />
      </>
    </IdContext.Provider>

  );
}

export default AppContent;