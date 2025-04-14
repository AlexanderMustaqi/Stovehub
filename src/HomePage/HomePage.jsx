import React, {useState} from 'react'

function HomePage() {

    const [posts, setPost] = useState(["","","",""]);

    return(<>
            <ul className='homepage'>
                {posts.map((post, index) => <li key={index}>{post}</li>)}
            </ul>
            </>);
}

export default HomePage