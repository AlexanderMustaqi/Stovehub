import React, { createContext, useState, useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'; // Προσθήκη Link
import Login from './Login/Login.jsx';
import Home from './Home.jsx'; 
import ProfilePage from "./Profile/ProfilePage.jsx"; // Για το προφίλ του συνδεδεμένου χρήστη
import UserProfilePage from "./Profile/UserProfilePage.jsx"; // Για το προφίλ άλλων χρηστών
import GalleryPage from "./Gallery/GalleryPage.jsx"; 
import api from './api/api.js'; 
import AdminPanel from './AdminPanel/AdminPanel.jsx';


export const UserContext = createContext({ currentUser: null, handleLogin: () => {}, handleLogout: () => {} });

function App() {
  const [currentUser, setCurrentUser] = useState(null); 

  useEffect(() => {
    const fetchInitialUserData = async () => {
      const email = sessionStorage.getItem('email');
      if (email) {
        try {
          console.log("[App.jsx] Fetching user_id for email:", email);
          const response = await api.get(`/user_id/${email}`);
          const userId = response.data.user_id;

          if (userId) {
            console.log("[App.jsx] Fetched user_id:", userId, "Now fetching full profile info.");
            const profileResponse = await api.get(`/profile_info/${userId}`); 
            console.log("[App.jsx] Fetched profile_info for initial load:", profileResponse.data);
            setCurrentUser({
              id: userId,
              email: email,
              username: profileResponse.data.username,
              bio: profileResponse.data.bio,
              rank: profileResponse.data.rank, 
              profile_image_url: profileResponse.data.profile_image_url
            });
          } else {
            console.log("[App.jsx] No user_id found for email in session, clearing currentUser.");
            sessionStorage.removeItem('email'); 
            sessionStorage.removeItem('authToken'); // Καθαρισμός και του token
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("[App.jsx] Error fetching initial user data:", error);
          sessionStorage.removeItem('email');
          sessionStorage.removeItem('authToken');
          setCurrentUser(null); 
        }
      } else {
        console.log("[App.jsx] No email in sessionStorage, setting currentUser to null.");
        setCurrentUser(null); 
      }
    };
    fetchInitialUserData();
  }, []); 

  // Συνάρτηση για login, θα καλείται από το Login.jsx
  const handleLogin = async (email, password) => {
    try {
      const loginResponse = await api.post('/login', { email, password }); 
      const { token, userId } = loginResponse.data;

      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('email', email);

      // Φόρτωση των στοιχείων του χρήστη μετά το login
      const profileResponse = await api.get(`/profile_info/${userId}`);
      setCurrentUser({
        id: userId,
        email: email,
        username: profileResponse.data.username,
        bio: profileResponse.data.bio,
        rank: profileResponse.data.rank,
        profile_image_url: profileResponse.data.profile_image_url
      });
      return true; // Επιτυχές login
    } catch (error) {
      console.error("[App.jsx] Login failed:", error);
      setCurrentUser(null); // Καθαρισμός χρήστη σε περίπτωση σφάλματος
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('email');
      return false; // Αποτυχία login
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('email');
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider value={{ currentUser, handleLogin, handleLogout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} /> 
          <Route path="/home/*" element={<Home />} /> 
          <Route path="/profile" element={<ProfilePage />} /> {/* Προσωπικό προφίλ */}
          <Route path="/user-profile/:userId" element={<UserProfilePage />} /> {/* Προφίλ άλλου χρήστη */}
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}
export default App;
