import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

const breakEvenBlock = /(<h2 className="text-8xl font-light text-white tracking-tighter">\s*\{results\.paybackPeriod\.toFixed\(1\)\}\s*<\/h2>\s*<span className="text-2xl text-slate-400 font-serif italic">Years<\/span>\s*<\/div>)/;

code = code.replace(breakEvenBlock, (match) => {
  return `${match}\n                  {compareResults && compareResults.paybackPeriod > 0 && (\n                    <div className="flex items-center gap-2 mt-2">\n                      <span className={\`text-sm font-mono \$\{results.paybackPeriod < compareResults.paybackPeriod ? 'text-emerald-400' : results.paybackPeriod > compareResults.paybackPeriod ? 'text-rose-400' : 'text-slate-500'}\`}>\n                        {results.paybackPeriod < compareResults.paybackPeriod ? '-' : '+'}{Math.abs(results.paybackPeriod - compareResults.paybackPeriod).toFixed(1)} yrs vs compare\n                      </span>\n                    </div>\n                  )}`;
});

fs.writeFileSync("src/App.tsx", code);
