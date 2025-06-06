import Navbar from "../Navbar/Navbar"
import ChatsBar from "../ChatsBar/ChatsBar"
import { useEffect, useState, useRef, createContext, useContext } from "react"
import Gallery from "./Gallery.jsx"
import api from "../api/api.js"
import Recipe from "./Recipe.jsx"
import e from "cors"

export const recipeContext = createContext();
export const selectedContext = createContext();

export default function GalleryPage() {

    //Stylesheets

    const [backgroundStyleA, setBackgroundA] = useState('#f7d2a7')
    const [backgroundStyleB, setBackgroundB] = useState('#f7d2a7')

    const pcss = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }

    const stylesheet1 = {
        display: 'flex',
        flexDirection: 'column',
    }

    const formssh = {
        borderRadius: '8px',
        background: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    }

    const ccssh = {
        display: 'flex',
        flexDirection: 'row',
        marginTop: '20px',
    }

    const stylesheet2A = {
        borderRadius: '8px',
        background: backgroundStyleA,
        width: '180vh',
        height: '20vh',
        padding: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        overflow: 'auto',
        transition: '0.2s',
    }
    const stylesheet2B = {
        borderRadius: '8px',
        background: backgroundStyleB,
        width: '180vh',
        height: '20vh',
        padding: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        overflow: 'auto',
        transition: '0.2s',
    }

    const arbutton = {
        width: '200px',
        minHeight: '60px',
    }

    const [trigger, setTrigger] = useState(0);
    const [recipes, setRecipes] = useState([]);
    const [galleries, setGalleries] = useState([]);
    const [gal_cbox, setGalCbox] = useState(false);
    const [rec_cbox, setRecCbox] = useState(false);
    const [add_gal, setAddGal] = useState(false);
    const [add_rec, setAddRec] = useState(false);   
    const [selected, setSelected] = useState(0);
    const [user_recipes, setUserRecipes] = useState([])

    const galRef = useRef(null);
    const recRef = useRef(null);
    const addRef = useRef(null);

    const handleRemoveGalEvent = () => {
        setGalCbox(!gal_cbox);
        if (!gal_cbox) {setBackgroundA('#fc9003')}
        else {setBackgroundA('#f7d2a7')}
    }

    const handleRemoveGalConfirmEvent = async () => {
        const gals = galRef.current.querySelectorAll('input[type="checkbox"]');
        const checkedgals = Array.from(gals).filter(gals => gals.checked).map(gals => parseInt(gals.id, 10));
        try {
            const ServerResponse = await api.delete(`/galleries/${JSON.stringify(checkedgals)}`);
            if (ServerResponse.status==200) setTrigger(trigger+1);
        }
        catch(err) {
            throw err;
        }
        handleRemoveGalEvent();
    }

    const handleRemoveGalCancelEvent = () => {

        handleRemoveGalEvent();
    }

    const handleRemoveRecipe = () => {
        setRecCbox(!rec_cbox);
        if (!rec_cbox) {setBackgroundB('#fc9003')}
        else {setBackgroundB('#f7d2a7')}
    }

    const handleRemoveRecConfirmEvent = async () => {
        const recs = recRef.current.querySelectorAll('input[type="checkbox"]');
        const checkedrecs = Array.from(recs).filter(recs => recs.checked).map(recs => parseInt(recs.id, 10));
        const message = JSON.stringify({
            recs: checkedrecs,
            gal: selected
        })
        try {
            const ServerResponse = await api.delete(`/gal_recipes/${message}`);
            if (ServerResponse.status==200) setTrigger(trigger+1);
        }
        catch(err) {
            throw err;
        }
        handleRemoveRecipe();
    }

    const handleRemoveRecCancelEvent = () => {

        handleRemoveRecipe();
    }

    const handleAddGalEvent = () => {
        setAddGal(!add_gal);
    }

    const handleAddGalCancelEvent = () => {
        handleAddGalEvent();
    }

    const handleAddGalConfirmEvent = async (e) => {
        e.preventDefault();
        const newGal = addRef.current.value;
        if (newGal === '') {alert("Fill form correctly.");return}
        // console.log(newGal);
        handleAddGalEvent();
        const message = {
            newGal: newGal,
            email: sessionStorage.getItem('email'),
        }
        try {
            const ServerResponse = await api.post(`/add_gal`, message);
            if(ServerResponse.status==201) setTrigger(trigger+1);
        }
        catch(err) {
            throw err;
        }

    }

    const handleAddRecipe = () => {
        const fetchRecipes = async () => {
            try {
                const UserId = await api.get(`/user_id/${sessionStorage.getItem('email')}`)
                const ServerResponse = await api.get(`/profile_recipies/${(UserId.data).user_id}`)
                setUserRecipes(ServerResponse.data);
            }
            catch(err) {
                throw err;
            }
        }
        fetchRecipes();
        setAddRec(!add_rec)
    }

    const handleAddRecConfirmEvent = (e) => {
        e.preventDefault();
        const postRecipeToGal = async () => {
            const message = {
                gal: selected,
                rec: parseInt(addRef.current.value, 10)
            }
            try {
                const ServerResponse = await api.post(`/gal_rec`, message)
                const newRecipe = {
                    id: addRef.current.value,
                    title: addRef.current.textContent
                }
                if (ServerResponse.status==200) setRecipes(r => [...r, newRecipe]);
            }
            catch(err) {
                throw err;
            }
        }
        postRecipeToGal();
        setAddRec(!add_rec)
    }

    const handleAddRecCancelEvent = (e) => {
        e.preventDefault();
        setAddRec(!add_rec);
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const ServerResponse =  await api.get(`/galleries/${sessionStorage.getItem('email')}`);
                console.log(JSON.parse(ServerResponse.data))
                setGalleries(JSON.parse(ServerResponse.data));
            }
            catch(err) {
                throw err;
            }
        }
        fetchData();
    }, [trigger])


    return(
        <div className='app'>
            <Navbar></Navbar>
            <div style={pcss}>


                {add_gal && 
                <div className="overlay">
                    <form type='submit' style={formssh}>
                        <input ref={addRef} type="text" placeholder="Enter a name" required />
                        <div style={ccssh}>
                            <button type="submit" onClick={handleAddGalConfirmEvent}>Confirm</button>
                            <button type="button" onClick={handleAddGalCancelEvent}>Cancel</button>
                        </div>
                    </form>
                </div>}
                {add_rec && 
                <div className="overlay">
                    <form type="submit" style={formssh}>
                        <select ref={addRef} name='recipes' required>
                            {user_recipes.map((e, i) => <option key={i} value={e.id}>{e.title}</option>)}
                        </select>
                        <div style={ccssh}>
                            <button type="submit" onClick={handleAddRecConfirmEvent}>Confirm</button>
                            <button type="button" onClick={handleAddRecCancelEvent}>Cancel</button>
                        </div>
                    </form>
                </div>}


                <div style={stylesheet1}>
                    <div style={pcss}>
                        <h1>Galleries:</h1>
                        <div>    
                            {gal_cbox ? 
                            (<>
                                <button style={arbutton} onClick={handleRemoveGalConfirmEvent}>Confirm</button>
                                <button style={arbutton} onClick={handleRemoveGalCancelEvent}>Cancel</button>
                            </>)
                            :
                            (<>
                                <button style={arbutton} onClick={handleAddGalEvent}>Add Gallery</button>
                                <button style={arbutton} onClick={handleRemoveGalEvent}>Remove Gallery</button>
                            </>)}
                        </div>
                    </div>
                    <recipeContext.Provider value={setRecipes}>
                        <selectedContext.Provider value={setSelected}>
                            <div ref={galRef} style={stylesheet2A}>
                                {galleries.map((e, i) => <Gallery key={i} cbox={gal_cbox} gallery={e} />)}
                            </div>
                        </selectedContext.Provider>        
                    </recipeContext.Provider>
                    <hr />
                    <div style={pcss}>
                        <h1>Recipes:</h1>
                        <div>    
                            {rec_cbox
                            ?
                            (<>
                                <button style={arbutton} onClick={handleRemoveRecConfirmEvent}>Confirm</button>
                                <button style={arbutton} onClick={handleRemoveRecCancelEvent}>Cancel</button>
                            </>)
                            :
                            (<>
                                <button style={arbutton} onClick={handleAddRecipe}>Add Recipe</button>
                                <button style={arbutton} onClick={handleRemoveRecipe}>Remove Recipe</button>
                            </>)
                            }
                        </div>
                    </div>
                    <div ref={recRef} style={stylesheet2B}>
                        {recipes.map((e, i) => <Recipe key={i} cbox={rec_cbox} recipe={e} />)}
                    </div>
                </div>
                <ChatsBar />
            </div>
        </div>
    )
}