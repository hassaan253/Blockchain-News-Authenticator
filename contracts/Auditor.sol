pragma solidity >=0.7.0 <0.9.0;
/// @title Voting with delegation.

contract Auditor {

    event votedEvent(uint indexed _newsID);
    event votingLocked(uint indexed _newsID);

    struct CrowdAuditor {
        uint weight; // weight is accumulated by delegation
        uint vote;   // index of the voted proposal
        uint[] past_votes; //list of past proposals they have voted on
        uint points;
    } 

    mapping(uint => uint) public locked; //id of headlines that have been locked from voting
    uint public locked_count =0;
     uint public newsCount =0;

    struct News{
        bytes32 name;   // short name (up to 32 bytes)
	    uint id;
        uint upVote; // number of up votes
        uint downVote;
      
        uint time;
        bool voting_locked;
        address[] auditors_up;
        address[] auditors_down;
    }
 
    address public chairperson; // we make the person who set up the node as the chairperson
    mapping(address => CrowdAuditor) public crowdauditors;
//making an array of news type objects
    //News[] public news;
      mapping(uint => News) public news;

    //add news is used to add a news item to the news array
    function addNews(bytes32  NewsItem, uint date_added) external {
        newsCount ++;
        news[newsCount].name = NewsItem;
        news[newsCount].id = newsCount;
        news[newsCount].upVote = 0;
        news[newsCount].downVote = 0;
        news[newsCount].time = date_added;
        news[newsCount].voting_locked = false;
}
 
    constructor() {
        
        chairperson = msg.sender;
        crowdauditors[chairperson].weight = 1;
        crowdauditors[chairperson].points = 100;
	 }

    //this function is used to give a node persmission to vote, only nodes with permissions can vote
    function giveRightToVote(address auditor_add) external {
        require(
            msg.sender == chairperson,
            "Only chairperson can give right to vote."
        );
        require(crowdauditors[auditor_add].weight == 0);
       crowdauditors[auditor_add].weight = 1;
         crowdauditors[auditor_add].points = 100;
        
    }
       
    function upVote(uint headline, uint current_time) public 
    returns (string memory result) {
                CrowdAuditor storage sender = crowdauditors[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
    require( !(news[headline].voting_locked) , "Voting on this has been blocked" );
    if (current_time - news[headline].time > 15) {
        news[headline].voting_locked = true;
        emit votingLocked(news[headline].id);
        locked_count ++;
        locked[locked_count] = news[headline].id;

        result = "Voting time elapsed";
    } else {
        //each auditor can only vote once per headline
        for (uint p=0; p<sender.past_votes.length ;p++){
            if(news[headline].id == sender.past_votes[p]) {
     result = "Already voted";
                 } }
        
        address voter = msg.sender;
        sender.past_votes.push(news[headline].id);
        
        news[headline].auditors_up.push(voter);
        news[headline].upVote += 1;
	emit votedEvent(news[headline].id);
                result = "Done voting";
        
    }
    }
 
 function downVote(uint headline, uint current_time) public 
    returns (string memory result) {
                CrowdAuditor storage sender = crowdauditors[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
    require( !(news[headline].voting_locked) , "Voting on this has been blocked" );
    if (current_time - news[headline].time > 15) {
        news[headline].voting_locked = true;
        emit votingLocked(news[headline].id);
        
        locked_count ++;
        locked[locked_count] = news[headline].id;
        result = "Voting has been lock";
    } else {
        //each auditor can only vote once per headline
        for (uint p=0; p<sender.past_votes.length ;p++){
            if(news[headline].id == sender.past_votes[p]) {
                result = "Cant vote";
                 } }
    
                         address voter = msg.sender;
        sender.past_votes.push(news[headline].id);
        
        news[headline].auditors_up.push(voter);
        news[headline].downVote += 1;
       result =  "Done voting";
	emit votedEvent(news[headline].id);
result = "voting done";
        
    }
    }

    function addPoints(address auditor) public 
     {
            crowdauditors[auditor].points += 1;     
    }

    function subtractPoints(address auditor) public 
     {
            crowdauditors[auditor].points -= 1;       
    }

 /* user gives an input of the news item they want to check by adding its number in the array
 the accuracy of that item is returned*/
   function show_upvotes(uint item) public view
    returns  (uint upvotes){
         upvotes =  news[item].upVote ;
    }
    
    function show_downvotes(uint item) public view
    returns  (uint downvotes){
        downvotes =  news[item].downVote;
    } 
    }

