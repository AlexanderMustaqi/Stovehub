import "./assets/ssh.css"
import { recipeContext, selectedContext } from "./GalleryPage"
import api from "../api/api";
import { useContext } from "react";

export default function Gallery({cbox:cbox, gallery:gallery}) {

    const setRecipes = useContext(recipeContext);
    const setSelected = useContext(selectedContext)

    const ssh1 = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: "center"
    }

    const handleClickEvent = () => {
        const fetchData = async () => {
            try {
                const ServerResponse = await api.get(`/gal_recipes/${gallery.gallery_id}`)
                setRecipes(JSON.parse(ServerResponse.data))
            }
            catch(err) {
                throw err;
            }
        }
        fetchData();
        setSelected(gallery.gallery_id);
    }

    return(
        <>
            {!cbox ? 
                (<div style={ssh1}>
                    {gallery.gallery_name}
                    <input type="radio" name='galleries' className="gal_radio" onClick={handleClickEvent} />
                </div>)
            : 
                (<div style={ssh1}>
                    {gallery.gallery_name}
                    <input type="checkbox" id={gallery.gallery_id} className="gal_checkbox" />
                </div>)}
        </>
    )
}