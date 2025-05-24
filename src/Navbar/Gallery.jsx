import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import GalleryIcon from './assets/cooking.png'

function Gallery() {

    const nav = useHistory();

    const handleClickEvent = () => {
        nav.push(`/gallery`)
    }

    return(<>
            <img src={GalleryIcon} alt="Gallery" className="navbar-gallery" onClick={handleClickEvent} />
            </>);
}

export default Gallery