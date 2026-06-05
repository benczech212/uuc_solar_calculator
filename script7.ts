import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

// 1. Add FileText to lucide-react imports
code = code.replace(/import \{ Sun, TrendingUp, Zap, PiggyBank, Receipt, Leaf, Battery, Wrench, BarChart2, Activity, Calculator, ShieldAlert, ChevronDown, ChevronUp, Save, GitCompare, RotateCcw, LayoutDashboard, LineChart, Home \} from 'lucide-react';/, "import { Sun, TrendingUp, Zap, PiggyBank, Receipt, Leaf, Battery, Wrench, BarChart2, Activity, Calculator, ShieldAlert, ChevronDown, ChevronUp, Save, GitCompare, RotateCcw, LayoutDashboard, LineChart, Home, FileText } from 'lucide-react';");

// 2. Add VendorQuote interface and DEFAULT_QUOTES above DEFAULT_PARAMS
const quoteDefs = `
interface VendorQuote {
  id: string;
  companyName: string;
  systemSizeKw: number;
  totalCost: number;
}

const DEFAULT_QUOTES: VendorQuote[] = [
  { id: '1', companyName: 'EPC', systemSizeKw: 76.7, totalCost: 183693 },
  { id: '2', companyName: 'New Era', systemSizeKw: 75.9, totalCost: 193232 },
  { id: '3', companyName: 'Bay Area', systemSizeKw: 75.5, totalCost: 218976 },
];
`;
if (!code.includes("interface VendorQuote")) {
  code = code.replace("const DEFAULT_PARAMS: SolarParams = {", `${quoteDefs}\nconst DEFAULT_PARAMS: SolarParams = {`);
}

// 3. Add quotes element to sectionsActive
code = code.replace(/system: true,\n    utility: false,/, "quotes: true,\n    system: true,\n    utility: false,");

// 4. Add quotes JSX before System Specs
const applyQuoteStr = `
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('quotes')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.quotes ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>Vendor Quotes</span>
                  </h2>
                </div>
              </div>

              <div className={\`space-y-4 transition-all duration-300 \` + (sectionsActive.quotes ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden')}>
                <div className="grid grid-cols-1 gap-2">
                  {DEFAULT_QUOTES.map(q => (
                    <button 
                      key={q.id}
                      onClick={() => {
                        updateParam('inputMode', 'total');
                        updateParam('totalSystemSizeKw', q.systemSizeKw);
                        updateParam('totalGrossCost', q.totalCost);
                      }}
                      className={\`flex items-center justify-between p-3 rounded-lg border text-left transition-colors \${params.inputMode === 'total' && params.totalSystemSizeKw === q.systemSizeKw && params.totalGrossCost === q.totalCost ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}\`}
                    >
                      <div>
                        <div className="font-bold">{q.companyName}</div>
                        <div className="text-xs text-slate-500 mt-1">{q.systemSizeKw.toFixed(1)} kW • {formatCurrency(q.totalCost)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{(q.totalCost / (q.systemSizeKw * 1000)).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}/W</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6" />

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('system')}>`;

code = code.replace(/<div className="flex items-center justify-between pb-2 border-b border-slate-800\/50 cursor-pointer group" onClick=\{\(\) => toggleSection\('system'\)\}>/, applyQuoteStr);

fs.writeFileSync("src/App.tsx", code);
