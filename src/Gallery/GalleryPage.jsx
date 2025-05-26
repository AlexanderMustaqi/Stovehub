import Navbar from "../Navbar/Navbar"
import ChatsBar from "../ChatsBar/ChatsBar"

export default function GalleryPage() {

    const pcss = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }

    return(
        <div className='app'>
            <Navbar></Navbar>
            <div style={pcss}> 
                <div>
                    
                </div>
                <ChatsBar />
            </div>
        </div>
    )
}