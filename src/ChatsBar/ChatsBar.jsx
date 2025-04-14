import React, { useState } from 'react'
import ChatIcon from './assets/person-circle-outline.svg'

function ChatsBar() {

    const [chats, setChats] = useState(["","","","","","","","","","","","","","",""]);

    

    return(<>
            
                <ul className='chatbar'>
                    {chats.map((chat, index) => <img src={ChatIcon} alt="Chat" className='chatbar-chatimg'/>)}
                </ul>
            
            </>);
}

export default ChatsBar