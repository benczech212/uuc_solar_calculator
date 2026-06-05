import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

const regex = /<button\s+onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setComparisonMode[^>]+>\s*<GitCompare[^>]+>\s*<\/button>\s*<button\s+onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*updateParam[^>]+>\s*(?:<div[^>]+\/>|<div[^>]+><\/div>)\s*<\/button>/g;

let count = 0;
code = code.replace(regex, (match) => {
  count++;
  return `<div className="flex items-center gap-3">\n                ${match.replace('mr-3 ', '')}\n              </div>`;
});

console.log("Matched:", count);
fs.writeFileSync("src/App.tsx", code);
