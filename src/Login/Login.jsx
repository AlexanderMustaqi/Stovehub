import { useState,useRef, useEffect, useContext } from "react"
import { useHistory, Link } from 'react-router-dom'
import { UserUpdateContext } from '../App.jsx'
import api from "../api/api";

const root = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
}

const lrwin = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '300px',
    border: '2px solid black',
    borderRadius: '10%',
    padding: '20px'
}

function Login() {

    const [login_flag,setLoginFlag] = useState(true);
    const [auth, setAuth] = useState('0');
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);
    const emailRef = useRef(null);
    const navigator = useHistory();
    const setuserType = useContext(UserUpdateContext)

    useEffect(() => {
        sessionStorage.setItem('email', ''); //Incase user enters as an 
        sessionStorage.setItem('ut', false);
        setuserType(false);
    }, [])

    const resetValues = () => {
        passwordRef.current.value = '';
        emailRef.current.value = '';
    }
    
    const changeWin = (e) => {
        e.preventDefault();
        resetValues();
        setLoginFlag(!login_flag);
    }

    const handleLogin = (e) => {
        e.preventDefault();
        const email = emailRef.current.value;
        const password = passwordRef.current.value;
        const clientRequest = 
        {
            email: email,
            password: password
        }
        //request server for auth
        const fetchData = async (clientRequest) => {
            clientRequest = JSON.stringify(clientRequest);
            const ServerResponse = await api.get(`/getAuth/${clientRequest}`);
            setAuth(ServerResponse.data);
        }
        fetchData(clientRequest);
    }

    useEffect(() => {
        if (auth == 'Found') {
            sessionStorage.setItem('email', emailRef.current.value)
            sessionStorage.setItem('ut', true);
            setuserType(true);
            navigator.push('/home');
        }
        else if(auth ==  'Not Found'){
            alert(`Incorrect Email/Password`);
        }
    }, [auth])

    const handleRegister = (e) => {
        e.preventDefault();
        const username = usernameRef.current.value;
        const email = emailRef.current.value;
        const password = passwordRef.current.value;
        const ClientRequest = 
        {
            username: username,
            email: email,
            password: password
        }
        //send data to server to POST new user as Registered
        const postData = async (ClientRequest) => {
            try {
                const ServerResponse = await api.post('/postRegisteredUser', ClientRequest);
                if (ServerResponse.data == "Created") 
                {
                    alert('Account Created');
                }
                else
                {
                    alert(`Account not created!`)
                };
            }
            catch (err) {
                alert(`Error ${err}`);
                throw err;
            }
        }
        postData(ClientRequest)
    }

    const handleGuestClickEvent = () => {
        setuserType(false);
        navigator.push('/home');
    }
    
    return login_flag ?
     (
            <div style={root}>    
                <form  type='submit' style={lrwin}>
                    <h1>Login</h1>
                    <input ref={emailRef} type="email" placeholder="Enter Email" required />
                    <input ref={passwordRef} type="password" placeholder="Enter Password" required />
                    <button type='submit' onClick={handleLogin}>Login</button>
                    <button type='button' onClick={changeWin}>Register</button>
                </form>
                    <button onClick={handleGuestClickEvent}>Enter as a Guest</button>
            </div>
    )
     : 
    (
            <div style={root}>
                <form type='submit' style={lrwin}>
                    <h1>Register</h1>
                    <input ref={usernameRef} type="text" placeholder="Enter Username" required />
                    <input ref={emailRef} type="email" placeholder="Enter Email" required />
                    <input ref={passwordRef} type="password" placeholder="Enter password" required />
                    <button type='submit' onClick={handleRegister} required>Register</button>
                    <button type='button' onClick={changeWin}>Already Registered</button>
                </form>
            </div>
    );
}

export default Login