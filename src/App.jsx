import React, { createContext, useState } from 'react'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import Login from './Login/Login.jsx';
import Home from './Home.jsx'; 
import ProfilePage from "./Profile/ProfilePage.jsx"; // Για το προφίλ του συνδεδεμένου χρήστη
import UserProfilePage from "./Profile/UserProfilePage.jsx"; // Για το προφίλ άλλων χρηστών
import GalleryPage from "./Gallery/GalleryPage.jsx"; 



export const UserContext = createContext();
export const UserUpdateContext = createContext();

function App() {
  
  const [userType, setUserType] = useState("Registered"); 

  

  return (
    <UserContext.Provider value={userType}>
      <UserUpdateContext.Provider value={setUserType}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home/*" element={<Home />} /> 
            <Route path="/profile" element={<ProfilePage />} /> {/* Προσωπικό προφίλ */}
            <Route path="/user-profile/:userId" element={<UserProfilePage />} /> {/* Προφίλ άλλου χρήστη */}
            <Route path="/gallery" element={<GalleryPage />} />
          
          </Routes>
        </BrowserRouter>
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  );
}
export default App;
