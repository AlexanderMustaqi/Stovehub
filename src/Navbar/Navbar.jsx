import React from "react";
import Logo from "./Logo";
import Search from "./Search";
import Home from "./Home";
import Gallery from "./Gallery";
import Notifications from "./Notifications";
import Profile from "./Profile";
import Cart from "./Cart";

function Navbar({ onSearchClick }) {
    return(
        <>
            <div className="navbar">
                <div className="navbar-left">
                    
                    <Logo></Logo>
                    <Search onClick={onSearchClick} />
                  
                </div>
                <div className="navbar-center">
                    <Home></Home>
                    <Gallery></Gallery>
                </div>
                <div className="navbar-right">
                    <Notifications></Notifications>
                    <Cart></Cart>
                    <Profile></Profile>
                </div>
            </div>
            <hr />
        </>
    );
}


export default Navbar;