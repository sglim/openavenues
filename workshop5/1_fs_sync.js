const fs = require("fs");

const content = "some_text";
fs.writeFileSync("test.txt", content);
const newContent = fs.readFileSync("test.txt");
console.log(newContent.toString());
