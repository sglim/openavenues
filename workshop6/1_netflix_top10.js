const axios = require("axios");
const cheerio = require("cheerio");

async function main() {
  const response = await axios.get("https://www.netflix.com/tudum/top10/");
  const result = [];
  const $ = cheerio.load(response.data);
  $("table tbody tr").each((index, element) => {
    const columns = $(element).find("td");
    const ranking = {
      rank: $(columns[0]).text().trim(),
      name: $(columns[1]).text().trim(),
      weeks_in_top_10: $(columns[2]).text().trim(),
      hours_viewed: $(columns[3]).text().trim(),
      runtime: $(columns[4]).text().trim(),
      views: $(columns[5]).text().trim(),
    };
    result.push(ranking);
  });
  console.log(JSON.stringify(result, null, 2));
}

main();
