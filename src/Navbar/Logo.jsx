import LogoIcon from './assets/top-left-logo.png'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';

function Logo() {

    const nav = useHistory();
    
    const handleClickEvent = () => {
        nav.push('/home');
    }

    return (<>
                <img className="navbar-logo" src={LogoIcon} alt="Stovehub" onClick={handleClickEvent} />
                <hr />
            </>);
}

export default Logo;