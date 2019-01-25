// const request = require("request");
const HTMLParser = require("fast-html-parser")
const fetch = require("node-fetch")

// const MAX_LINES = 15; // TODO: instead of returning a single string, return an array of lines. let the soybot figure out the number of lines to return

const URL_NUTRIMATIC = 'https://nutrimatic.org/?q='

async function query(query) {
  try {
  const res = await fetch(URL_NUTRIMATIC + encodeURIComponent(query));
  const body = await res.text();

  // console.log(body);

  const root = HTMLParser.parse(body);
  const output = root.querySelectorAll('span');
  
  let result = [];
  
  for (let i=0, n=output.length; i<n; i++) {
    const line = output[i];
    const weight = parseFloat(line.attributes.style.replace(/font-size: /, '').replace(/em/, ''));
    const text = line.childNodes[0].rawText;
    result.push(weight.toFixed(2) + "  " + text);
  }

  console.log(query,"\n", result) // TODO: replace with log

  return result;

  } catch (error) {
    console.log(error); // TODO: error the promise
  }

}

exports.query = query;
