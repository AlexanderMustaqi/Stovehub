import { useNavigate } from 'react-router-dom';
import HomeIcon from './assets/home-outline.svg'

function Home() {
    const nav = useNavigate();

    const handleClickEvent = () => {
        nav('/home');
    }

    return (
        <>
            <img src={HomeIcon} alt="Home" className='navbar-home' onClick={handleClickEvent}/>
            <hr />
        </>
    );
}

export default Home;