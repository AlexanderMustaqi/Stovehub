import React, { useState } from 'react';
import Navbar from "./Navbar/Navbar.jsx";
import ChatsBar from "./ChatsBar/ChatsBar.jsx";
import AddPostButton from './AddPostButton/AddPostButton.jsx';
import HomePage from './HomePage/HomePage.jsx';
import { FilterSearchOverlay } from './Navbar/FilterSearchOverlay';
import AddPostModal from './AddPostButton/AddPostModal';

function App() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleNewPost = post => {
    console.log("Νέα συνταγή:", post);
    // Εδώ μπορείς να προσθέσεις την αποθήκευση της συνταγής
  };

  const handleApplyFilters = criteria => {
    console.log("Apply filters", criteria);
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
          <HomePage />
          <ChatsBar />
        </div>
      </div>

      <FilterSearchOverlay
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
      />

      <AddPostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleNewPost}
      />
    </>
  );
}

export default App;

