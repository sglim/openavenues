// document
//   .getElementsByTagName("table")[0]
//   .querySelector("tbody")
//   .querySelectorAll("tr")[0]
//   .querySelectorAll("td");

const axios = require("axios");
const cheerio = require("cheerio");

const url = "https://www.libertyharbor.com/availability/";

axios.get(url).then((response) => {
  const result = [];
  const $ = cheerio.load(response.data);
  $("table tbody tr").each((index, element) => {
    const columns = $(element).find("td");
    result.push(columns.text());
  });
  console.log(JSON.stringify(result, null, 2));
});
