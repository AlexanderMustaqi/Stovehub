import { useEffect, useRef, useState } from "react";
import api from "../api/api";

function WebSocketComponent() {

    const [users, setUsers] = useState([1, 2, 3]);
    const [messages, setMessages] = useState([{}]);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const userRef = useRef(null);
    const socket = useRef(null);

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const response = await api.get('/hello');
                console.log(response.data);
            }
            catch (err) {
                throw err;
            }
        }
        fetchMessage();
    }, [])

    useEffect(() => {
    
        // Connecting to the WebSocket
        socket.current = new WebSocket('ws://localhost:3000');

        //EventListeners
        socket.current.onopen = () => {
            console.log(`Connected to Chat Room!`);
        }

        socket.current.onmessage = (e) => {
            let response = JSON.parse(e.data)
            console.log(response);
            setMessages(response);
        }

        socket.current.onclose = () => {
            console.log(`Connection with Server Lost`);
        }

    }, [])

    useEffect(() => {
        // Scroll to bottom when messages change
        containerRef.current.scrollTop = containerRef.current.scrollHeight;     
    }, [messages]);

    function handleSumbit(e) {
        e.preventDefault();
        socket.current.send(inputRef.current.value);
        inputRef.current.value = '';
    }

    return <>
    <div 
        style={{
            border: "1px solid black",
            width: '500px',
            height: '600px',
            display: "flex",
            flexDirection: "column",
        }}
    >
        <div 
            style={{
                height: '10%',
                borderBottom: '1px solid black'
            }}>
            <ul ref={userRef} style={{display: "flex", flexDirection: "row", justifyContent: "space-evenly"}}>
                {users.map((_, index) => <input key={index} type="radio" name='user' />)}
            </ul>
        </div>
        <ul ref={containerRef} style={{height: '80%', width: "inherit", overflow: 'auto'}}>
            {messages.map((element, index) => <li key={index} style={{marginTop: '20px', border: '1px solid black', width: '50%'}}>{element.username}<hr style={{width: '50%', marginLeft: '0'}}/>{element.message}</li>)}
        </ul>
        <form onSubmit={handleSumbit} 
            style={{
                height: '10%', 
                padding: '0',
                display: "flex",

            }}
        >
            <input ref={inputRef} type="text" style={{width: '80%', fontSize: '20px'}}/>
            <button type="submit" style={{width: '20%'}}>Enter</button>
        </form>
    </div>
    </>
}

export default WebSocketComponent