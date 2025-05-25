import { useWebSocket } from './ChatWin';
import { IdContext } from './ChatsBar'
import React, { useContext, useRef } from 'react';

function ChatInput({chat_id : chat_id, setTrigger: setTrigger}) {

    const socket = useWebSocket();
    const inputRef = useRef(null);
    const user = useContext(IdContext);

    function handleSendEvent(e) {
        e.preventDefault();

        const ClientRequest = {
            type: 'new',
            message: {
                message: inputRef.current.value,
                user_id: user,
                }
        }
        socket.send(JSON.stringify(ClientRequest))
        inputRef.current.value = '';
    }

    return <>
            <form onSubmit={handleSendEvent} className="chat-lowbar">
                <input ref={inputRef} type="text" className="chat-input" id="message_input"/>
                <button type={'submit'} onClick={handleSendEvent}>Send</button>
            </form>
    </>
}

export default ChatInput