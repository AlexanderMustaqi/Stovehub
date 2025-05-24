import AddChatIcon from './assets/add-circle-outline.svg'
import api from '../api/api';
import { useState, useRef, useEffect, useContext } from 'react';
import { IdContext } from './ChatsBar';

function ChatAdd({setTrigger: setTrigger, trigger: trigger}) {

    const [modal, setModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [followers, setFollowers] = useState([]);
    const followersRef = useRef(null);
    const nameRef =  useRef(null);
    const cfollowersRef = useRef([]);
    const user = useContext(IdContext);

    const handleAddChatClickEvent = () => {
        setModal(!modal);
        setUsers([]);
        const fetchFollowers = async(user_id) => {
            try {
                // console.log(user_id);
                const ServerResponse = await api.get(`/followers/${user_id}`);
                setFollowers(ServerResponse.data);
                cfollowersRef.current = ServerResponse.data
            }
            catch (err) {
                throw err;
            }
        }
        fetchFollowers(user);
        setFollowers(cfollowersRef.current);
    }

    const handleAddUserClickEvent = (e) => {
        e.preventDefault();
        setFollowers(followers)
        const newUser = followersRef.current.value;
        setUsers(u => [...u, newUser]);
        setFollowers(followers.filter((e, _) => e.username !== newUser))
    }

    const handleConfirmEvent = async (e) => {
        e.preventDefault();
        const Name = nameRef.current.value;
        if (Name == '') {alert('Enter a name please!');return;}
        handleAddChatClickEvent();
        let SelectUsers = cfollowersRef.current.filter((e, i) => e.username == users[i]).map(obj => obj.user_id);
        setFollowers(cfollowersRef.current);
        setUsers([]);
        try {
            const ServerReponse = await api.post('/postChat', {chat_name: Name, chat_users: SelectUsers, user_email: sessionStorage.getItem('email')})
            setTrigger(trigger + 1);
        }
        catch(err) {
            throw err;
        }
    }
    
    const handleXClickEvent = (element) => {
        setFollowers(f => [...f, {username: element}]);
        setUsers(users.filter((e, i) => e !== element))
    }

    return(
        <>
            <img src={AddChatIcon} alt="Add Chat" style={{cursor: 'pointer', width: '60px'}} onClick={handleAddChatClickEvent}/>

            {modal && (
                <div className="overlay">
                    <div className="addchat-popup">
                        <input type="text" placeholder='Enter Chat Name' ref={nameRef}/>
                        <form onSubmit={handleAddUserClickEvent} style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                            <select ref={followersRef} name="followers" id="followers">
                                {followers.map((element, index) => <option key={index} value={element.username}>{element.username}</option>)}
                            </select>
                            <button type={'submit'} onClick={handleAddUserClickEvent}>Add</button>
                        </form>
                        <ul className='addchat-ul'>
                            {users.map((element, index) => <li key={index} className='addchat-li' >{index+1}.{element}<button onClick={() => handleXClickEvent(element)}>X</button></li>)}
                        </ul>
                        <form onSubmit={handleConfirmEvent}>
                            <button className='addchat-button' type={'button' }onClick={handleAddChatClickEvent}>Cancel</button>
                            <button className='addchat-button' type={'submit'} onClick={handleConfirmEvent}>Confirm</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default ChatAdd;