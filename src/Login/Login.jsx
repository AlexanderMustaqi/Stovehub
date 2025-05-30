import { useState,useRef, useEffect, useContext } from "react"
import { useNavigate, Link } from 'react-router-dom' 
import { UserContext } from '../App.jsx' 
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
    const navigate = useNavigate(); 
    const { handleLogin: contextHandleLogin, currentUser } = useContext(UserContext); 

    useEffect(() => {
        if (currentUser) {
            navigate('/home');
        }
    }, [currentUser, navigate])

    const resetValues = () => {
        passwordRef.current.value = '';
        emailRef.current.value = '';
    }
    
    const changeWin = (e) => {
        e.preventDefault();
        resetValues();
        setLoginFlag(!login_flag);
    }

    const handleLoginSubmit = async (e) => { 
        e.preventDefault();
        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        try {
            const loginSuccess = await contextHandleLogin(email, password); // Κλήση της συνάρτησης από το App.jsx
            if (loginSuccess) {
            } else {
                alert('Login failed. Please check your email and password.');
                setAuth('Not Found'); // Ενημέρωση του auth state για εμφάνιση μηνύματος αν χρειάζεται
            }
        } catch (err) {
            console.error("Login component error during submit:", err);
            alert('An unexpected error occurred during login.');
            setAuth('Error'); 
        }
    }; 

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
        
        navigate('/home'); // Χρήση του navigate
    }
    
    return login_flag ?
     (
            <div style={root}>    
                <form  type='submit' style={lrwin}>
                    <h1>Login</h1>
                    <input ref={emailRef} type="email" placeholder="Enter Email" required />
                    <input ref={passwordRef} type="password" placeholder="Enter Password" required />
                    <button type='submit' onClick={handleLoginSubmit}>Login</button>
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