import React, { useEffect, useState, useRef, useContext } from "react"; // Προσθήκη React και hooks
import { useParams } from "react-router-dom"; // Για να πάρουμε το userId από το URL
import Navbar from "../Navbar/Navbar";
import ChatsBar from "../ChatsBar/ChatsBar";
import api from "../api/api";
import { IdContext } from '../ChatsBar/ChatsBar'; // Για το ID του συνδεδεμένου χρήστη

export default function UserProfilePage() {
    const { userId } = useParams(); // ID του χρήστη του οποίου το προφίλ βλέπουμε
    const loggedInUserEmail = sessionStorage.getItem('email'); // Email του συνδεδεμένου χρήστη
    const loggedInUserId = useContext(IdContext); // ID του συνδεδεμένου χρήστη

    const [profileData, setProfileData] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const usernameRef = useRef(null);
    const bioRef = useRef(null);
    const rankRef = useRef(null);
    const profileImageRef = useRef(null); // Ref για την εικόνα προφίλ

    // StyleSheet αντικείμενα (μπορούν να μεταφερθούν σε CSS αρχείο)

    const pcss = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }

    const ulss = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '30vh'
    }

    const Upper = {
        border: '2px solid black',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: '30vh'
    }

    const UserInfo = {
        width: '80vh',
        height: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'left'
    }

    const FollowOption = {
        height: 'inherit',
        alignItems: 'top',
    }

    const FollowButton = {
        width: '200px',
        height: '100px',
        fontSize: '50px'
    }

    const Lower = {
        border: '2px solid black',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'left'
    }

    const handleClickEvent = async () => {
        if (!profileData || !profileData.email) {
            console.error("Δεν υπάρχουν πληροφορίες email για τον χρήστη του προφίλ.");
            return;
        }
        const info = {
            main_user : loggedInUserEmail, // Email του συνδεδεμένου χρήστη
            sec_user : profileData.email // Email του χρήστη του οποίου το προφίλ βλέπουμε
        }
        try {
            const serverResponse = await api.post(`/postFollower`, info); // Αφαίρεση trailing slash
            if (serverResponse.data === `success`) {
                console.log('Successfully followed user.');
                // Εδώ μπορείς να προσθέσεις λογική για να ενημερώσεις το UI (π.χ. αλλαγή κουμπιού σε "Unfollow")
            }
        }
        catch (err) {
            console.error("Error following user:", err);
        }
    }

    useEffect(() => {
        if (!userId) return; // Αν δεν υπάρχει userId στο URL, μην κάνεις τίποτα

        const fetchUserProfileData = async () => {
            try {
                // Χρησιμοποιούμε το userId από το URL για να φέρουμε τα δεδομένα
                const response = await api.get(`/profile_info/${userId}`);
                setProfileData(response.data);
                if (response.data) {
                    if (usernameRef.current) usernameRef.current.textContent = response.data.username || 'N/A';
                    if (bioRef.current) bioRef.current.textContent = response.data.bio || 'Δεν υπάρχει bio.';
                    if (rankRef.current) rankRef.current.textContent = response.data.rank || 'Unranked';
                    if (profileImageRef.current) {
                        profileImageRef.current.src = response.data.profile_image_url
                            ? `http://localhost:5000${response.data.profile_image_url}`
                            : `http://localhost:5000/uploads/pfp/default-pfp.svg`;
                    }
                } else {
                    // Χειρισμός περίπτωσης όπου ο χρήστης δεν βρέθηκε
                    setProfileData(null);
                }
            }
            catch(err) {
                console.error("Error fetching user profile data:", err);
                setProfileData(null);
            }
        }
        fetchUserProfileData();
    }, [userId]); // Το effect τρέχει ξανά όταν αλλάξει το userId

    useEffect(() => {
        if (!userId) return;

        const fetchUserRecipes = async() => {
            try {
                const response = await api.get(`/profile_recipies/${userId}`);
                setRecipes(response.data || []);
            }
            catch(err) {
                console.error("Error fetching user recipes:", err);
                setRecipes([]);
            }
        }
        fetchUserRecipes();
    }, [userId]);

    // Ένδειξη φόρτωσης ή αν ο χρήστης δεν βρέθηκε
    if (!profileData && userId) {
        return (
            <div className='app'>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '20px' }}>Φόρτωση προφίλ χρήστη...</div>
                <ChatsBar />
            </div>
        );
    }

    return(
        <div className='app'>
            <Navbar></Navbar>
            <div style={pcss}> 
                <div style={ulss}>
                    <div style={Upper}>
                        <img ref={profileImageRef} src={`http://localhost:5000/uploads/pfp/default-pfp.svg`} alt="Profile" style={{width: '30vh', height: '30vh', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '8px'}} />
                        <div style={UserInfo}>
                            <h5 ref={usernameRef}>Username</h5>
                            <h5 ref={bioRef}>Bio</h5>
                            <h5 ref={rankRef}>Rank</h5>
                        </div>
                        {/* Έλεγχος για να μην εμφανίζεται το κουμπί follow αν ο χρήστης βλέπει το δικό του προφίλ μέσω αυτού του URL */}
                        {loggedInUserId && profileData && parseInt(loggedInUserId) !== parseInt(profileData.user_id) && (
                            <div style={FollowOption}>
                                <button style={FollowButton} onClick={handleClickEvent}>Follow</button>
                            </div>
                        )}
                    </div>
                    <ul style={Lower}>
                        {recipes.length > 0 ? (
                            recipes.map((recipe) => <li key={recipe.id}>{recipe.title || 'Recipe without title'}</li>)
                        ) : (
                            <li>Αυτός ο χρήστης δεν έχει δημοσιεύσει συνταγές.</li>
                        )}
                    </ul>
                </div>
                <ChatsBar />
            </div>
        </div>
    )
}