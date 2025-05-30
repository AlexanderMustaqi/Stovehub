import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // Προσθήκη useNavigate
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import ChatsBar from "../ChatsBar/ChatsBar"
import Navbar from "../Navbar/Navbar"
import api from "../api/api"
import './ProfilePage.css'; // Εισαγωγή του CSS αρχείου
import 'react-image-crop/dist/ReactCrop.css'; // CSS για το react-image-crop
import { FilterSearchOverlay } from '../Navbar/FilterSearchOverlay.jsx'; // Προσθήκη FilterSearchOverlay

function ProfilePage() {
    
    const profileImageRef = useRef(null); // Ref για την εικόνα προφίλ
    const fileInputRef = useRef(null);    // Ref για το file input element
    const usernameRef = useRef(null);
    const [cusername, setUsername] = useState('Username');
    const bioRef = useRef(null);
    const [cbio, setBio] = useState('Bio')
    const rankRef = useRef(null);
    const newInfo = useRef(null);
    const [changeName, setChangeName] = useState(false);
    const [changeBio, setChangeBio] = useState(false);

    // State για το image cropper
    const [upImg, setUpImg] = useState(null); // Το επιλεγμένο αρχείο εικόνας (data URL)
    const imgRef = useRef(null); // Ref για την εικόνα μέσα στο cropper
    const previewCanvasRef = useRef(null); // Ref για το canvas προεπισκόπησης
    const [crop, setCrop] = useState(); // Οι διαστάσεις του crop
    const [completedCrop, setCompletedCrop] = useState(null); // Το τελικό crop (pixelCrop)
    const [showCropperModal, setShowCropperModal] = useState(false);
    const aspect = 1 / 1; // Για τετράγωνο crop (1:1 aspect ratio)

    const [filterVisible, setFilterVisible] = useState(false); // State για το FilterSearchOverlay
    const navigate = useNavigate(); // Hook για πλοήγηση

    const defaultPfpSrc = `http://localhost:5000/uploads/pfp/default-pfp.svg`;

    useEffect(() => {
        const fetchProfileData = async (email) => {
            if (!email) {
                console.error("ProfilePage: No email provided to fetchProfileData.");
                return;
            }
            console.log("ProfilePage: Attempting to fetch profile data for email:", email);
            try {
                const ServerResponse = await api.get(`/my_profile_info/${email}`);
                console.log("ProfilePage - Raw serverResponse.data for own profile:", ServerResponse.data);

                if (ServerResponse.data) { // Το ServerResponse.data είναι απευθείας το αντικείμενο του χρήστη ή null
                    const userData = ServerResponse.data;
                    const { username, bio, rank, profile_image_url } = userData;

                    setUsername(username || 'Username');
                    setBio(bio || 'No Bio');
                    if (rankRef.current) rankRef.current.textContent = rank || 'Unranked';

                    if (profileImageRef.current) {
                        if (profile_image_url && typeof profile_image_url === 'string' && profile_image_url.trim() !== '') {
                            profileImageRef.current.src = `http://localhost:5000${profile_image_url}`;
                            console.log("ProfilePage: Setting own profile image to:", profileImageRef.current.src);
                        } else { // Εδώ χρησιμοποιούμε τη μεταβλητή defaultPfpSrc
                            profileImageRef.current.src = defaultPfpSrc;
                            console.log("ProfilePage: Own profile_image_url is falsy or not a valid string, setting to default. Value was:", profile_image_url);
                        }
                    }
                } else {
                    console.warn("ProfilePage: No data returned for email:", email);
                    if (profileImageRef.current) profileImageRef.current.src = defaultPfpSrc;
                }
            }
            catch(err) {
                console.error("ProfilePage: Error fetching own profile data:", err);
                if (profileImageRef.current) profileImageRef.current.src = defaultPfpSrc;
            }
        }
        fetchProfileData(sessionStorage.getItem("email"));
    }, [])

    const handleChangeProfileName = () => {
        setChangeName(!changeName);
    }

    const handleChangeProfileBio = () => {
        setChangeBio(!changeBio)
    }

    const postNameChange = async (e) => {
        e.preventDefault();
        
        const message = {
            name: newInfo.current.value,
            email: sessionStorage.getItem('email')
        }

        try {
            const ServerResponse = await api.post(`/newName`, message);
            setUsername(newInfo.current.value);
            handleChangeProfileName();
        }
        catch(err) {
            throw err;
        }
    }

    const postBioChange = async (e) => {
        e.preventDefault();
        
        const message = {
            bio: newInfo.current.value,
            email: sessionStorage.getItem('email')
        }

        try {
            const ServerResponse = await api.post(`/newBio`, message);
            setBio(newInfo.current.value);
            handleChangeProfileBio();
        }
        catch(err) {
            throw err;
        }
    }

    const handleImageClick = () => {
        // Προσομοίωση κλικ στο κρυφό file input
        fileInputRef.current.click();
    };

    // Όταν ο χρήστης επιλέγει ένα αρχείο
    const onSelectFile = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            setCrop(undefined); // Σημαντικό για να επιτρέπεται το reset του crop state
            const reader = new FileReader();
            reader.addEventListener('load', () => setUpImg(reader.result?.toString() || ''));
            reader.readAsDataURL(event.target.files[0]);
            setShowCropperModal(true);
            event.target.value = ""; // Για να επιτρέπει την επιλογή του ίδιου αρχείου ξανά
        }
    };

    // Όταν η εικόνα φορτώνει στο cropper
    function onImageLoad(e) {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
            // Αρχικοποίηση και του completedCrop για να σχεδιαστεί η προεπισκόπηση αμέσως
            const initialPixelCrop = centerAspectCrop(width, height, aspect);
             // Μετατροπή του ποσοστιαίου crop σε pixel crop για την αρχική προεπισκόπηση
            const initialCompletedPixelCrop = {
                unit: 'px',
                x: (initialPixelCrop.x / 100) * width,
                y: (initialPixelCrop.y / 100) * height,
                width: (initialPixelCrop.width / 100) * width,
                height: (initialPixelCrop.height / 100) * height,
            };
            setCompletedCrop(initialCompletedPixelCrop);
        }
    }
    
    // Utility function from react-image-crop examples
    function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
        return centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90, // Initial crop width percentage
                },
                aspect,
                mediaWidth,
                mediaHeight
            ),
            mediaWidth,
            mediaHeight
        );
    }

    // Σχεδίαση της προεπισκόπησης του crop στο canvas
    useEffect(() => {
        if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
            return;
        }

        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        const crop = completedCrop;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');

        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
        );
    }, [completedCrop]);

    const handleConfirmCrop = async () => {
        if (!previewCanvasRef.current) {
            console.error('Canvas ref is not set.');
            return;
        }
        previewCanvasRef.current.toBlob(async (blob) => {
            if (blob) {
                await uploadProfilePicture(blob);
            } else {
                console.error('Failed to create blob from canvas.');
            }
        }, 'image/png', 1); // Μπορείς να αλλάξεις το format (π.χ. 'image/jpeg') και την ποιότητα
        setShowCropperModal(false);
        setUpImg(null); // Καθαρισμός για την επόμενη επιλογή
    };

    const handleCancelCrop = () => {
        setShowCropperModal(false);
        setUpImg(null);
    };

    // Η uploadProfilePicture δέχεται πλέον Blob ή File
    const uploadProfilePicture = async (imageFile) => {
        
        const formData = new FormData();
        
        const fileName = imageFile instanceof File ? imageFile.name : 'cropped-profile.png';
        formData.append('profileImage', imageFile, fileName);
        formData.append('email', sessionStorage.getItem('email')); // Στέλνουμε το email του χρήστη

        try {
            const response = await api.post('/profile/pfp', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Σημαντικό για αποστολή αρχείων
                },
            });

            if (response.data && response.data.imageUrl) {
                if (profileImageRef.current) {
                    profileImageRef.current.src = response.data.imageUrl; // Άμεση ενημέρωση της εικόνας στο UI
                }
                console.log('Profile picture updated successfully:', response.data.message);
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error.response ? error.response.data : error.message);
            alert('Σφάλμα κατά το ανέβασμα της εικόνας προφίλ. Παρακαλώ δοκιμάστε ξανά.');
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
          console.error("[ProfilePage.jsx] Error during navigation:", e);
        }
        setFilterVisible(false);
      };


    return (
        <div className='app'>
            {showCropperModal && (
                <div className="profile-overlay cropper-overlay">
                    <div className="profile-change-form cropper-modal-panel">
                        <h3>Επεξεργασία Εικόνας</h3>
                        {upImg && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspect}
                                minWidth={100} // Ελάχιστο πλάτος crop σε pixels
                                minHeight={100} // Ελάχιστο ύψος crop σε pixels
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop me"
                                    src={upImg}
                                    onLoad={onImageLoad}
                                    style={{ maxHeight: '70vh', maxWidth: '100%' }}
                                />
                            </ReactCrop>
                        )}
                        {/* Κρυφό canvas για την προεπισκόπηση και τη δημιουργία του Blob */}
                        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
                        <div className="profile-form-actions cropper-actions">
                            <button type="button" onClick={handleConfirmCrop} className="btn-primary">Επιβεβαίωση</button>
                            <button type="button" onClick={handleCancelCrop} className="btn-secondary">Ακύρωση</button>
                        </div>
                    </div>
                </div>
            )}
            {changeName && 
            <div className="profile-overlay">
                <form className="profile-change-form" onSubmit={postNameChange}>
                    <input ref={newInfo} type="text" placeholder="Please enter a new Name" required />
                    <div className="profile-form-actions">
                        <button type="submit" onClick={postNameChange}>Confirm</button>
                        <button type="button" onClick={handleChangeProfileName}>Cancel</button>
                    </div>
                </form>
            </div>}
            {changeBio && 
            <div className="profile-overlay">
                <form className="profile-change-form" onSubmit={postBioChange}>
                    <input ref={newInfo} type="text" placeholder="Please enter a new Bio" required />
                    <div className="profile-form-actions">
                        <button type="submit" onClick={postBioChange}>Confirm</button>
                        <button type="button" onClick={handleChangeProfileBio}>Cancel</button>
                    </div>
                </form>
            </div>}
            <Navbar onSearchClick={handleSearchClick} /> {/* Πέρασμα του onSearchClick */}
            <div className="profile-page-container"> 
                <div className="profile-content">
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={onSelectFile} 
                        style={{ display: 'none' }} 
                        accept="image/*" // Επιτρέπει μόνο αρχεία εικόνας
                    />
                    <div className="profile-upper-section">
                        <div className="profile-image-container" onClick={handleImageClick} style={{ cursor: 'pointer' }} title="Αλλαγή εικόνας προφίλ">
                            <img 
                                ref={profileImageRef}
                                className="profile-image"
                                src={defaultPfpSrc} // Αρχική default εικόνα
                                alt="Profile" 
                                onError={() => {
                                    console.error("ProfilePage: onError triggered for own profile image. URL was:", profileImageRef.current?.src);
                                    if (profileImageRef.current) profileImageRef.current.src = defaultPfpSrc;
                                }}
                            />
                        </div>
                        <div className="profile-user-info">
                            <h5 ref={usernameRef} onClick={handleChangeProfileName}>{cusername}</h5>
                            <h5 ref={bioRef} onClick={handleChangeProfileBio}>{cbio}</h5>
                            <h5 ref={rankRef}>Rank</h5>
                        </div>
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

export default ProfilePage