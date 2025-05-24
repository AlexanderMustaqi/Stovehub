import { Server } from "ws";

export default function UserProfilePage({user: user}) {
    const usernameRef = useRef(null);
    const bioRef = useRef(null);
    const rankRef = useRef(null);
    const [recipies, setRecipies] = useState([',',',',',',',']);

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
        const info = {
            main_user : sessionStorage.getItem('email'),
            sec_user : user
        }
        try {
            const ServerResponse = await api.post(`/postFollower/`, info)
            if (ServerResponse.data == `success`) console.log('Succefully Posted');
        }
        catch (err) {
            throw err
        }
    }

    useEffect(() => {
        const fetchProfileData = async (email) => {
            try {
                const ServerResponse = await api.get(`/profile_info/${email}`);
                const { username, bio, rank } = ServerResponse.data[0];
                usernameRef.current.textContent = username;
                bioRef.current.textContent = bio;
                rankRef.current.textContent = rank; 
            }
            catch(err) {
                throw err;
            }
        }
        fetchProfileData(sessionStorage.getItem("email"));
    }, [])

    useEffect(() => {
        const fetchProfileRecipies = async(email) => {
            try {
                const ServerResponse = api.get(`/profile_recipies/${email}`);
                // setRecipies(JSON.parse(ServerResponse.data));
            }
            catch(err) {
                throw err;
            }
        }
        fetchProfileRecipies(sessionStorage.getItem('email'));
    }, [])

    return(
        <div className='app'>
            <Navbar></Navbar>
            <div style={pcss}> 
                <div style={ulss}>
                    <div style={Upper}>
                        <img src={ProfilePic} alt="" style={{width: '30vh'}} />
                        <div style={UserInfo}>
                            <h5 ref={usernameRef}>Username</h5>
                            <h5 ref={bioRef}>Bio</h5>
                            <h5 ref={rankRef}>Rank</h5>
                        </div>
                        <div style={FollowOption}>
                            <button style={FollowButton} onClick={handleClickEvent}></button>
                        </div>
                    </div>
                    <ul style={Lower}>
                        {recipies.map((e, i) => <li key={i}></li>)}
                    </ul>
                </div>
                <ChatsBar />
            </div>
        </div>
    )
}