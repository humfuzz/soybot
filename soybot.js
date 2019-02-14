const discord = require("discord.io")
const auth = require("./auth.json")
const nutrimatic = require("./nutrimatic")

const soybot = new discord.Client({
  token: auth.token,
  autorun: true
})

const MAX_LINES = 15; // max lines we want bot to speak at once
let prevCommand, prevQuery, prevResults, prevPage;  // store previous result and page num to see more

// TODO: use winston for logging
soybot.on('ready', evt=>{
  // logger.info('Connected');
  // logger.info('Logged in as: ');
  // logger.info(bot.username + ' - (' + bot.id + ')');
  console.log("we're in", soybot.username, soybot.id)
});

soybot.on('message', async (user, userID, channelID, message, evt)=>{
  if (userID === soybot.id) {
    return;
  }
  
  if (message.substring(0, 1) === '.') {
    // console.log(message);
    let args = message.substring(1).split(/ ([\s\S]*)/);
    let cmd = args[0];
    let query = args[1];

    console.log(args);
    
    console.log(cmd, query);

    let results;

    if(cmd == "n") {
      results = await nutrimatic.query(query);
      soybot.sendMessage({
        to: channelID,
        message: formatMessage("Nutrimatic", query, results, 0)
      });
    };
    if(cmd == "m") {
      soybot.sendMessage({
        to: channelID,
        message: formatMessage(prevCommand, prevQuery, prevResults, prevPage+1)
      });
    };
    if(cmd == "az") {
      query = query.replace(/\n/g, " ");
      const nums = query.split(" ");
      const newnums = nums.map(function(item) { 
  		return parseInt(item, 10); 
	  });
      const nums_a1z26 = newnums.map(function(item) {
  		return item + 64;
	  });
	  const nums_a0z25 = newnums.map(function(item) {
	  	return item + 65;
	  });
      results = [
        String.fromCharCode(...nums_a1z26) + "  // a=1",
        String.fromCharCode(...nums_a0z25) + "  // a=0",
      ];
      soybot.sendMessage({
        to: channelID,
        message: formatMessage("a1z26", query, results, 0)
      });
    }
    if(cmd == "bin") {
      query = query.replace(/\n/g, " ");
      const nums = query.split(" ").map(num=>parseInt(num, 2));

      // TODO: if num length is 8, then interpret as ascii
      const nums_a1z26 = nums.map(num=>num+64);
      const nums_a0z25 = nums_a1z26.map(num=>num+1);
      const nums_bacon = nums_a0z25.map(num=>{
        if (num >= 85) // UV
          return num + 2;
        if (num >= 74) // IJ
          return num + 1;
        return num;
      });


      // console.log(nums);
      results = [
        nums.join(" "),
        String.fromCharCode(...nums_a1z26) + "  // a=1",
        String.fromCharCode(...nums_a0z25) + "  // a=0",
        String.fromCharCode(...nums_bacon) + "  // bacon",

      ];
      console.log(results)
      soybot.sendMessage({
        to: channelID,
        message: formatMessage("Binary", query, results, 0)
      });

    };
  }
});

// given command, query, result, return discord markdown formatted message
function formatMessage(command, query, results, page) {
  let pages = Math.ceil(results.length / MAX_LINES);
  console.log("pages:", pages);
  
  if (page >= pages) {
    return "no more pages"
  }
  
  prevCommand = command;
  prevQuery = query;
  prevResults = results;
  prevPage = page;
  
  let results_string = ""
  
  
  // from start of page to the end of the page/results
  let i=page*MAX_LINES;
  let n=Math.min(i+MAX_LINES, results.length);
  for (; i<n; i++) {
    results_string += results[i];
    if (i+1 < n) results_string += "\n"; // add line break after all lines except last
  }
  
  // console.log(results_string);
  
  let pages_string = "("+(page+1).toString() + "/" + pages.toString() + ")"
  
  // surround query with two backticks so that no escaped backtick cancels out both
  let message = command + " ``  "+escapeBackticks(query) + "`` : ```js\n" + results_string + " ```";
  if (pages > 1) 
    message += pages_string;
  if (page + 1 < pages) 
    message +=  " `.m` for more";
  
  console.log(message.length);
  return message;
}

// escape each backtick for discord markdown with dirty trick
function escapeBackticks(string) {
  const space = "%E2%80%8B"; // zero width space (utf-8 encoded e2 80 8b)
  const escapeBacktick = decodeURIComponent(space+'`'+space);
  return string.replace(/`/g, escapeBacktick);
}