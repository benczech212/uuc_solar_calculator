import fs from "fs";

let code = fs.readFileSync("src/components/PdfReport.tsx", "utf8");

const header = `<div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-white mb-2">UUC Solar ROI <span className="text-slate-500 italic font-serif">Projection</span></h1>
          <p className="text-slate-400">25-Year Projection Summary</p>
        </div>`;

const newHeader = `<div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400">By Ben Czech</span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-white mb-2">UUC Solar ROI <span className="text-slate-500 italic font-serif">Projection</span></h1>
          <p className="text-slate-400">25-Year Projection Summary</p>
        </div>`;

code = code.replace(header, newHeader);
fs.writeFileSync("src/components/PdfReport.tsx", code);
