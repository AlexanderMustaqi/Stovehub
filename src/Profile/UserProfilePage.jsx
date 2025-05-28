import React, { useEffect, useState, useRef, useContext } from "react"; // Προσθήκη React και hooks
import { useParams, useNavigate } from "react-router-dom"; // Για να πάρουμε το userId από το URL και για πλοήγηση
import Navbar from "../Navbar/Navbar";
import ChatsBar from "../ChatsBar/ChatsBar";
import api from "../api/api";
import { IdContext } from '../ChatsBar/ChatsBar'; // Για το ID του συνδεδεμένου χρήστη
import './ProfilePage.css'; // Χρήση των ίδιων CSS με το ProfilePage
import { FilterSearchOverlay } from '../Navbar/FilterSearchOverlay.jsx'; // Για την αναζήτηση

export default function UserProfilePage() {
    const { userId } = useParams(); // ID του χρήστη του οποίου το προφίλ βλέπουμε
    const loggedInUserId = useContext(IdContext); // ID του συνδεδεμένου χρήστη

    const [profileData, setProfileData] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const profileImageRef = useRef(null); // Ref για την εικόνα προφίλ
    const [loadingProfile, setLoadingProfile] = useState(true); // Νέα κατάσταση για τη φόρτωση του προφίλ
    const [loadingFollowData, setLoadingFollowData] = useState(true); // Κατάσταση για τη φόρτωση των follow data
    const navigate = useNavigate();
    const [filterVisible, setFilterVisible] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    const defaultPfpSrc = `http://localhost:5000/uploads/pfp/default-pfp.svg`;

    // Συνάρτηση για τη φόρτωση της λίστας των followers και τον καθορισμό του isFollowing
    const fetchFollowDetails = async () => {
        if (!userId) {
            setLoadingFollowData(false);
            return; 
        }
        // Δεν χρειάζεται να περιμένουμε το loggedInUserId εδώ, καθώς ο έλεγχος isFollowing γίνεται μετά την απάντηση
        setLoadingFollowData(true);
        try {
            // Κλήση στο endpoint που επιστρέφει τη λίστα των followers του profile user
            // Χρησιμοποιούμε το :userId από το URL params, που αντιστοιχεί στο :user του backend endpoint
            const response = await api.get(`/followers/${userId}`); 
            const followersList = response.data; 

            if (Array.isArray(followersList)) {
                setFollowerCount(followersList.length);
                // Έλεγχος αν ο loggedInUserId (από το context) είναι ανάμεσα στους followers
                if (loggedInUserId && followersList.some(follower => follower.user_id === loggedInUserId)) {
                    setIsFollowing(true);
                } else {
                    setIsFollowing(false);
                }
            } else {
                console.error("[UserProfilePage] /api/followers/:userId did not return an array.", followersList);
                setFollowerCount(0);
                setIsFollowing(false);
            }
        } catch (err) {
            console.error(`[UserProfilePage] Error fetching followers list for user ${userId}:`, err);
            setFollowerCount(0); 
            setIsFollowing(false); 
        } finally {
            setLoadingFollowData(false);
        }
    };

    useEffect(() => {
        if (!userId) {
            setLoadingProfile(false);
            setLoadingFollowData(false); // Σταμάτα και το loading των follow data
            return;
        }

        const fetchUserProfileData = async () => {
            setLoadingProfile(true);
            try {
                const response = await api.get(`/profile_info/${userId}`);
                setProfileData(response.data);
                if (!response.data) {
                    setProfileData(null);
                }
            }
            catch(err) {
                console.error("[UserProfilePage] Error fetching user profile data:", err);
                setProfileData(null);
            } finally {
                setLoadingProfile(false);
            }
        }
        fetchUserProfileData();

        // Κάλεσμα για την αρχική φόρτωση των follow details μόνο αν το loggedInUserId δεν είναι undefined
        // και το userId υπάρχει.
        if (loggedInUserId !== undefined && userId) {
            fetchFollowDetails();
        } else if (userId && loggedInUserId === null) { // Αν ο χρήστης δεν είναι συνδεδεμένος, αλλά βλέπει προφίλ
            fetchFollowDetails(); // Κάλεσε το για να πάρει τουλάχιστον το follower count
        }

    }, [userId, loggedInUserId]); // Το effect τρέχει ξανά όταν αλλάξει το userId ή το loggedInUserId

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

    const handleFollowToggle = async () => {
        const loggedInUserStoredEmail = sessionStorage.getItem('email'); // Email του συνδεδεμένου χρήστη

        if (!loggedInUserStoredEmail || !profileData || !profileData.email) {
            alert("Πρέπει να είστε συνδεδεμένος ή λείπουν πληροφορίες προφίλ για αυτή την ενέργεια.");
            return;
        }
        if (loggedInUserId && profileData && profileData.user_id && loggedInUserId === profileData.user_id) {
            return; // Ο χρήστης δεν μπορεί να (un)follow τον εαυτό του
        }
        console.log('postFollower called with:',profileData.email, loggedInUserStoredEmail);
        try {
            if (isFollowing) {
                // Λογική για Unfollow: καλεί το /api/removeFollower
                await api.post(`/removeFollower`, { 
                    main_user_email: profileData.email, // Email του προφίλ που βλέπουμε (ο χρήστης που ακολουθείται)
                    sec_user_email: loggedInUserStoredEmail // Email του συνδεδεμένου χρήστη (αυτός που κάνει unfollow)
                });
            } else {
                // Λογική για Follow: καλεί το /api/postFollower
                await api.post(`/postFollower`, { 
                    main_user: profileData.email,        // ο χρήστης που δέχεται το follow
                    sec_user: loggedInUserStoredEmail    // ο χρήστης που κάνει follow
                });
            }
            // Μετά την επιτυχή ενέργεια, ξαναφόρτωσε τη λίστα των followers για ενημέρωση
            await fetchFollowDetails();
        } catch (err) {
            console.error("[UserProfilePage] Error during follow/unfollow action:", err.response ? err.response.data : err.message);
            alert(`Σφάλμα: ${err.response?.data?.message || 'Προέκυψε ένα σφάλμα κατά την ενέργεια follow/unfollow.'}`);
            // Σε περίπτωση σφάλματος, καλό είναι να ξαναφέρουμε την κατάσταση για να είναι συνεπής
            await fetchFollowDetails();
        }
    };

    const handleSearchClick = () => {
        setFilterVisible(true);
    };

    const handleApplyFilters = criteria => {
        const activeCriteria = {};
        for (const key in criteria) {
          if (criteria[key] != null && criteria[key] !== '') {
            activeCriteria[key] = criteria[key];
          }
        }
    
        const queryParams = new URLSearchParams(activeCriteria).toString();
        const targetPath = `/home/search-results?${queryParams}`; 
        try {
          navigate(targetPath); 
        } catch (e) {
          console.error("[UserProfilePage.jsx] Error during navigation:", e);
        }
        setFilterVisible(false);
      };

    // Console logs για debugging της συνθήκης του κουμπιού
    // console.log("[UserProfilePage] Checking button visibility conditions:");
    // console.log("  loggedInUserId:", loggedInUserId);
    // console.log("  profileData:", profileData);
    // console.log("  profileData?.user_id:", profileData?.user_id);
    // if (profileData && loggedInUserId !== undefined) { // Έλεγχος και για undefined loggedInUserId
    //     console.log("  loggedInUserId !== profileData.user_id:", loggedInUserId !== profileData.user_id);
    // }

    // Έλεγχος και για τις δύο καταστάσεις φόρτωσης
    if (loadingProfile || (loggedInUserId !== undefined && loadingFollowData && userId)) {
        return (
            <div className='app'>
                <Navbar onSearchClick={handleSearchClick} />
                <div style={{ textAlign: 'center', padding: '20px' }}>Φόρτωση προφίλ χρήστη...</div>
                <ChatsBar />
                <FilterSearchOverlay 
                    visible={filterVisible} 
                    onClose={() => setFilterVisible(false)} 
                    onApply={handleApplyFilters} 
                />
            </div>
        );
    }

    if (!profileData) { // Αν μετά τη φόρτωση το profileData είναι ακόμα null, σημαίνει ότι δεν βρέθηκε
        return (
            <div className='app'>
                <Navbar onSearchClick={handleSearchClick} />
                <div style={{ textAlign: 'center', padding: '20px' }}>Το προφίλ χρήστη δεν βρέθηκε.</div>
                <ChatsBar />
                <FilterSearchOverlay 
                    visible={filterVisible} 
                    onClose={() => setFilterVisible(false)} 
                    onApply={handleApplyFilters} 
                />
            </div>
        );
    }

    return(
        <div className='app'>
            <Navbar onSearchClick={handleSearchClick} />
            <div className="profile-page-container"> 
                <div className="profile-content">
                    <div className="profile-upper-section">
                        <div className="profile-image-container">
                            <img 
                                //ref={profileImageRef} 
                                className="profile-image"
                                src={
                                    profileData?.profile_image_url
                                        ? `http://localhost:5000${profileData.profile_image_url}`
                                        : defaultPfpSrc
                                } 
                                alt="Profile" 
                                onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = defaultPfpSrc;
                                }}
                            />
                        </div>
                        <div className="profile-user-info">
                            <h5>{profileData?.username || 'Username'}</h5>
                            <h5>{profileData?.bio || 'Bio'}</h5>
                            <h5>{profileData?.rank || 'Rank'}</h5>
                            {loadingFollowData && loggedInUserId !== undefined && userId ? (
                                <p className="profile-follower-count">Loading followers...</p>
                            ) : (
                                <p className="profile-follower-count">Followers: {followerCount}</p>
                            )}
                        </div>
                        {/* Έλεγχος για να μην εμφανίζεται το κουμπί follow αν ο χρήστης βλέπει το δικό του προφίλ μέσω αυτού του URL */}
                        {!loadingFollowData && loggedInUserId && profileData && profileData.user_id && loggedInUserId !== profileData.user_id && (
                            // Εμφάνιση κουμπιού μόνο αν δεν φορτώνουν τα follow data ΚΑΙ οι υπόλοιπες συνθήκες ισχύουν
                                <div className="profile-follow-button-container">
                                    <button className={`profile-follow-button ${isFollowing ? 'following' : ''}`} onClick={handleFollowToggle}>
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                </div>
                            )
                        }
                    </div>
                    <div className="profile-recipes-section">
                        <h2>Συνταγές Χρήστη</h2>
                        {recipes.length > 0 ? (
                            <ul className="profile-recipes-list">
                                {recipes.map((recipe) => <li key={recipe.id}>{recipe.title || 'Recipe without title'}</li>)}
                            </ul>
                        ) : (
                            <p>Αυτός ο χρήστης δεν έχει δημοσιεύσει συνταγές.</p>
                        )}
                    </div>
                </div>
                <ChatsBar />
            </div>
            <FilterSearchOverlay 
                visible={filterVisible} 
                onClose={() => setFilterVisible(false)} 
                onApply={handleApplyFilters} 
            />
        </div>
    )
}