const fs = require("fs");

const student = {
  name: "dennis",
  score: 10,
  major: "Computer Science",
};
fs.writeFileSync("test.json", JSON.stringify(student));
const newContent = fs.readFileSync("test.json");
const newJson = JSON.parse(newContent);
console.log(newJson.name);
