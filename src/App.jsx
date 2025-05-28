import React, { createContext, useState, useEffect } from 'react'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import Login from './Login/Login.jsx';
import Home from './Home.jsx'; 
import ProfilePage from "./Profile/ProfilePage.jsx"; // Για το προφίλ του συνδεδεμένου χρήστη
import UserProfilePage from "./Profile/UserProfilePage.jsx"; // Για το προφίλ άλλων χρηστών
import GalleryPage from "./Gallery/GalleryPage.jsx"; 
import api from './api/api.js'; // Εισαγωγή του api instance
import { IdContext } from './ChatsBar/ChatsBar.jsx'; // Εισαγωγή του IdContext

export const UserContext = createContext();
export const UserUpdateContext = createContext();

function App() {
  const [userType, setUserType] = useState("Registered"); 
  const [currentUserId, setCurrentUserId] = useState(null); // State για το ID του συνδεδεμένου χρήστη

  useEffect(() => {
    const fetchUserId = async () => {
      const email = sessionStorage.getItem('email');
      if (email) {
        try {
          console.log("[App.jsx] Fetching user_id for email:", email);
          const response = await api.get(`/user_id/${email}`);
          setCurrentUserId(response.data.user_id);
          console.log("[App.jsx] Fetched user_id:", response.data.user_id);
        } catch (error) {
          console.error("[App.jsx] Error fetching user_id:", error);
          setCurrentUserId(null); 
        }
      } else {
        console.log("[App.jsx] No email in sessionStorage, setting currentUserId to null.");
        setCurrentUserId(null); 
      }
    };
    fetchUserId();
  }, []); // Τρέχει μία φορά κατά το mount του App component

  return (
    <UserContext.Provider value={userType}>
      <UserUpdateContext.Provider value={setUserType}>
        <IdContext.Provider value={currentUserId}> {/* Παροχή του currentUserId σε όλα τα παιδιά */}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home/*" element={<Home />} /> 
              <Route path="/profile" element={<ProfilePage />} /> {/* Προσωπικό προφίλ */}
              <Route path="/user-profile/:userId" element={<UserProfilePage />} /> {/* Προφίλ άλλου χρήστη */}
              <Route path="/gallery" element={<GalleryPage />} />
            </Routes>
          </BrowserRouter>
        </IdContext.Provider>
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  );
}
export default App;
