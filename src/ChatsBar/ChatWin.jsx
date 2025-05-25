import { createContext, useContext, useEffect, useRef, useState } from 'react'
import ChatVote from './ChatVote';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

const WebSocketCon = createContext(null);
export const useWebSocket = () => {
    return useContext(WebSocketCon);
}

function ChatWin({selected : selected, setSelected: setSelected}) {


    //selected[0] = chat_id, selected[1] = chat_name
    const [style, setStyle] = useState('none');
    const [messages, setMessages] = useState([]);
    const [trigger, setTrigger] = useState(0);
    const [socket, setSocket] = useState(null);
    const chatRef = useRef(null);
    const ws = useRef(null);
    
    //useEffect to connect to the chat's websocket. Renders when selected is changed
    useEffect(() => {

        if (selected[0] == 0) {
            setStyle('none');
        }
        else {
            // Connecting to the WebSocket
            setStyle('');
            ws.current = new WebSocket('ws://localhost:5000');
            setSocket(ws.current)

            //EventListeners
            ws.current.onopen = () => {
                console.log(`Connected to Chat Room ${selected[1]}!`);
                const ClientRequest = {
                    type: 'id',
                    message: selected[0]
                };
                ws.current.send(JSON.stringify(ClientRequest));
            }

            ws.current.onmessage = (e) => {
                const ServerResponse = JSON.parse(e.data)
                if (ServerResponse.type == 'old') {
                    // console.log(ServerResponse);
                    setMessages(ServerResponse.message); 
                }
                else {
                    // console.log(ServerResponse);
                    setMessages(s => [...s, ServerResponse.message])
                }
            }

            ws.current.onclose = () => {
                console.log(`Connection with Server Lost`);
            }
        }
    }, [selected, trigger]);

    //disconnect function
    const disconnect = () => {
        if (ws.current != null && ws.current.readyState == WebSocket.OPEN) {
            ws.current.close();
            ws.current = null;
        }
    }

    //Auto scroll to the bottom
    useEffect(() => {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages])

    //Event handler for Clicking X
    function handleXClickEvent() {
        setSelected([0,'']);
        document.querySelector(['input[name="chat"]:checked']).checked = false;
    }
    //disconnecting from the websocket
    useEffect(() => {disconnect()}, [selected])

    return(<>
        <WebSocketCon.Provider value={socket}>
        <div className="chat" style={{display: style}}>
            <div className="chat-hotbar">
                <div style={{fontFamily: "Arial", fontSize: '25px'}}>
                    {selected[1]}
                </div>
                <div>
                    <ChatVote />
                    <button onClick={handleXClickEvent}>X</button>
                </div>
            </div>
            <div ref={chatRef} className="chat-chat">
                <ul style={{listStyleType: 'none', paddingLeft: '5px', paddingRight: '5px'}}>
                    {messages.map((element, index) => {
                        if (index > 0) {
                            if (messages[index-1].user_id == element.user_id) return <ChatMessage key={index} message={element.message} username={''} user_id={element.user_id}/>
                            else return <ChatMessage key={index} message={element.message} username={element.username} user_id={element.user_id}/>
                        }
                        else return <ChatMessage key={index} message={element.message} username={element.username} user_id={element.user_id}/>}
                    )}
                </ul>
            </div>
                <ChatInput chat_id={selected[0]} setTrigger={setTrigger} />
        </div>
        </WebSocketCon.Provider>
    </>)
}

export default ChatWin