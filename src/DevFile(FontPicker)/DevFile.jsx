import style from './DevFile.module.css'
import React, { useEffect, useState } from "react"

function DevFile() {

    const [font, setFont] = useState("'Arial','san-serif'");

    useEffect(() => {
        const checkedRadio = document.querySelector('input[name="chat"]:checked');
    })

    function handleClickEvent(e) {
        setFont(e.target.id);
    }

    return (
    <>
        <div className={style.chat}>
            <h1 className={style.txt} style={{fontFamily: font}}>Chat Options</h1>
            <h2>Arial</h2><input type="radio" name='chat' id="Arial" className={style.chatradio}  onClick={handleClickEvent} />
            <h2>Times New Roman</h2><input type="radio" name='chat' id="Times New Roman" className={style.chatradio} onClick={handleClickEvent} /> 
            <h2>Verdana</h2><input type="radio" name='chat' id="Verdana" className={style.chatradio} onClick={handleClickEvent} />
            <h2>Georgia</h2><input type="radio" name='chat' id="Georgia" className={style.chatradio} onClick={handleClickEvent} />
            <h2>Ciourier New</h2><input type="radio" name='chat' id="Ciourier New" className={style.chatradio} onClick={handleClickEvent} />
        </div>
    </>)
}

export default DevFile