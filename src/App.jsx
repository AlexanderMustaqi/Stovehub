import React, { createContext, useState } from 'react'; // Προσθήκη createContext, useState
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Εισαγωγή Routes, Route
import Login from './Login/Login.jsx';
import Home from './Home.jsx'; // Αυτό είναι το Home component του συνεργάτη
import ProfilePage from "./Profile/ProfilePage.jsx"; // Χρειάζεται να υπάρχει αυτό το αρχείο
import GalleryPage from "./Gallery/GalleryPage.jsx"; // Χρειάζεται να υπάρχει αυτό το αρχείο



// 1. Ορισμός και εξαγωγή του UserContext
export const UserContext = createContext();
export const UserUpdateContext = createContext();

function App() {
  
  const [userType, setUserType] = useState("Registered"); // Ή "Guest" αν προτιμάτε ως αρχική

  // Η παρακάτω γραμμή είναι για δοκιμές. Σε παραγωγή, η τιμή θα έπρεπε να τίθεται μετά από login.
  // if (process.env.NODE_ENV === 'development') {
  //   sessionStorage.setItem("email", "pn@gmail.com");
  // }

  return (
    <UserContext.Provider value={userType}>
      <UserUpdateContext.Provider value={setUserType}>
        <BrowserRouter>
          {/* Εδώ ορίζουμε τις διαδρομές χρησιμοποιώντας τη σύνταξη της v6 */}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home/*" element={<Home />} /> 
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
          
          </Routes>
        </BrowserRouter>
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  );
}
export default App;
