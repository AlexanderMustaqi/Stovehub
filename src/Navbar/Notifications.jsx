import NotificationIcon from './assets/notifications-outline.svg'
import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';

function Notifications() {

    const [popUpFlag, setpopUpFlag] = useState(false);
    const [adminFlag, setAdminFlag] = useState(false)
    const nav = useNavigate();
    
    const [list1, setList1] = useState(['Alex',"Panos","Nikos","Thanos"])
    const [list2, setList2] = useState(['Elina',"Eirini","Maria","Sofi"])
    const [flag, setFlag] = useState(false);
    
    const stylesheet1 = 
    {
        padding: "20px",
        background: "white",
        borderRadius: "10%",
        display: 'flex',
        flexDirection: 'column',
        justifyContent:'center',
        alignItems:'center'
    }

    const stylesheet2 = 
    {
        position: "fixed",
        maxheight: '500px',
        maxwidth: '300px',
        right: '90px',
        top: '10%',
        background: 'white',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        border: "1px solid black",
        borderRadius: '10%'
    }
        
    const stylesheet3 =
    {
        border: "1px solid black",
        borderRadius: "10%",
        padding: "15px",
        marginBottom: '5px',
        width: "100%",
        background: 'black',
        textAlign: 'center',
        cursor: 'pointer',
        textDecoration: 'none',
        text: 'blue'
    }
    

     const popUp = () => {
        setpopUpFlag(!popUpFlag)
    }

    function NotificationsNew() {
        setFlag(true);
    }

    function NotificationsAll() {
        setFlag(false);
    }

    return(<>
            <img src={NotificationIcon} alt="Notifications" className='navbar-notifications' onClick={popUp}/>
            {popUpFlag && (
               <div style={stylesheet2}>
                {(!adminFlag) ?
                    (<div> 
                        <button onClick={NotificationsNew}>New</button>
                        <button onClick={NotificationsAll}>All</button>
                        <hr />
                        
                    </div>)
                :
                    (<div>

                    </div>)
                }       
            </div>)}
            <hr />
            </>
            )
}


export default Notifications