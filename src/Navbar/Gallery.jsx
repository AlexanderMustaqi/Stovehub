import { useNavigate } from 'react-router-dom';
import GalleryIcon from './assets/cooking.png'

function Gallery() {

    const nav = useNavigate();

    const handleClickEvent = () => {
        nav(`/gallery`)
    }

    return(<>
            <img src={GalleryIcon} alt="Gallery" className="navbar-gallery" onClick={handleClickEvent} />
            </>);
}

export default Gallery