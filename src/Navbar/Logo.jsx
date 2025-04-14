import LogoIcon from './assets/top-left-logo.png'

function Logo() {

    return (<>
                <img className="navbar-logo" src={LogoIcon} alt="Stovehub" />
                <hr />
            </>);
}

export default Logo;