import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

code = code.replace(
  /system: true,\n    efficiency: false,/,
  "quotes: true,\n    system: true,\n    efficiency: false,"
);

fs.writeFileSync("src/App.tsx", code);
