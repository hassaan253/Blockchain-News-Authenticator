App = { //first we instantiate the App class which will run our backend server
  web3Provider: null, //these items are declared at the start
  contracts: {},
  account: '0x0',
  hasVoted: false,
  count : localStorage.getItem("count") || 0,



  

// the functions here will return another different function and in this will way will react depending
// on how the user interacts with the website

//Web3.js is the javascript library we will be using to integrate the smart contract with
  init: function () { //initialize the website using web3
    return App.initWeb3();
  },
  // connect web-app to local blockchain using web3
  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      //metamask turns browser into blockchain provider
      App.web3Provider = web3.currentProvider; 
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(window.ethereum);
    }
    return App.initContract();
  },

  initContract: function () { //connect smart contract
    $.getJSON("Auditor.json", function (auditor) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Auditor = TruffleContract(auditor); //we interact with this contract
      // Connect provider to interact with contract
      App.contracts.Auditor.setProvider(App.web3Provider);
      //use the bs-congfig.js run connect to smart contracts, bs stands for browser sync package
      App.listenForEvents();
      return App.render();
    });
  },
  //listen for events
  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.Auditor.deployed().then(function (instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
    App.contracts.Auditor.deployed().then(function (instance) {
      instance.votingLocked({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.lastLocked();
      });
    });
  },

  render: function() { // this will be the main function that will get data of each news item from smart contract
   // and give it to front end to display on website
   console.log(App.count);
   //localStorage.setItem("count", 0);
    var newsInstance;
    var loader = $("#loader");
    var content = $("#content");
    loader.show();
    content.hide();
    // Load account data using web3 function
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account); // this will display account address at the front end 
      }
    });


	// the deployed() method will wait to ensure the smart contract has been correctly deployed and will then
	// carry on
  App.contracts.Auditor.deployed().then(function (instance) {
    auditorInstance = instance;
    return auditorInstance.newsCount();
  }).then(function(newsCount) {
    web3.eth.getCoinbase(function(err,account) {
      App.account = account;
      var points = newsInstance.crowdauditors(App.account);
      newsInstance.crowdauditors(account).then(function(item) {
        $("#accountPoints").html("Your Points: " + item[2]);
      })
    });
  });
      App.contracts.Auditor.deployed().then(function (instance) {
      newsInstance = instance;
      return newsInstance.newsCount(); //news count is the total number of news, it is an item in smart contract
// and is being returned here
    }).then(function (newsCount) {
      var newsResults = $('#newsResults');
      newsResults.empty();
      var newsSelect = $('#newsSelect');
      newsSelect.empty();
   // now using newscount as counter we will loop through all the news stored in smart contract and return the
	// id, title, upvotes and downvotes of each news headline
      for (var i = 1; i <= newsCount; i++) {
        newsInstance.news(i).then(function(item) {
      //  console.log("counter, " ,i);
        var name = item[0];
        console.log(name);
        var id = item[1];
        var upvote = item[2];
        var downvote = item[3];
	var str = "";
	//this is converting hex of name into ASCII format that is readable for users
	    for (var j = 0; j < name.length ; j += 2) {
        str += String.fromCharCode(parseInt(name.substr(j, 2), 16)); }
	//now we are appending the values to one variable, so that they may be displayed on front end easily
 
    var candidateTemplate = "<tr><th>" + id + "</th><td>" + str + "</td><td>" + upvote + "</td><td>" + downvote + "</td></tr>";
    newsResults.append(candidateTemplate);
    var candidateOption = "<option value='" + id + "'>" + str  + "</ option>"
    newsSelect.append(candidateOption);
      }); 
    }

    return newsInstance.crowdauditors(App.account);
    }).then(function (hasVoted) {
        // Do not allow a user to vote
        if (hasVoted) {
        }
        loader.hide();
        content.show();
      }).catch(function (error) {
        console.warn(error);
      });
  },

  upVote: function () {
    var current_date = Date.now();
    var minutes = current_date/60000;
    var candidateId = $('#newsSelect').val();
    App.contracts.Auditor.deployed().then(function (instance) {
      return instance.upVote(candidateId, minutes, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  },

  downVote: function () {
    var current_date = Date.now();
    var minutes = current_date/60000;
    var candidateId = $('#newsSelect').val();
    App.contracts.Auditor.deployed().then(function (instance) {
      return instance.downVote(candidateId, minutes, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  },

  addNews: function () {
    var current_date = Date.now();
    var minutes = current_date/60000;
    // convert news item to bytes32
    var news_item = $('#news_item').val();
    var len = news_item.length;
    var arr1 = [];
    for (var n = 0, l = len; n < l; n++) {
      var hex = Number(news_item.charCodeAt(n)).toString(16);
      arr1.push(hex);
    }
    num = arr1.join('')
    size = num.length;
    if (size < 32) {
      for (let i = 0; i < (32 - size); i++) {
        num += "0";
      }
    }
    var hex = '0x' + num;
    console.log(hex)
    // conversion end


    App.contracts.Auditor.deployed().then(function (instance) {
      return instance.addNews( hex, minutes ,{ from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    }); 
  },

addNewsAuto: function() {
    fetch('jsonData.json').then(response => response.json())
    .then(function(data) {

var news_item = data.data[App.count]["headline"];
//console.log("This item is being picked ", App.count);
//console.log(news_item);

// convert news item to bytes32
var len = news_item.length;
var arr1 = [];
for (var n = 0, l = len; n < l && n < 32; n++) {
  var hex = Number(news_item.charCodeAt(n)).toString(16);
  arr1.push(hex);
}
num = arr1.join('')
size = num.length;
if (size < 32) {
  for (let i = 0; i < (32 - size); i++) {
    num += "0";
  }
}
var hex = '0x' + num;
console.log(hex);
// conversion ends
var current_date = Date.now();
var minutes = current_date/60000;
      App.contracts.Auditor.deployed().then(function (instance) {
        return instance.addNews( hex, minutes ,{ from: App.account });
      }).then(function (result) {
        // Wait for votes to update
        $("#content").hide();
        $("#loader").show();
      }).catch(function (err) {
        console.error(err);
      });
    });
    App.count++;
    localStorage.setItem("count", App.count);
    return App.render();
  },

  addAuditor: function () {
    var address = $('#address').val();
    App.contracts.Auditor.deployed().then(function (instance) {
      return instance.giveRightToVote(address, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  },
 // App.contracts.Auditor.deployed().then(function (instance) {
   // newsInstance = instance;
    //return newsInstance.newsCount(); //news count is the total number of news, it is an item in smart contract
// and is being returned here
 // }).then(function (newsCount) {
  //  var newsResults = $('#newsResults');
   // newsResults.empty();
    //var newsSelect = $('#newsSelect');

 // now using newscount as counter we will loop through all the news stored in smart contract and return the
// id, title, upvotes and downvotes of each news headline
  //  for (var i = 1; i <= newsCount; i++) {
    //  newsInstance.news(i).then(function(item) {
    //  var name = item[0];
     // var id = item[1];
     // var upvote = item[2];
   //   var downvote = item[3];
//var str = ""; */

  lastLocked:function() {
    var newsInstance ;
    App.contracts.Auditor.deployed().then(function (instance) {
    newsInstance = instance;
      return newsInstance.locked_count;
    }).then(function (locked_count) {
      //var count = locked_count -1;
      console.log(newsInstance.locked);
      var position = newsInstance.locked(locked_count-1);
      //var last_headline = newsInstance.locked(count);
      newsInstance.news(1).then(function(item)
       {
         console.log(item);
        App.countPoints(item[0]);
      });
      }); 
  },

  countPoints : headline => {
    var upvotes = App.get_upVotes(headline) ;
    var downvotes = App.get_downVotes(headline);
    var total_votes = upvotes + downvotes;

    if (upvotes/total_votes * 100 >= 70) {

      App.contracts.Auditor.deployed().then(function (instance) {
        newsInstance = instance;
        return newsInstance.newsCount(); 
      }).then(function (newsCount) {
          newsInstance.news(headline).then(function(item) {
          for ( i = 0; i < item[4].length; i++) {
            App.addPoints(item[4][i]);
          }
          for (i = 0; i < item[5].length; i++) {
            App.subtractPoints(item[5][i]);
          }
    
        }); 
      }) 
    } else if (downvotes/total_votes * 100 >=70) {
      App.contracts.Auditor.deployed().then(function (instance) {
        newsInstance = instance;
        return newsInstance.newsCount(); 
      }).then(function (newsCount) {
          newsInstance.news(headline).then(function(item) {
          for ( i = 0; i < item[4].length; i++) {
            App.subtractPoints(item[4][i]);
          }
          for (i = 0; i < item[5].length; i++) {
            App.addPoints(item[5][i]);
          }
    
        }); 
      }) 

    } else {
      // no consensus
    }
    App.render();
  },

  get_upVotes : headline => {
    var newsInstance;
    App.contracts.Auditor.deployed().then(function (instance) {
      newsInstance = instance;
      return newsInstance.newsCount;
    }).then(function(newsCount){
        newsInstance.news(headline).then(function(item) {
        var upvote = item[2];
        return upvote;
      }); 
    })
  },

  get_downVotes : headline => {
    var newsInstance;
    App.contracts.Auditor.deployed().then(function (instance) {
      newsInstance = instance;
      return newsInstance.newsCount;
    }).then(function(newsCount){
        newsInstance.news(headline).then(function(item) {
        var upvote = item[3];
        return upvote;
      }); 
    })
  },

  addPoints: function( voter) {
    
    App.contracts.Auditor.deployed().then(function (instance) {
      return instance.addPoints(voter, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });   
  },

  subtractPoints: function() {
    App.contracts.Auditor.deployed().then(function (instance) {
      return instance.subtractPoints(voter, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });


  }

};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
