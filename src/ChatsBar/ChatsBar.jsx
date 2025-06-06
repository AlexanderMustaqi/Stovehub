import { useState, useEffect, useContext, createContext } from 'react';
import { UserContext } from '../App.jsx';
import api from '../api/api'
import LittleKittyIcon from './assets/LittleKitty.png'
import ChatWin from './ChatWin.jsx'
import ChatAdd from './ChatAdd.jsx'

export const IdContext = createContext(null);

function ChatsBar() {
    const { currentUser } = useContext(UserContext); // currentUser is { id, email, ... } or null
    const [chats, setChats] = useState([]);
    const [selected, setSelected ] = useState([0,'']);
    const [trigger, setTrigger] = useState(0);
    

    //Fetch current user's chats when userType or trigger changes
    useEffect(() => {
        const fetchUserChats = async (email) => {
            try {
                const response = await api.get(`/chats/${email}`);
                setChats(response.data);
            } catch (err) {
                console.error("[ChatsBar] Error fetching chats for email:", email, err.response ? err.response.data : err.message, err.config ? err.config.url : '');
            }
        }
        if (currentUser && currentUser.email) {
            fetchUserChats(currentUser.email);
        } else {
            setChats([]); // Clear chats if no user or no email
        }
    }, [currentUser, trigger]); 

    useEffect(() => {
        const chatbarElement = document.getElementById('chatbar_ul');
        const handleMouseOver = (e) => {
            if (!chatbarElement) return;
            const y = e.clientY - chatbarElement.getBoundingClientRect().top;
            if (y < 50) {
                chatbarElement.scrollBy({
                    top: -50,
                    behavior: "smooth"
                })
            }
            else if (y > (chatbarElement.clientHeight - 50) && chatbarElement.clientHeight > 50) { 
                chatbarElement.scrollBy({
                    top: 50,
                    behavior: 'smooth'
                })
            }
        };

        if (currentUser && chatbarElement) { 
            chatbarElement.addEventListener('mouseover', handleMouseOver);
        }

        return () => { 
            if (chatbarElement) {
                chatbarElement.removeEventListener('mouseover', handleMouseOver);
            }
        };
    }, [currentUser]); // Depends on currentUser

    function handleChatClickEvent(index) {
        const chat_id = chats[index]['chat_id'];
        const chat_name = chats[index]['chat_name'];
        setSelected([chat_id, chat_name]);
    }

    return(
        currentUser ? // If user is logged in
        (
            <IdContext.Provider value={currentUser.id}> 
                <ChatWin selected={selected} setSelected={setSelected} />
                <div id='chatbar_id' className='chatbar'>
                    <ChatAdd setTrigger={setTrigger} trigger={trigger}/>
                    <ul className='chatbar-ul' id="chatbar_ul">
                        {chats.map((chat, index) => (
                            <input key={chat.chat_id || index} type="radio" name='chat'
                                className={'chatbar-radio'} style={{backgroundImage: `url('${LittleKittyIcon}')`}}
                                onClick={() => handleChatClickEvent(index)}/>
                        ))}
                    </ul>
                </div>
            </IdContext.Provider>
        )
        :
        (null) 
    );
}
export default ChatsBar;