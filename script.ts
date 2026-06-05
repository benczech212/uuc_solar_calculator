import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

// 1. Add comparisonMode state
if (!code.includes("const [comparisonMode,")) {
  code = code.replace(
    /const \[confirmReset, setConfirmReset\] = useState\(false\);/,
    `const [confirmReset, setConfirmReset] = useState(false);\n  const [comparisonMode, setComparisonMode] = useState<string | null>(null);`
  );
}

// 2. Add compareResults calculation
if (!code.includes("const compareResults = useMemo(")) {
  code = code.replace(
    /const results = useMemo\(\(\) => calculateRoi\(effectiveParams\), \[effectiveParams\]\);/,
    `const results = useMemo(() => calculateRoi(effectiveParams), [effectiveParams]);\n\n  const compareResults = useMemo(() => {\n    if (!comparisonMode) return null;\n    const compParams = { ...effectiveParams };\n    if (comparisonMode === 'efficiency') compParams.hasSolarEfficiency = !compParams.hasSolarEfficiency;\n    if (comparisonMode === 'maintenance') compParams.hasMaintenance = !compParams.hasMaintenance;\n    if (comparisonMode === 'storage') compParams.hasBattery = !compParams.hasBattery;\n    if (comparisonMode === 'incentives') compParams.hasIncentives = !compParams.hasIncentives;\n    if (comparisonMode === 'financing') compParams.isFinanced = !compParams.isFinanced;\n    return calculateRoi(compParams);\n  }, [effectiveParams, comparisonMode]);`
  );
}

// 3. Update RoiChart call
code = code.replace(
  /<RoiChart data=\{results\.chartData\} paybackPeriod=\{results\.paybackPeriod\} \/>/,
  `<RoiChart data={results.chartData} paybackPeriod={results.paybackPeriod} compareData={compareResults?.chartData} />`
);

// 4. Move efficiency block
const efficiencyRegex = /(<div className="pt-4 mt-2 border-t border-slate-800\/50 space-y-6">[\s\S]*?toggleSection\('efficiency'\)[\s\S]*?<\/div>\n            <\/div>)\n\n            <div className="pt-4 mt-2 border-t border-slate-800\/50 space-y-6">/;

const match = code.match(efficiencyRegex);
if (match) {
  const efficiencyBlock = match[1];
  code = code.replace(efficiencyBlock + "\n\n", "");
  
  const energyEndRegex = /(<div className="pt-4 mt-2 border-t border-slate-800\/50 space-y-6">\n              <div className="flex items-center justify-between pb-2 border-b border-slate-800\/50 cursor-pointer group" onClick=\{\(\) => toggleSection\('maintenance'\)\})/;
  
  code = code.replace(energyEndRegex, `${efficiencyBlock}\n\n            $1`);
}

// 5. Add compare buttons to section headers
function addCompareButton(sectionKey, toggleName, codeStr) {
  const toggleSearchStr = `className={\`w-10 h-5 rounded-full relative transition-colors \$\{params.${toggleName} ? 'bg-amber-500' : 'bg-slate-700'}\`}`;
  // Actually we need to insert the Compare button BEFORE the toggle button in the header.
  // We can find the <button onClick={(e) => { e.stopPropagation(); updateParam... and insert before it
  const btnStr = `<button
                  onClick={(e) => { e.stopPropagation(); updateParam('${toggleName}', !params.${toggleName}); }}`;
                  
  const replacement = `<button
                  onClick={(e) => { e.stopPropagation(); setComparisonMode(comparisonMode === '${sectionKey}' ? null : '${sectionKey}'); setActiveTab('timeline'); }}
                  className={\`mr-3 p-1 rounded transition-colors \$\{comparisonMode === '${sectionKey}' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}\`}
                  title="Compare impact"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateParam('${toggleName}', !params.${toggleName}); }}`;
                  
  return codeStr.replace(btnStr, replacement);
}

// Wait, the battery toggle uses emerald, not amber.
// Let's just replace based on the updateParam part.
code = addCompareButton('efficiency', 'hasSolarEfficiency', code);
code = addCompareButton('maintenance', 'hasMaintenance', code);
code = addCompareButton('storage', 'hasBattery', code);
code = addCompareButton('incentives', 'hasIncentives', code);
code = addCompareButton('financing', 'isFinanced', code);

fs.writeFileSync("src/App.tsx", code);
