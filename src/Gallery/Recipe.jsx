import { useNavigate } from "react-router-dom"
import "./assets/ssh.css"

export default function Recipe({recipe:recipe, cbox:cbox}) {

    const nav = useNavigate();

    const handleClickEvent = () => {
        nav(`/home/recipes/${recipe.id}`)
    }

    const ssh1 = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: "center"
    }

    return(<>
        {!cbox ?
            (<div style={ssh1}>
                {recipe.title}
                <button className="gal_radio" onClick={handleClickEvent}></button>
            </div>)
            :
            (<div style={ssh1}>
                {recipe.title}
                <input type="checkbox" id={recipe.id} className="gal_checkbox" />
            </div>)
        }
    </>)
}