const discord = require("discord.io")
const winston = require("winston")
const auth = require("./auth.json")
const nutrimatic = require("./nutrimatic")

const enumerateErrorFormat = winston.format(info => {
  if (info.message instanceof Error) {
    info.message = Object.assign({
      message: info.message.message,
      stack: info.message.stack
    }, info.message);
  }

  if (info instanceof Error) {
    return Object.assign({
      message: info.message,
      stack: info.stack
    }, info);
  }

  return info;
});

const logger = winston.createLogger({
  level: 'info',
  // defaultMeta: { service: 'user-service' },
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
    new winston.transports.Console({
      colorize: true,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.align(),
        enumerateErrorFormat(),
        winston.format.timestamp(),
        winston.format.simple()
        // winston.format.printf((info) => {
        //   const ts = info.timestamp().slice(5,19).replace('T', '   ');
        //   if (info.args) {
        //     return `${ts} [${info.level}]: ${info.message} ${(info.level > 3 && (Object.keys(info.args).length || Object.getOwnPropertyNames(info.args).length)) ? JSON.stringify(info.args, null, 2) : ''}`;
        //   } else {
        //     return `${ts} [${process.pid}] [${info.level}]: ${info.message}`;
        //   }
        // })
      ),
    })
  ]
});

const soybot = new discord.Client({
  token: auth.token,
  autorun: true
})

const COMMAND_SYMBOL = ".";
const MAX_LINES = 15; // max lines we want bot to speak at once
const VALID_CHANNELS = ["soybot", "puzzle-bot"];
const INDENT = "        ";

let prevCommand, prevQuery, prevResults, prevPage;  // store previous result and page num to see more
let helpCommands = {}; // dictionary of commands
let helpCommandsExamples = {}
let helpCommandsOrder = ["az", "bin", "morse", "n"];


// TODO: use winston for logging
soybot.on('ready', evt=>{
  soybot.setPresence({
    game: {
      name: "type .help for help"
    } 
  });
  logger.info(soybot.username + " started.");
});

soybot.on('message', async (user, userID, channelID, message, evt)=>{
  try {
    const channels = soybot.servers[evt.d.guild_id].channels;
    const channelName = channels[channelID].name;

    // the IDS of valid channels in this server
    const validChannelIDs = Object.keys(channels).filter(channelID=>VALID_CHANNELS.includes(channels[channelID].name));
    
    // no feedback loops
    if (userID === soybot.id) {
      return;
    }

    // only allow soybot in valid channels
    // logger.info(soybot.username + " joined " + channelName); 
    if (!VALID_CHANNELS.includes(channelName)) {
    //if ".help" in an invalid channel, give a short quip to tell them to use the right channel
      if (message === COMMAND_SYMBOL + "help") {
        soybot.sendMessage({
          to: channelID,
          message: "hi, i'm soybot! i only work in the following channel(s): " + validChannelIDs.reduce((acc, ch)=>acc + "<#" + ch + "> ", "")
        });
      }
      
      return;
    }

    logger.info(message, {user: user});

    // TODO: help command
    
    if (message.substring(0, 1) === COMMAND_SYMBOL) {
      // console.log(message);
      let args = message.substring(1).split(/ ([\s\S]*)/);
      let cmd = args[0];
      let query = args[1];

      // console.log(args);
      // console.log(cmd, query);

      let results;

      helpCommands["n"] = "query Nutrimatic (https://nutrimatic.org/)";
      helpCommandsExamples["n"] = ".n m<aop> tV[gyzqfls]u";
      if(cmd == "n" && typeof query !== 'undefined') {
        results = await nutrimatic.query(query);
        soybot.sendMessage({
          to: channelID,
          message: formatMessage("Nutrimatic", query, results, 0)
        });
      };
      helpCommands["m"] = "show next page of results"
      if(cmd == "m") {
        soybot.sendMessage({
          to: channelID,
          message: formatMessage(prevCommand, prevQuery, prevResults, prevPage+1)
        });
      };

      helpCommands["az"] = "nums to letters";
      helpCommandsExamples["az"] = ".az 4 15 5 14 10 1 14 7";
      if(cmd == "az" && typeof query !== 'undefined') {
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

      helpCommands["bin"] = "binary (5 bit)/bacon";
      helpCommandsExamples["bin"] = ".bin 01100 00000 10010 10010 01101";      
      if(cmd == "bin" && typeof query !== 'undefined') {
        query = query.replace(/\n/g, " ");
        const nums = query.split(" ").map(num=>parseInt(num, 2)).filter(num=>!Number.isNaN(num));

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

        // TODO: add inverted case (xor 11111)

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
      
      helpCommands["morse"] = "morse"
      helpCommandsExamples["morse"] = ".morse - . -- .--. . ....";
      if(cmd == "morse" && typeof query !== 'undefined') {
        query = query.replace(/\n/g, " ");
        morse = query.split(" ");
        const alphabet = {
          "-----":"0",
          ".----":"1",
          "..---":"2",
          "...--":"3",
          "....-":"4",
          ".....":"5",
          "-....":"6",
          "--...":"7",
          "---..":"8",
          "----.":"9",
          ".-":"A",
          "-...":"B",
          "-.-.":"C",
          "-..":"D",
          ".":"E",
          "..-.":"F",
          "--.":"G",
          "....":"H",
          "..":"I",
          ".---":"J",
          "-.-":"K",
          ".-..":"L",
          "--":"M",
          "-.":"N",
          "---":"O",
          ".--.":"P",
          "--.-":"Q",
          ".-.":"R",
          "...":"S",
          "-":"T",
          "..-":"U",
          "...-":"V",
          ".--":"W",
          "-..-":"X",
          "-.--":"Y",
          "--..":"Z",
          "/":" ",
        }
        
        const convertedData = []
        morse.map(function(letter) {
          convertedData.push(alphabet[letter])
        })
        const results = [
          convertedData.join(""),
        ]
        soybot.sendMessage({
          to: channelID,
          message: formatMessage("Morse", query, results, 0)
        });
      };

      if(cmd == "help") {

        let message = "hi, i'm soybot! here are my commands:\n"
          + helpCommandsOrder.reduce((acc, cmd)=>acc 
                                                + codeString(COMMAND_SYMBOL + cmd) + " - " 
                                                + helpCommands[cmd] + "\n"
                                                + INDENT + codeString(helpCommandsExamples[cmd]) + "\n\n",
                                      "")
          + "please let hum or wutpu know if you have any suggestions for me!"


        soybot.sendMessage({
          to: channelID,
          message: message
        });
      };
    }
  } catch(err) {
    logger.error(err);
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

// format string safely for code
function codeString(string) {
  return "``  "+escapeBackticks(string) + "``";
}

// escape each backtick for discord markdown with dirty trick
function escapeBackticks(string) {
  const space = "%E2%80%8B"; // zero width space (utf-8 encoded e2 80 8b)
  const escapeBacktick = decodeURIComponent(space+'`'+space);
  return string.replace(/`/g, escapeBacktick);
}