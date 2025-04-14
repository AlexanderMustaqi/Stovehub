import Navbar from "./Navbar/Navbar.jsx";
import ChatsBar from "./ChatsBar/ChatsBar.jsx";
import AddPostButton from './AddPostButton/AddPostButton.jsx'
import HomePage from './HomePage/HomePage.jsx'

function App() {

    return(
        <>
        <div className="app">
            <Navbar></Navbar>
            <div className="lowerdiv">
                <AddPostButton></AddPostButton>
                <HomePage></HomePage>
                <ChatsBar></ChatsBar>
            </div>

        </div>
            
        </>
    );
}

export default App
