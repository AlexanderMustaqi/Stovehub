//CLASSES

export class candidate{
  votes = 0;
  constructor(name){
    this.name = name;
  }

  plus = () => {
    votes++;
  }
}

export class ballot{
  candidates = [];
  constructor(chat_id, name){
    this.chat_id = chat_id
    this.name = name
  }

  addCandidate = (name) => {
    const newCandidate = new candidate(name);
    this.candidates.push(newCandidate);
  }

  winner = () => {
    if (this.candidates.length == 0) return []
    let winner = this.candidates[0]
    let winners = [];
    winners.push(winner);
    this.candidates.forEach((e) => {
      if (e.votes > winner.votes) {winners.splice(0, winners.length);winner = e;winners.push(winner)}
      else if (e.votes == winner.votes) winners.push(e) 
    })
    if (winners.length > 1) return winners
    else return [winner]
  }
}

export class ballots{
  ballots = [];

  addBallot = (b) => {
    this.ballots.push(b);
  }

  removeBallot = (index) => {
    this.ballots.pop(index);
  }

  lastIndex = () => {
    return (this.ballots.length-1);
  }

  vote = (index, name) => {

    this.ballots[index].forEach((e) => {if (e.name == name) {e.plus()}})
  }
  
  winner = (index) => {

    const Winner = ballots[index].winner();
    this.ballots[index].pop(index);
    return Winner;
  }
}