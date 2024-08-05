// document
//   .getElementsByTagName("table")[0]
//   .querySelector("tbody")
//   .querySelectorAll("tr")[0]
//   .querySelectorAll("td");

const axios = require("axios");
const cheerio = require("cheerio");
const { z } = require("zod");

const url = "https://www.libertyharbor.com/availability/";

const Listing = z.object({
  building: z.string(),
  residence: z.coerce.number(),
  beds: z.coerce.number().min(0).max(100),
  baths: z.coerce.number().min(0).max(100),
  sqft: z.coerce.number().min(10),
  price: z.coerce.number(),
});

axios.get(url).then((response) => {
  const result = [];
  const $ = cheerio.load(response.data);
  $("table tbody tr").each((index, element) => {
    const columns = $(element).find("td");
    const listing = {
      building: $(columns[0]).text().trim(),
      residence: parseInt($(columns[1]).text().trim(), 10),
      beds: parseInt($(columns[2]).text().trim(), 10),
      baths: parseInt($(columns[3]).text().trim(), 10),
      sqft: parseInt($(columns[4]).text().trim(), 10),
      price: parseInt(
        $(columns[5]).text().trim().replace("$", "").replace(",", ""),
        10
      ),
    };
    result.push(Listing.parse(listing));
  });
  console.log(JSON.stringify(result, null, 2));
});
