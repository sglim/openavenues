const transcriptList = [
  {
    name: "math",
    score: 40,
  },
  {
    name: "english",
    score: 50,
  },
  {
    name: "computer",
    score: 60,
  },
];

const manipulated = [];
for (const transcript of transcriptList) {
  manipulated.push({
    name: transcript.name,
    score: transcript.score + 40,
  });
}
console.log(JSON.stringify(manipulated));

const mapped = transcriptList.map((v) => ({
  name: v.name,
  score: v.score + 40,
}));
console.log(JSON.stringify(mapped));
