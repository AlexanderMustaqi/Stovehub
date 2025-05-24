import Navbar from "./Navbar/Navbar.jsx";
import ChatsBar from "./ChatsBar/ChatsBar.jsx";
import AddPostButton from './AddPostButton/AddPostButton.jsx'
import HomePage from './HomePage/HomePage.jsx'
import { useState } from "react";


function Home() {

    return(
                <div className='app'>
                    <Navbar></Navbar>
                    <div id="lowerdiv" className="lowerdiv">
                        <AddPostButton></AddPostButton>
                        <HomePage></HomePage>
                        <ChatsBar></ChatsBar>
                    </div>
                </div>
            )
}

export default Home