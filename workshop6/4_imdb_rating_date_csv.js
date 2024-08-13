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
      hours_viewed: $(columns[3]).text().trim(),
      runtime: $(columns[4]).text().trim(),
      views: $(columns[5]).text().trim(),
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
    result.push(ranking);
  }

  const output = stringify(result, { header: true, quoted: true });
  const date = dayjs();
  const dateString = date.format("YYYYMMDD_HHmmss");
  const filename = `netflix_top10_imdb_rating.${dateString}.csv`;
  fs.writeFileSync(filename, output);
}

main();
