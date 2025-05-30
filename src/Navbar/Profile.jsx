import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import ProfileIcon from './assets/person-outline.svg'
import { UserContext } from '../App';

function Profile() {
    const [popUpFlag, setpopUpFlag] = useState(false);
    const { currentUser, handleLogout: contextLogout } = useContext(UserContext); // Παίρνουμε το currentUser και τη συνάρτηση logout
    const nav = useNavigate();

    const stylesheet1 = 
    {
        padding: "20px",
        background: "white",
        borderRadius: "10%",
        display: 'flex',
        flexDirection: 'column',
        justifyContent:'center',
        alignItems:'center'
    }

    const stylesheet2 = 
    {
        position: "fixed",
        top: '10%',
        right: '0',
        border: "1px solid black",
        borderRadius: '10%'
    }
    
    const stylesheet3 =
    {
        border: "1px solid black",
        borderRadius: "10%",
        padding: "10px",
        marginBottom: '5px',
        width: "100%",
        backgroundColor: "",
        textAlign: 'center',
        cursor: 'pointer',
        textDecoration: 'none',
        text: 'blue'
    }
    
    const popUp = () => {
        setpopUpFlag(!popUpFlag)
    }

    const handleProfileClicked = () => {
        setpopUpFlag(false); 
    }
    const handleLogOutClicked = () => {
        setpopUpFlag(false); 
        contextLogout(); // Κλήση της συνάρτησης logout από το context
        nav("/");
    }
    const handleAdminPanelClicked = () => {
        setpopUpFlag(false); 
        nav("/home/admin-panel"); // Αλλαγή της διαδρομής
    }
    const handleSettingsClicked = () => {
        alert("Work in Progress");
    }

    return(<>
            <img src={ProfileIcon} alt="Profile" className='navbar-profile' onClick={popUp}/>
            
            {popUpFlag && (
               <div style={stylesheet2}>
                    {(currentUser) ? // Έλεγχos αν υπάρχει currentUser
                    (<div style={stylesheet1}>
                        <button style={stylesheet3} onClick={handleProfileClicked}>Profile</button>
                        {currentUser.rank === 'admin' && ( // Εμφάνιση μόνο αν είναι admin
                            <button style={stylesheet3} onClick={handleAdminPanelClicked}>Admin Panel</button>
                        )}
                        <button style={stylesheet3} onClick={handleSettingsClicked}>Settings</button>
                        <button style={stylesheet3} onClick={handleLogOutClicked}>Logout</button>
                    </div>)
                    :
                    (<div style={stylesheet2}>
                        <button style={stylesheet3} onClick={handleLogOutClicked}>Log In</button>
                    </div>)}
                </div>
            )}
        </>);
}

export default Profile