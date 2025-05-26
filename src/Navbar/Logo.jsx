import LogoIcon from './assets/top-left-logo.png'
import { useNavigate } from 'react-router-dom';
function Logo() {

    const nav = useNavigate();
    
    const handleClickEvent = () => {
        nav('/home');
    }

    return (<>
                <img className="navbar-logo" src={LogoIcon} alt="Stovehub" onClick={handleClickEvent} />
                <hr />
            </>);
}

export default Logo;