import React from 'react';
import { Info } from 'lucide-react';
import { SolarParams, RoiResults } from '../types';
import { formatCurrency } from '../utils';

interface ExecutiveSummaryProps {
  params: SolarParams;
  results: RoiResults;
  vendorName?: string;
  onNavigateToEquation?: (sectionKey: string, e?: React.MouseEvent) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ params, results, vendorName, onNavigateToEquation }) => {
  const companyStr = vendorName ? ` ${vendorName} to provide` : '';
  const costPerWatt = params.inputMode === 'total' 
    ? (params.totalGrossCost / (params.totalSystemSizeKw * 1000) || 0)
    : params.costPerWatt;
    
  const netProfit = results.total25YearSavings - results.netCost;
  const homesEquivalent = (results.co2Impact.co2SavedTonsPerYear / 4.515).toFixed(1); // approx 4.515 tons per US home energy use

  // Find peak surplus and deficit months dynamically
  const balanceData = results.monthlyEnergyData.map(m => {
    const gen = m.generation !== undefined ? m.generation : results.annualGeneration / 12;
    const use = m.usage !== undefined ? m.usage : (m.solarConsumed + m.gridRenewable + m.gridNonRenewable);
    return {
      month: m.monthName,
      balance: gen - use
    };
  });
  
  const peakSurplusObj = [...balanceData].sort((a, b) => b.balance - a.balance)[0];
  const peakDeficitObj = [...balanceData].sort((a, b) => a.balance - b.balance)[0];
  
  const peakSurplusMonth = peakSurplusObj ? peakSurplusObj.month : 'N/A';
  const peakDeficitMonth = peakDeficitObj ? peakDeficitObj.month : 'N/A';

  const TooltipText = ({ text, title, content, sectionKey }: { text: React.ReactNode, title: string, content: string, sectionKey?: string }) => (
    <span 
      onClick={(e) => {
        if (sectionKey && onNavigateToEquation) {
          onNavigateToEquation(sectionKey, e);
        }
      }}
      className={`group relative inline-block border-b border-amber-500/30 cursor-pointer text-white hover:text-amber-400 hover:border-amber-400 transition-colors duration-150`}
    >
      {text}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 transition-opacity group-hover:opacity-100 z-50 text-center">
        <span className="block bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-3 shadow-xl">
          <strong className="block text-amber-500 mb-1">{title}</strong>
          {content}
          {sectionKey && (
            <span className="block mt-2 text-[10px] text-amber-500/70 uppercase tracking-wider font-mono">
              Click to view formula
            </span>
          )}
        </span>
        <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-700"></span>
      </span>
    </span>
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 leading-relaxed text-slate-400 font-sans shadow-sm">
      <p>
        Choosing{companyStr} a <TooltipText text={`${results.systemSizeKW.toFixed(1)} kW system`} title="System Size" content="The total peak direct current (DC) power of all solar panels combined." sectionKey="cost" /> at <TooltipText text={`${formatCurrency(costPerWatt, 2)}/W`} title="Cost Per Watt" content="The gross cost of the system divided by the total wattage. This is a common industry metric for comparing solar quotes." sectionKey="cost" /> for a total gross cost of <TooltipText text={formatCurrency(params.inputMode === 'detailed' ? (results.systemSizeKW * 1000 * params.costPerWatt) : params.totalGrossCost)} title="Gross Cost" content="The total upfront cost of the system before any incentives, tax credits, or rebates are applied." sectionKey="cost" /> will break even after <TooltipText text={`${results.paybackPeriod.toFixed(1)} years`} title="Break-even / Payback Period" content="The point in time when cumulative energy savings equal the net cost of the system (Gross cost - Incentives)." sectionKey="payback" /> and net a total profit of <TooltipText text={formatCurrency(netProfit)} title="25-Year Net Profit" content="The cumulative energy savings over 25 years minus the initial net cost of the system. (Savings - Net Cost)" sectionKey="projection" /> over 25 years, representing an ROI of <TooltipText text={`${results.roiPercentage.toFixed(1)}%`} title="Return on Investment (ROI)" content="The percentage return on your initial net investment after 25 years. ((Net Profit) / Net Cost) * 100." sectionKey="25yr_roi" />. We expect to export and sell <TooltipText text={`${results.annualGridSales.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh/year`} title="Grid Sales" content="The total surplus solar energy produced annually and dispatched back to the grid." sectionKey="gridsales" /> with a peak surplus in <span className="text-emerald-400 font-semibold font-mono">{peakSurplusMonth}</span>, <TooltipText text={`${results.annualBatteryDraw.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh`} title="Battery Utilization" content="The estimated total storage energy consumed directly from the high-capacity battery bank to offset utility power." sectionKey="battery_utilization" /> battery utilization, and <TooltipText text={`${results.annualGridPurchase.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh`} title="Grid Purchase needed" content="The amount of energy that must still be purchased annually from the utility company because solar generation and battery reserves are depleted at that hour." sectionKey="grid_purchase" /> grid purchase needed with a peak deficit month in <span className="text-rose-400 font-semibold font-mono">{peakDeficitMonth}</span>.
      </p>
      <p className="mt-4">
        This installation will increase your renewable energy mix from <TooltipText text={`${results.co2Impact.currentRenewablePercent.toFixed(1)}%`} title="Current Mix" content="The percentage of your current electricity derived from renewable sources on the grid." sectionKey="co2" /> to <TooltipText text={`${results.co2Impact.newRenewablePercent.toFixed(1)}%`} title="New Mix" content="Your overall grid-plus-solar energy usage that comes from renewable sources." sectionKey="co2" />, reducing roughly <TooltipText text={`${results.co2Impact.co2SavedTonsPerYear.toFixed(1)} tons`} title="CO2 Reduction" content="The estimated tons of carbon dioxide emissions avoided annually by generating your own renewable energy." sectionKey="co2" /> of CO2 annually (the equivalent of <TooltipText text={`${homesEquivalent} homes`} title="Equivalent Homes" content="The number of average US homes' annual electricity use offset by this CO2 reduction." sectionKey="co2homes" />).
      </p>
      <p className="mt-4 text-xs text-slate-500 border-t border-slate-800/50 pt-4">
        These projections assume an annual utility rate increase of <TooltipText text={`${params.annualBillIncrease}%`} title="Utility Inflation" content="The assumed annual percentage increase in your utility company's electricity rates over the 25-year period." sectionKey="projection" />, {
          params.hasSolarEfficiency ? (params.efficiencyMode === 'flat' ? `${params.solarEfficiency}% solar efficiency` : 'a custom monthly solar efficiency profile') : '100% solar efficiency'
        }, {
          params.hasMaintenance ? `${formatCurrency(params.annualMaintenanceCost)} / year in maintenance` : '$0 / year in maintenance'
        }, {
          (params.hasIncentives && (results.systemCost - results.netCost) > 0) ? `${formatCurrency(results.systemCost - results.netCost, 0)} total tax credits and rebates` : 'no taxes or credits'
        }, and {
          params.isFinanced ? `a ${params.loanTermYears}-year loan at ${params.loanInterestRate}% interest` : 'no loans'
        }. These values are subject to weather, exact site conditions, and usage behavior.
      </p>
    </div>
  );
};
