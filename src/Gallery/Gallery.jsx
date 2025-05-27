import "./assets/ssh.css"

export default function Gallery({cbox:cbox, gallery:gallery}) {

    // console.log(gallery);
    // console.log(cbox);

    //Stylesheet

    const ssh1 = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: "center"
    }

    return(
        <>
            {!cbox ? 
                (<div style={ssh1}>
                    {gallery.gallery_name}
                    <input type="radio" className="gal_radio" />
                </div>)
            : 
                (<div style={ssh1}>
                    {gallery.gallery_name}
                    <input type="checkbox" className="gal_checkbox" />
                </div>)}
        </>
    )
}