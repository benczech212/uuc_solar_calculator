import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

// Add Download to lucide-react imports
code = code.replace(/import \{ Sun, /g, "import { Sun, Download, ");

// Import exportToPDF
code = code.replace(/import \{ ProgressTracker \} from '\.\/components\/ProgressTracker';/, "import { ProgressTracker } from './components/ProgressTracker';\nimport { exportToPDF } from './pdfExport';");

// Add Export PDF button
const exportBtn = `<button 
                onClick={() => exportToPDF('results-panel', 'solar-roi-projection.pdf')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </div>
        </header>`;
code = code.replace(/<\/div>\n        <\/header>/, exportBtn);

// Add id to results-panel
code = code.replace(/\{\/\* Results Panel \*\/\}\n          <div className="lg:col-span-7 flex flex-col gap-6 relative z-10">/, "{/* Results Panel */}\n          <div id=\"results-panel\" className=\"lg:col-span-7 flex flex-col gap-6 relative z-10\">");

fs.writeFileSync("src/App.tsx", code);
