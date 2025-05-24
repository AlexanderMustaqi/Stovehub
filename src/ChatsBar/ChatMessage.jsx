
function ChatMessage({message: message, username: username, user_id : user_id}) {

    const user = 1 ;


    if (user_id == user) return <li style={{direction: "rtl", textAlign: "right"}}><div style={{color: 'red'}}>{username}</div><hr style={{width: '50%', marginRight: '0'}} /><p>{message}</p></li>
    else return <li><div style={{color: 'red'}}>{username}</div><hr style={{width: '50%', marginLeft: '0'}} /><p>{message}</p></li>
}

export default ChatMessage