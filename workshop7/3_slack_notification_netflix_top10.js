const slackIncomingWebhookUrl = require("./slack_notification_url");

const axios = require("axios");
const cheerio = require("cheerio");
const { z } = require("zod");

const dayjs = require("dayjs");
const fs = require("fs");
const { stringify } = require("csv-stringify/sync");

const SearchResponse = z
  .object({
    d: z.array(
      z.object({
        i: z
          .object({
            height: z.number(),
            imageUrl: z.string(),
            width: z.number(),
          })
          .optional(),
        id: z.string(),
        l: z.string(),
        q: z.string().optional(),
        qid: z.string().optional(),
        rank: z.number().optional(),
        s: z.string().optional(),
        y: z.number().optional(),
        yr: z.string().optional(),
      })
    ),
    q: z.string(),
    v: z.number(),
  })
  .transform((input) => ({
    query: input.q,
    version: input.v,
    data: input.d.map((row) => {
      return {
        id: row.id,
        image: row.i,
        title: row.l,
        type: row.q,
        typeId: row.qid,
        year: row.y,
        yearRange: row.yr,
        stars: row.s,
        rank: row.rank,
      };
    }),
  }));

const Ranking = z.object({
  rank: z.coerce.number(),
  name: z.string(),
  weeks_in_top_10: z.coerce.number(),
  hours_viewed: z.coerce.number(),
  runtime: z.string(),
  views: z.coerce.number(),
  imdb_score: z.coerce.number(),
});

async function main() {
  const response = await axios.get("https://www.netflix.com/tudum/top10/");
  const result = [];
  const $ = cheerio.load(response.data);
  const trs = $("table tbody tr").toArray();
  for (const tr of trs) {
    const columns = $(tr).find("td");
    const ranking = {
      rank: $(columns[0]).text().trim(),
      name: $(columns[1]).text().trim(),
      weeks_in_top_10: $(columns[2]).text().trim(),
      hours_viewed: $(columns[3]).text().replace(/,/g, "").trim(),
      runtime: $(columns[4]).text().trim(),
      views: $(columns[5]).text().trim().replace(/,/g, ""),
    };
    const suggestionResponse = await axios.get(
      `https://v3.sg.media-imdb.com/suggestion/x/${ranking.name}.json?includeVideos=1`
    );
    const suggestion = SearchResponse.parse(suggestionResponse.data);
    const found = suggestion.data.find((row) => row.title === ranking.name);
    console.log(found);
    const imdbResponse = await fetch(`https://www.imdb.com/title/${found.id}`);
    const imdbHtml = await imdbResponse.text();
    const $2 = cheerio.load(imdbHtml);
    const score = $2(
      '[data-testid="hero-rating-bar__aggregate-rating__score"] :first'
    ).text();
    console.log(score);
    ranking.imdb_score = score;
    result.push(Ranking.parse(ranking));
  }

  const output = stringify(result, { header: true, quoted: true });
  const date = dayjs();
  const dateString = date.format("YYYYMMDD_HHmmss");
  const filename = `netflix_top10_imdb_rating.${dateString}.csv`;
  fs.writeFileSync(filename, output);
  sendSlackNotification(result);
}

main();

/**
 * Send slack notification
 *
 * @param {z.infer<typeof Ranking>[]} currEntries
 */
async function sendSlackNotification(currEntries) {
  // Report slack notification
  const blocks = [
    ...currEntries.map((entry) => {
      const {
        rank,
        imdb_score,
        name,
        weeks_in_top_10,
        hours_viewed,
        runtime,
        views,
      } = entry;

      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `Rank *${rank}* - ${name}` +
            `\nWeeks in top 10: ${weeks_in_top_10} weeks, Hours viewed: ${hours_viewed}h, Runtime: ${runtime}` +
            `\n[*${views}* views] with rating: ${imdb_score}`,
        },
      };
    }),
  ];
  const slackData = {
    text: `Netflix data received`,
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
