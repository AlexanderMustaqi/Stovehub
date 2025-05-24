import { createContext, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
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
                    <Switch>
                        <Route exact path='/'>
                            <Login></Login>
                        </Route>
                        <Route exact path='/home'>
                            <Home></Home>
                        </Route>
                        <Route exact path='/profile'>
                            <ProfilePage></ProfilePage>
                        </Route>
                        <Route exact path='/gallery'>
                            <GalleryPage></GalleryPage>
                        </Route>
                    </Switch>
                </Router>
            </UserUpdateContext.Provider>
        </UserContext.Provider>
    )
}

export default App