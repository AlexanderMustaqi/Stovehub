import React, {useState} from 'react'

function HomePage() {

    const [posts, setPost] = useState(["","","","","","","","","","","","","","","","","","","","","","","","","","","","",]);

    return(<>
            <h1>hello i am gay</h1>
            <ul className='homepage'>
                {posts.map((post, index) => <li key={index}>Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae dolorem placeat enim, laudantium facere repellat quas odio tempore distinctio voluptatibus sunt blanditiis beatae. Optio eaque deserunt inventore culpa itaque doloribus.</li>)}
            </ul>
            </>);
}

export default HomePage
