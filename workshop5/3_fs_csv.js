const fs = require("fs");
const { stringify } = require("csv-stringify/sync");
const { parse } = require("csv-parse/sync");

const output = stringify(
  [
    {
      name: "dennis",
      score: 10,
      major: "Computer Science",
    },
  ],
  { header: true }
);
console.log(output);

fs.writeFileSync("test.csv", output);
const newContent = fs.readFileSync("test.csv");
const newCsv = parse(newContent, { columns: true });
console.log(JSON.stringify(newCsv));
