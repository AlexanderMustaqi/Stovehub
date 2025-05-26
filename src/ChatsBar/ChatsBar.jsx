import { useState, useEffect, useContext, createContext } from 'react'
import { UserContext } from '../App.jsx' // Υποθέτοντας ότι το UserContext είναι τώρα εδώ
import api from '../api/api'
import LittleKittyIcon from './assets/LittleKitty.png'
import ChatWin from './ChatWin.jsx'
import ChatAdd from './ChatAdd.jsx'

export const IdContext = createContext();

function ChatsBar() {

    const [chats, setChats] = useState([]);
    const [selected, setSelected ] = useState([0,'']);
    const [trigger, setTrigger] = useState(0);
    const [user, setUser] = useState(0);
    const userType = useContext(UserContext);

    useEffect(() => {
        const emailFromStorage = sessionStorage.getItem('email');
        if (userType && emailFromStorage) { // Έλεγχος και για την ύπαρξη του email
            try {
                const fetchData = async () => {
                    // Διόρθωση: Αφαίρεση των μονών εισαγωγικών γύρω από το email
                    const ServerResponse = await api.get(`/user_id/${emailFromStorage}`) 
                    // Axios automatically parses JSON responses.
                    // ServerResponse.data should already be an object like { user_id: ... }
                    // or an array if the backend sent an array.
                    // Assuming the backend sends { user_id: ... } for a single user:
                    setUser(ServerResponse.data.user_id);
                }
                fetchData();
            }
            catch(err) {
                console.error("[ChatsBar] Error fetching user_id:", err.response ? err.response.data : err.message, err.config ? err.config.url : '');
            }
        } else if (userType && !emailFromStorage) {
            console.warn("[ChatsBar] UserType is set, but no email in sessionStorage for user_id fetch.");
        }
    }, [userType]); // Εξαρτάται από το userType

    //Fetch current user's chats when userType or trigger changes
    useEffect(() => {
        const fetchUserChats = async (email) => {
            try {
                const response = await api.get(`/chats/${email}`);
                setChats(response.data);
            }
            catch (err) {
                console.error("[ChatsBar] Error fetching chats for email:", email, err.response ? err.response.data : err.message, err.config ? err.config.url : '');
            }
        }
        const emailFromStorage = sessionStorage.getItem('email');
        if (userType && emailFromStorage) { // Έλεγχος και για την ύπαρξη του email
            fetchUserChats(emailFromStorage);
        } else if (userType && !emailFromStorage) {
            console.warn("[ChatsBar] UserType is set, but no email in sessionStorage for chats fetch.");
        }
    }, [userType, trigger]); // Εξαρτάται από userType και trigger

    //Scroll without scrollbar
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
            else if (y > (chatbarElement.clientHeight - 50) && chatbarElement.clientHeight > 50) { // Προσαρμογή για το κάτω όριο
                chatbarElement.scrollBy({
                    top: 50,
                    behavior: 'smooth'
                })
            }
        };

        if (userType && chatbarElement) {
            chatbarElement.addEventListener('mouseover', handleMouseOver);
        }

        return () => { // Cleanup function
            if (chatbarElement) {
                chatbarElement.removeEventListener('mouseover', handleMouseOver);
            }
        };
    }, [userType])

    //Handle Chat click event
    function handleChatClickEvent(index) {
        const chat_id = chats[index]['chat_id'];
        const chat_name = chats[index]['chat_name'];
        setSelected([chat_id, chat_name]);
    }

    return(
            userType ? 
            (<>
                <IdContext.Provider value={user}>
                        <ChatWin selected={selected} setSelected={setSelected} />
                        <div id='chatbar_id' className='chatbar'>
                            
                            <ChatAdd setTrigger={setTrigger} trigger={trigger}/>
                            <ul className='chatbar-ul' id="chatbar_ul">
                                {chats.map((chat, index) => <input key={chat.chat_id || index} type="radio" name='chat' // Χρήση chat.chat_id ως key
                                className={'chatbar-radio'} style={{backgroundImage: `url('${LittleKittyIcon}')`}}
                                onClick={() => handleChatClickEvent(index)}/>)}
                            </ul>
                        </div>
                </IdContext.Provider>
            </>)
            :
            (null) // Επιστροφή null αν δεν υπάρχει userType για να μην αποδοθεί τίποτα
        );
}

export default ChatsBar