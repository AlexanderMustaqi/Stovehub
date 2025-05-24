import { useState } from "react"

function ChatVote() {

    const [win, setWin] = useState([]);

    function handleVoteEvent() {
        setWin([...win, 
            <div 
            style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                // border: '1px solid black',
                top: '0',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'antiquewhite'
            }}>
                <div 
                style={{
                    height: '10%',
                    width: 'inherit',
                    borderBottom: '1px solid black',
                    padding: '0',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    UPPER BAR
                    <button onClick={() => {setWin([])}}>X</button>
                </div>
                <div 
                style={{
                    height: '90%',
                    width: 'inherit',
                    // border: '1px solid black',
                }}>
                    LOWER BAR
                </div>
            </div>
        ])
    }

    return <>
        {win}
        <button onClick={handleVoteEvent}>Vote</button>
    </>
}

export default ChatVote