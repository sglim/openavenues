const slackIncomingWebhookUrl = require("./slack_notification_url");

const axios = require("axios");
const cheerio = require("cheerio");
const { z } = require("zod");

const dayjs = require("dayjs");
const fs = require("fs");
const { stringify } = require("csv-stringify/sync");
const { parse } = require("csv-parse/sync");

const url = "https://www.libertyharbor.com/availability/";

const Listing = z.object({
  building: z.string(),
  residence: z.coerce.string(),
  beds: z.coerce.number().min(0).max(100),
  baths: z.coerce.number().min(0).max(100),
  sqft: z.coerce.number().min(10),
  price: z.coerce.number(),
  floor_plan_image_url: z.string().url(),
});

axios.get(url).then((response) => {
  const result = [];
  const $ = cheerio.load(response.data);
  $("table tbody tr").each((index, element) => {
    const columns = $(element).find("td");
    const listing = {
      building: $(columns[0]).text().trim(),
      residence: $(columns[1]).text().trim(),
      beds: parseInt($(columns[2]).text().trim(), 10),
      baths: parseInt($(columns[3]).text().trim(), 10),
      sqft: parseInt($(columns[4]).text().trim(), 10),
      price: parseInt(
        $(columns[5]).text().trim().replace("$", "").replace(",", ""),
        10
      ),
      floor_plan_image_url: $(columns[6]).find("a").attr("href"),
    };
    result.push(Listing.parse(listing));
  });

  const output = stringify(result, { header: true, quoted: true });
  const date = dayjs();
  const dateString = date.format("YYYYMMDD_HHmmss");
  const filename = `test.zod.${dateString}.csv`;
  fs.writeFileSync(filename, output);

  sendSlackNotification(result);
});

/**
 * Send slack notification
 *
 * @param {z.infer<typeof Listing>[]} currEntries
 */
async function sendSlackNotification(currEntries) {
  // Report slack notification
  const blocks = [
    ...currEntries.map((entry) => {
      const {
        building,
        residence,
        beds,
        baths,
        sqft,
        price,
        floor_plan_image_url,
      } = entry;
      console.log(floor_plan_image_url);
      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*${building}* ${residence}` +
            `\n${":bed:".repeat(beds)} Beds: ${beds} / ${":bath:".repeat(
              baths
            )} Baths: ${baths} / SQFT: ${sqft}` +
            `\n*$${price}* (P/SQ=${(price / sqft).toFixed(2)})`,
        },
        accessory: {
          type: "image",
          image_url: floor_plan_image_url,
          alt_text: "Floor plan",
        },
      };
    }),
  ];
  const slackData = {
    text: `Rent data received`,
    blocks: blocks,
  };
  const response = await fetch(slackIncomingWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(slackData),
  });
  console.log(response.status);
  console.log(response.statusText);
}
