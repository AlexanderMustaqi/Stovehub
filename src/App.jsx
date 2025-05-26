import { createContext, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './Login/Login.jsx';
import Home from './Home.jsx'
import ProfilePage from "./Profile/ProfilePage.jsx";
import GalleryPage from "./Gallery/GalleryPage.jsx";

// import DevFile from './DeveloperFolder/DevFile.jsx'

export const UserContext = createContext();
export const UserUpdateContext = createContext();

function App() {

    const [userType, setuserType] = useState("Registered");

    return(
        <UserContext.Provider value={userType}>
            <UserUpdateContext.Provider value={setuserType}>
                <Router>
                    <Routes>
                        <Route path="/" element={<Login /> }></Route>
                        <Route path="/home/*" element={<Home />}></Route>
                        <Route path="/profile/" element={<ProfilePage />}></Route>
                        <Route path="/gallery/" element={<GalleryPage />}></Route>
                    </Routes>
                </Router>
            </UserUpdateContext.Provider>
        </UserContext.Provider>
    )
}

export default App