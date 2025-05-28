import { useRef, useState } from "react"

function ChatVote() {

    const [ballot, setBallot] = useState(false);
    const [candidates, setCandidates] = useState([]);

    const nameRef = useRef(null);
    const candidateRef = useRef(null);

    const formssh = {
        display: "flex",
        flexDirection: "column",
    }

    const candidateSSH = {

    }

    const CCSSH = {
        
    }

    const buttonSSH = {
        width: "50%"
    }

    const handleVoteEvent = () => {
        setCandidates([]);
        setBallot(!ballot);
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
            name: nameRef.current.value,
            candidates: candidates
        }
        const postBallot = async () => {
            try {
                const ServerResponse = await api.post(`/ballot`, JSON.stringify(message));
            }
            catch(err) {
                throw err;
            }
        }   
        postBallot();
        handleVoteEvent();
    }

    const handleRemoveCandidateEvent = (index) => {
        
    }

    return <>
        <button onClick={handleVoteEvent}>Vote</button>
        {ballot && 
        (
        <div className="overlay">
            <form type="submit" style={formssh}>
                <input ref={nameRef} type="text" placeholder="Enter Ballot Name" required />
                <div style={candidateSSH}>
                    <input ref={candidateRef} type="text" placeholder="Enter a candidate" />
                    <button type="button" onClick={handleAddCandidateEvent}>Add</button>
                </div>
                <ul>
                    {candidates.map((e, i) => <li key={i} onClick={handleRemoveCandidateEvent} id={e}> {e} </li>)}
                </ul>
                <div style={CCSSH}>
                    <button type="submit" style={buttonSSH} onClick={handleConfirmBallotEvent}>Confirm</button>
                    <button type="button" style={buttonSSH} onClick={handleCancelBallotEvent}>Cancel</button>
                </div>
            </form>
        </div>
        )}
    </>
}

export default ChatVote