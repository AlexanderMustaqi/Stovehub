import { useEffect, useRef, useState } from "react"
import { useWebSocket } from './ChatWin';

function ChatVote({selected: selected, ballotIndex:ballotIndex, setBallotIndex:setBallotIndex}) {

    const socket = useWebSocket();

    const [ballot, setBallot] = useState(false);
    const [voting, setVoting] = useState(false);
    const [swap, setSwap] = useState(true);
    const [candidates, setCandidates] = useState([]);

    const nameRef = useRef(null);
    const candidateRef = useRef(null);

    const formssh = {
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px",
        background:'#f7d2a7',
        padding: "20px",
        paddingTop: '10px'
    }

    const buttonSSH = {
        width: "50%"
    }

    const handleVoteEvent = () => {
        setCandidates([]);
        if (swap) {
            setBallot(!ballot);
        }
        else {
            setVoting(!voting);
        }
        
    }

    const handleCancelBallotEvent = (e) => {
        e.preventDefault();
        handleVoteEvent();
    }

    const handleAddCandidateEvent = () => {
        const newCandidate = candidateRef.current.value;
        setCandidates(c => [...c, newCandidate]);
        candidateRef.current.value = '';
    }

    const handleConfirmBallotEvent = (e) => {
        e.preventDefault();
        const message = {
            type: 'ballot',
            name: nameRef.current.value,
            candidates: candidates,
            chad_id: selected
        }
        socket.send(JSON.stringify(message));
        handleVoteEvent();
        setSwap(!swap);
    }

    const handleRemoveCandidateEvent = (index) => {
        setCandidates(candidates.filter((_ ,i) => i !==index))
    }

    const handleCandidateClicked = (i) => {
        const message = {
            type:'vote',
            index: ballotIndex,
            name: candidates[i] 
        }
        socket.send(JSON.stringify(message))
    }

    const handleFinishVotingEvent = () => {
        const message = {
            type: 'winner',
            index: ballotIndex
        }
        socket.send(JSON.stringify(message))
    }

    return <>
        <button onClick={handleVoteEvent}>Vote</button>
        {ballot && 
        (
        <div className="overlay">
            <form type="submit" style={formssh}>
                <h2>Create new Ballot</h2>
                <input ref={nameRef} type="text" placeholder="Enter Ballot Name" required />
                <div>
                    <input ref={candidateRef} type="text" placeholder="Enter a candidate" />
                    <button type="button" onClick={handleAddCandidateEvent}>Add</button>
                </div>
                <ul>
                    {candidates.map((e, i) => <li key={i} onClick={() => handleRemoveCandidateEvent(i)} id={e}> {e} </li>)}
                </ul>
                <div>
                    <button type="submit" style={buttonSSH} onClick={handleConfirmBallotEvent}>Confirm</button>
                    <button type="button" style={buttonSSH} onClick={handleCancelBallotEvent}>Cancel</button>
                </div>
            </form>
        </div>
        )}
        {voting && 
        (<div className="overlay">
            <div style={formssh}>
                <ul>
                    {candidates.map((e, i) => <li> {e} <button onClick={() => handleCandidateClicked(i)}>Vote</button></li>)}
                    <button onClick={handleFinishVotingEvent}>Finish Voting Process</button>
                </ul>
            </div>
        </div>)}
    </>
}

export default ChatVote