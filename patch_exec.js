import fs from 'fs';

let code = fs.readFileSync('src/components/ExecutiveSummary.tsx', 'utf8');

const replacements = [
  {
    target: "    <div className=\"bg-slate-900/60 border border-slate-800 rounded-2xl p-6 leading-relaxed text-slate-400 font-sans shadow-sm\">\n      <p>\n        Choosing{companyStr} a <TooltipText text={`${results.systemSizeKW.toFixed(1)} kW system`} title=\"System Size\" content=\"The total peak direct current (DC) power of all solar panels combined.\" /> at <TooltipText text={`${formatCurrency(costPerWatt)}/W`} title=\"Cost Per Watt\" content=\"The gross cost of the system divided by the total wattage. This is a common industry metric for comparing solar quotes.\" />",
    replacement: "    <div className=\"bg-slate-900/60 border border-slate-800 rounded-2xl p-6 leading-relaxed text-slate-400 font-sans shadow-sm\">\n      <p>\n        Choosing{companyStr} a <TooltipText text={`${results.systemSizeKW.toFixed(1)} kW system`} title=\"System Size\" content=\"The total peak direct current (DC) power of all solar panels combined.\" /> at <TooltipText text={`${formatCurrency(costPerWatt, 2)}/W`} title=\"Cost Per Watt\" content=\"The gross cost of the system divided by the total wattage. This is a common industry metric for comparing solar quotes.\" />"
  },
  {
    target: "      <p className=\"mt-4 text-xs text-slate-500 border-t border-slate-800/50 pt-4\">\n        These projections assume an annual utility rate increase of <TooltipText text={`${params.annualBillIncrease}%`} title=\"Utility Inflation\" content=\"The assumed annual percentage increase in your utility company's electricity rates over the 25-year period.\" />{params.isFinanced ? `, a loan term of ${params.loanTermYears} years at ${params.loanInterestRate}% interest,` : ''} and are subject to weather, exact site conditions, and usage behavior.\n      </p>",
    replacement: `      <p className="mt-4 text-xs text-slate-500 border-t border-slate-800/50 pt-4">
        These projections assume an annual utility rate increase of <TooltipText text={\`\${params.annualBillIncrease}%\`} title="Utility Inflation" content="The assumed annual percentage increase in your utility company's electricity rates over the 25-year period." />, {
          params.hasSolarEfficiency ? (params.efficiencyMode === 'flat' ? \`\${params.solarEfficiency}% solar efficiency\` : 'a custom monthly solar efficiency profile') : '100% solar efficiency'
        }, {
          params.hasMaintenance ? \`\${formatCurrency(params.annualMaintenanceCost)} / year in maintenance\` : '$0 / year in maintenance'
        }, {
          (params.hasIncentives && (results.systemCost - results.netCost) > 0) ? \`\${formatCurrency(results.systemCost - results.netCost, 0)} total tax credits and rebates\` : 'no taxes or credits'
        }, and {
          params.isFinanced ? \`a \${params.loanTermYears}-year loan at \${params.loanInterestRate}% interest\` : 'no loans'
        }. These values are subject to weather, exact site conditions, and usage behavior.
      </p>`
  }
];

for (const r of replacements) {
  code = code.replace(r.target, r.replacement);
}

fs.writeFileSync('src/components/ExecutiveSummary.tsx', code);
