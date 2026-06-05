import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

// 1. Add import
code = code.replace(
  "import { PdfReport } from './components/PdfReport';",
  "import { PdfReport } from './components/PdfReport';\nimport { ExecutiveSummary } from './components/ExecutiveSummary';"
);

// 2. Add vendorName
const vendorNameCode = `  const sensitivityData = useMemo(() => generateSensitivityData(effectiveParams, sensitivityVar), [effectiveParams, sensitivityVar]);

  const vendorName = useMemo(() => {
    if (params.inputMode === 'total') {
      const match = DEFAULT_QUOTES.find(q => q.systemSizeKw === params.totalSystemSizeKw && q.totalCost === params.totalGrossCost);
      return match?.companyName;
    }
    return undefined;
  }, [params.inputMode, params.totalSystemSizeKw, params.totalGrossCost]);`;

code = code.replace(
  "  const sensitivityData = useMemo(() => generateSensitivityData(effectiveParams, sensitivityVar), [effectiveParams, sensitivityVar]);",
  vendorNameCode
);

// 3. Add to results-panel
const resultsPanelCode = `          {/* Results Panel */}
          <div id="results-panel" className="lg:col-span-7 flex flex-col gap-6 relative z-10">
            
            <ExecutiveSummary params={params} results={results} vendorName={vendorName} />
            
            {/* Top Metrics Row */}`;

code = code.replace(
  "          {/* Results Panel */}\n          <div id=\"results-panel\" className=\"lg:col-span-7 flex flex-col gap-6 relative z-10\">\n            \n            {/* Top Metrics Row */}",
  resultsPanelCode
);

// 4. Remove timeline legend
const legendCode = `                {activeTab === 'timeline' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div><span className="text-[10px] text-slate-500 uppercase">Cost</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[10px] text-slate-500 uppercase">Savings</span></div>
                  </div>
                )}`;

code = code.replace(legendCode, "");

fs.writeFileSync("src/App.tsx", code);
