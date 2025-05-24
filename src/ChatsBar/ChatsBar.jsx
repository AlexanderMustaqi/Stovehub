import { useState, useEffect, useContext, createContext } from 'react'
import { UserContext } from '../App.jsx'
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
        if (userType) {
            try {
                const fetchData = async () => {
                    const ServerResponse = await api.get(`/user_id/'${sessionStorage.getItem('email')}'`) 
                    setUser(JSON.parse(ServerResponse.data)[0].user_id);
                }
                fetchData();
            }
            catch(err) {
                throw err;
            }
        }
    }, [])

    //Fetch current user's chats
    useEffect(() => {
        const fetchData = async (email) => {
            try {
                const response = await api.get(`/chats/${email}`);
                setChats(response.data);
            }
            catch (err) {
                throw err
            }
        }
        if (userType) {
            fetchData(sessionStorage.getItem('email'));
        }
    }, [])

    useEffect(() => {
        const fetchData = async (email) => {
            try {
                const response = await api.get(`/chats/${email}`);
                setChats(response.data);
            }
            catch (err) {
                throw err
            }
        }
        if (userType) {
            fetchData(sessionStorage.getItem('email'));
        }
    }, [trigger])

    //Scroll without scrollbar
    const autoScroll = () => {
        const chatbar = document.getElementById('chatbar_ul');
        chatbar.addEventListener('mouseover', (e) => {
            const y = e.clientY - chatbar.getBoundingClientRect().top;
            if (y<50) {
                chatbar.scrollBy({
                    top: -50,
                    behavior: "smooth"
                })
            }
            else if (y>450) {
                    chatbar.scrollBy({
                    top: 50,
                    behavior: 'smooth'
                })
            }
        })
    }

    useEffect(() => {
        if (userType) autoScroll();
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
                                {chats.map((_, index) => <input key={index} type="radio" name='chat' 
                                className={'chatbar-radio'} style={{backgroundImage: `url('${LittleKittyIcon}')`}}
                                onClick={() => handleChatClickEvent(index)}/>)}
                            </ul>
                        </div>
                </IdContext.Provider>
            </>)
            :
            (<div></div>)
        );
}

export default ChatsBar