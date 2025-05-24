import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from "./Navbar/Navbar.jsx";
import ChatsBar from "./ChatsBar/ChatsBar.jsx";
import AddPostButton from './AddPostButton/AddPostButton.jsx';
import HomePage from './HomePage/HomePage.jsx';
import SearchResultsPage from './SearchResultsPage/SearchResultsPage.jsx';
import RecipeDetailPage from './RecipeDetailPage/RecipeDetailPage.jsx';
import { FilterSearchOverlay } from './Navbar/FilterSearchOverlay';
import AddPostModal from './AddPostButton/AddPostModal';

// Το AppContent περιέχει τη λογική που χρειάζεται το useNavigate
function AppContent() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  // Το state 'filters' μπορεί να μην είναι πλέον απαραίτητο εδώ αν η HomePage δεν το χρησιμοποιεί
  // και η SearchResultsPage παίρνει φίλτρα από το URL.
  // const [filters, setFilters] = useState(null); 
  const navigate = useNavigate();

  const handleNewPost = post => {
    console.log("Νέα συνταγή:", post);
    // Εδώ μπορείς να προσθέσεις την αποθήκευση της συνταγής
  };

  const handleApplyFilters = criteria => {
    // console.log("[AppContent.jsx] Applying filters:", criteria); // Μπορεί να ενεργοποιηθεί για debugging
    
    // Καθαρισμός κριτηρίων από null, undefined ή κενά strings
    const activeCriteria = {};
    for (const key in criteria) {
      if (criteria[key] != null && criteria[key] !== '') {
        activeCriteria[key] = criteria[key];
      }
    }

    const queryParams = new URLSearchParams(activeCriteria).toString();
    const targetPath = `/search-results?${queryParams}`;
    // console.log("[AppContent.jsx] Navigating to:", targetPath); // Μπορεί να ενεργοποιηθεί για debugging
    try {
      navigate(targetPath); 
      // console.log("[AppContent.jsx] Navigation successful");
    } catch (e) {
      console.error("[AppContent.jsx] Error during navigation:", e);
    }
    setFilterVisible(false);
  };

  const handleSearchClick = () => {
    console.log('Filter icon clicked');
    setFilterVisible(true);
  };

  return (
    <>
      <div className="app">
        <Navbar onSearchClick={handleSearchClick} />
        <div className="lowerdiv">
          <AddPostButton onClick={() => setModalVisible(true)} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search-results" element={<SearchResultsPage />} />
            <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /> {/* Νέα διαδρομή */}
            {/* Άλλα routes μπορούν να προστεθούν εδώ */}
          </Routes>
          <ChatsBar />
        </div>
      </div>
      <FilterSearchOverlay visible={filterVisible} onClose={() => setFilterVisible(false)} onApply={handleApplyFilters} />
      <AddPostModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={handleNewPost} />
    </>
  );
}

export default AppContent;