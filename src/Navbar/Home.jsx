import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import HomeIcon from './assets/home-outline.svg'

function Home() {
    const nav = useHistory();

    const handleClickEvent = () => {
        nav.push('/home');
    }

    return (
        <>
            <img src={HomeIcon} alt="Home" className='navbar-home' onClick={handleClickEvent}/>
            <hr />
        </>
    );
}

export default Home;