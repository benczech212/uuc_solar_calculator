import fs from "fs";

let code = fs.readFileSync("src/App.tsx", "utf8");

// Import PdfReport
code = code.replace(/import \{ ProgressTracker \} from '\.\/components\/ProgressTracker';/, "import { ProgressTracker } from './components/ProgressTracker';\nimport { PdfReport } from './components/PdfReport';");

// Change button target
code = code.replace(/exportToPDF\('results-panel', 'solar-roi-projection.pdf'\)/, "exportToPDF('pdf-report-container', 'uuc-solar-projection.pdf')");

// Add PdfReport to the end of the root div
code = code.replace(/      <\/div>\n    <\/div>\n  \);\n\}\n$/, "      </div>\n      <PdfReport params={params} results={results} />\n    </div>\n  );\n}\n");

fs.writeFileSync("src/App.tsx", code);
