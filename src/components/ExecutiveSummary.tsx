import React from 'react';
import { SolarParams, RoiResults } from '../types';
import { formatCurrency, HOME_ELECTRIC_CO2_TONS } from '../utils';

interface ExecutiveSummaryProps {
  params: SolarParams;
  results: RoiResults;
  vendorName?: string;
  onNavigateToEquation?: (sectionKey: string, e?: React.MouseEvent) => void;
}

// A number in the text; clickable to its formula when the summary is on screen.
function Term({ children, eq, onNavigate }: { children: React.ReactNode; eq: string; onNavigate?: ExecutiveSummaryProps['onNavigateToEquation'] }) {
  if (!onNavigate) return <strong className="text-white font-semibold">{children}</strong>;
  return (
    <button type="button" onClick={(e) => onNavigate(eq, e)} title="See how this is worked out"
      className="text-white font-semibold border-b border-amber-500/40 hover:text-amber-300 hover:border-amber-300 transition-colors">
      {children}
    </button>
  );
}

// "In words": the results as a short plain-English summary. Every figure comes straight
// from the model results, so it always matches the numbers shown elsewhere.
export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ params, results, vendorName, onNavigateToEquation: nav }) => {
  const pays = results.paybackPeriod > 0 && results.paybackPeriod <= 25;
  const credits = results.systemCost - results.netCost;
  const months = results.monthlyEnergyData.map(m => ({
    month: m.monthName,
    balance: (m.generation ?? results.annualGeneration / 12) - (m.usage ?? m.solarConsumed + m.gridRenewable + m.gridNonRenewable),
  }));
  const best = [...months].sort((a, b) => b.balance - a.balance)[0];
  const worst = [...months].sort((a, b) => a.balance - b.balance)[0];
  const homes = (results.co2Impact.co2SavedTonsPerYear / HOME_ELECTRIC_CO2_TONS).toFixed(1);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 leading-relaxed text-slate-300 space-y-4">
      <p>
        A <Term eq="cost" onNavigate={nav}>{results.systemSizeKW.toFixed(1)} kW</Term> system{vendorName ? <> from {vendorName}</> : null} costs{' '}
        <Term eq="cost" onNavigate={nav}>{formatCurrency(results.systemCost)}</Term> before credits
        {params.hasIncentives && credits > 0 ? <>, or <Term eq="net" onNavigate={nav}>{formatCurrency(results.netCost)}</Term> after {formatCurrency(credits)} in tax credits and rebates</> : null}.
        {' '}It would make about <Term eq="yearlygen" onNavigate={nav}>{Math.round(results.annualGeneration).toLocaleString()} kWh</Term> a year,
        covering roughly {Math.round(results.systemOffset)}% of UUC’s electricity use.
      </p>
      <p>
        In the first year the electric bill drops by about <Term eq="yr1savings" onNavigate={nav}>{formatCurrency(results.yearOneSavings)}</Term>.{' '}
        {pays
          ? <>{params.isFinanced ? 'Savings pass the loan payments made so far after' : 'The system pays for itself in'} <Term eq="payback" onNavigate={nav}>{results.paybackPeriod.toFixed(1)} years</Term>, </>
          : <>It does not pay for itself within the panels’ 25-year life, </>}
        and over 25 years it comes out <Term eq="projection" onNavigate={nav}>{formatCurrency(Math.abs(results.total25YearSavings))} {results.total25YearSavings >= 0 ? 'ahead' : 'behind'}</Term> after
        everything paid, a <Term eq="25yr_roi" onNavigate={nav}>{results.roiPercentage.toFixed(0)}%</Term> return.
      </p>
      <p>
        Solar makes the most extra power in {best?.month ?? '—'} and falls furthest short in {worst?.month ?? '—'}; over the year about{' '}
        <Term eq="gridsales" onNavigate={nav}>{Math.round(results.annualGridSales).toLocaleString()} kWh</Term> goes back to the grid as credit and{' '}
        <Term eq="grid_purchase" onNavigate={nav}>{Math.round(results.annualGridPurchase).toLocaleString()} kWh</Term> is still bought
        {params.hasBattery ? <>, with <Term eq="battery_utilization" onNavigate={nav}>{Math.round(results.annualBatteryDraw).toLocaleString()} kWh</Term> drawn from the battery</> : null}.
      </p>
      <p>
        UUC’s clean-power share would rise from <Term eq="renewable_mix" onNavigate={nav}>{results.co2Impact.currentRenewablePercent.toFixed(0)}%</Term> to{' '}
        <Term eq="renewable_mix" onNavigate={nav}>{results.co2Impact.newRenewablePercent.toFixed(0)}%</Term>, avoiding about{' '}
        <Term eq="co2" onNavigate={nav}>{results.co2Impact.co2SavedTonsPerYear.toFixed(1)} tons</Term> of CO₂ a year, about as much as{' '}
        <Term eq="co2homes" onNavigate={nav}>{homes} homes’</Term> electricity.
      </p>
      <p className="text-xs text-slate-500 border-t border-slate-800/60 pt-3">
        Assumes electricity prices rise {params.annualBillIncrease}% a year,{' '}
        {params.hasSolarEfficiency ? (params.efficiencyMode === 'flat' ? `output at ${params.solarEfficiency}% of typical` : 'a custom monthly output profile') : 'typical output'},{' '}
        {params.hasMaintenance ? `${formatCurrency(params.annualMaintenanceCost)} a year of upkeep` : 'no upkeep cost'}, and{' '}
        {params.isFinanced ? `a ${params.loanTermYears}-year loan at ${params.loanInterestRate}%` : 'paying cash'}.
        Real results depend on weather, the site and how the building is used.
      </p>
    </div>
  );
};
