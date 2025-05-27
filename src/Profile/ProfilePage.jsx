import { useEffect, useRef, useState } from "react"
import ChatsBar from "../ChatsBar/ChatsBar"
import Navbar from "../Navbar/Navbar"
import ProfilePic from './assets/person-circle-outline.svg'
import api from "../api/api"

function ProfilePage() {

    const usernameRef = useRef(null);
    const [cusername, setUsername] = useState('Username');
    const bioRef = useRef(null);
    const [cbio, setBio] = useState('Bio')
    const rankRef = useRef(null);
    const newInfo = useRef(null);
    const [changeName, setChangeName] = useState(false);
    const [changeBio, setChangeBio] = useState(false);

    //StyleSheets

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
        borderRadius: '8px',
        background: '#f7d2a7',
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

    const Lower = {
        border: '2px solid black',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'left'
    }

    const formStyleSheet = {
        padding: '20px',
        background: '#f7d2a7',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center'
    }

    const ccstylesheet = {
        marginTop : '20px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    }

    useEffect(() => {
        const fetchProfileData = async (email) => {
            try {
                const ServerResponse = await api.get(`/profile_info/${email}`);
                const { username, bio, rank } = ServerResponse.data[0];
                setUsername(username);
                setBio(bio);
                rankRef.current.textContent = rank; 
            }
            catch(err) {
                throw err;
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

    return(
        <div className='app'>
            {changeName && 
            <div className="overlay">
                <form type='submit' style={formStyleSheet}>
                    <input ref={newInfo} type="text" placeholder="Please enter a new Name" required />
                    <div style={ccstylesheet}>
                        <button type="submit" onClick={postNameChange}>Confirm</button>
                        <button type="button" onClick={handleChangeProfileName}>Cancel</button>
                    </div>
                </form>
            </div>}
            {changeBio && 
            <div className="overlay">
                <form type='submit' style={formStyleSheet}>
                    <input ref={newInfo} type="text" placeholder="Please enter a new Bio" required />
                    <div style={ccstylesheet}>
                        <button type="submit" onClick={postBioChange}>Confirm</button>
                        <button type="button" onClick={handleChangeProfileBio}>Cancel</button>
                    </div>
                </form>
            </div>}
            <Navbar></Navbar>
            <div style={pcss}> 
                <div style={ulss}>
                    <div style={Upper}>
                        <img src={ProfilePic} alt="" style={{width: '30vh'}} />
                        <div style={UserInfo}>
                            <h5 ref={usernameRef} onClick={handleChangeProfileName}>{cusername}</h5>
                            <h5 ref={bioRef} onClick={handleChangeProfileBio}>{cbio}</h5>
                            <h5 ref={rankRef}>Rank</h5>
                        </div>
                    </div>
                </div>
                <ChatsBar />
            </div>
        </div>
    )
}

export default ProfilePage