import React from 'react';
import { SolarParams, RoiResults } from '../types';
import { formatCurrency, SOLAR_YIELD_KWH_PER_KW, GRID_CO2_TONS_PER_KWH, HOME_ELECTRIC_CO2_TONS } from '../utils';
import { RoiChart } from './Chart';
import { RenewabilityChart } from './RenewabilityChart';
import { OutageChart } from './OutageChart';
import { MonthlyBalanceChart } from './MonthlyBalanceChart';
import { ExecutiveSummary } from './ExecutiveSummary';
import { Equations } from './Equations';
import { ScenarioCompare } from './Scenarios';
import { ChaliceIcon } from './ChaliceIcon';
import { Goal, Suggestion } from '../goals';
import { Compared } from '../scenarios';
import { PARAM_INFO } from '../paramInfo';

export const REPO_URL = 'https://github.com/benczech212/uuc_solar_calculator';
export const ACCESS_URL = `${REPO_URL}/issues/new?title=${encodeURIComponent('Request access / question about the solar calculator')}&body=${encodeURIComponent('Who I am and what I would like to do (for example: review the math, suggest a change, get write access):\n\n')}`;
export const SITE_URL = 'https://benczech212.github.io/uuc_solar_calculator/';

interface PdfReportProps {
  params: SolarParams;
  results: RoiResults;
  vendorName?: string;
  goal: Goal;
  suggestions: Suggestion[];
  current: Compared;
  scenarios: Compared[];
}

// Each block is captured on its own and laid onto Letter pages by pdfExport, which
// starts a new page instead of splitting a block where it can.
function Block({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section data-pdf-block className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      {title && <h2 className="text-xl font-semibold text-white mb-5">{title}</h2>}
      {children}
    </section>
  );
}

function Kpi({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-mono mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  // data-pdf-link marks it so the exported PDF gets a clickable area here too.
  return <a href={href} data-pdf-link={href} className="text-sky-300 underline break-all" target="_blank" rel="noreferrer">{children}</a>;
}

const SETTINGS: { group: string; rows: (p: SolarParams, r: RoiResults) => [string, string][] }[] = [
  {
    group: 'Solar system',
    rows: (p, r) => [
      ['How entered', p.inputMode === 'detailed' ? 'By panel' : 'Total size and price'],
      ...(p.inputMode === 'detailed'
        ? [['Panels', `${p.numberOfPanels} × ${p.panelWattage} W`], ['Installed cost per watt', `$${p.costPerWatt.toFixed(2)}`]] as [string, string][]
        : [['System size', `${p.totalSystemSizeKw} kW`], ['Total installed cost', formatCurrency(p.totalGrossCost)]] as [string, string][]),
      ['Resulting size and price', `${r.systemSizeKW.toFixed(1)} kW, ${formatCurrency(r.systemCost)} before credits`],
      ['Seasonal sunshine', p.useSeasonalGenerationCurve ? 'On' : 'Off'],
      ['Production adjustment', p.hasSolarEfficiency ? (p.efficiencyMode === 'flat' ? `${p.solarEfficiency}%` : `By month: ${p.monthlyEfficiencyProfile.join(', ')}%`) : 'Off'],
    ],
  },
  {
    group: 'Energy use and rates',
    rows: (p, r) => [
      ['Usage entered as', p.usageMode === 'flat' ? 'Same every month' : p.usageMode === 'monthly' ? 'Month by month' : `From ${p.historicalBills?.length ?? 0} bills (${p.historicalCompMode === 'recent' ? 'latest year' : 'average'})`],
      ['Yearly use', `${Math.round(r.annualUsage).toLocaleString()} kWh`],
      ...(p.usageMode === 'monthly' ? [['Monthly use (kWh)', p.monthlyUsageProfile.map(v => Math.round(v).toLocaleString()).join(', ')]] as [string, string][] : []),
      ['Electricity rate', `$${r.effectiveUtilityRate.toFixed(3)}/kWh`],
      ['Sell-back rate', `$${p.sellBackRate.toFixed(3)}/kWh${p.hasLinkedSellBackRate ? ' (same as the rate)' : ''}`],
      ['Yearly rate increase', `${p.annualBillIncrease}%`],
      ['Grid renewable share', `${p.gridRenewablePercentage}%`],
      ['Energy upgrades counted', p.useReducedEnergyProfile ? `${p.reductionProjects?.filter(x => x.enabled).length ?? 0} projects` : 'No'],
    ],
  },
  {
    group: 'Options',
    rows: (p) => {
      const extra = (p.lumpSumPayments ?? []).filter(l => l.enabled !== false);
      return [
        ['Tax credits', p.hasIncentives ? `${p.federalTaxCreditPercent}% federal${p.stateRebateAmount ? ` + ${formatCurrency(p.stateRebateAmount)} rebate` : ''}` : 'Off'],
        ['Loan', p.isFinanced ? `${p.loanTermYears} years at ${p.loanInterestRate}%, ${formatCurrency(p.downPayment)} down${extra.length ? `; extra payments: ${extra.map(l => `${formatCurrency(l.amount)} in year ${l.year}`).join(', ')}` : ''}` : 'Off (paid in cash)'],
        ['Battery', p.hasBattery ? `${p.batteryCapacityKwh} kWh at $${p.batteryCostPerKwh}/kWh` : 'Off'],
        ['Maintenance', p.hasMaintenance ? `${formatCurrency(p.annualMaintenanceCost)} a year` : 'Off'],
      ];
    },
  },
];

// The printable report: the answer first, then the details, then the full math.
export const PdfReport: React.FC<PdfReportProps> = ({ params, results, vendorName, goal, suggestions, current, scenarios }) => {
  const pays = results.paybackPeriod > 0 && results.paybackPeriod <= 25;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div id="pdf-report-container" className="w-[1000px] bg-[#020617] text-slate-200 p-12 flex flex-col gap-6 mx-auto shrink-0 shadow-2xl ring-1 ring-white/10 my-auto">
      <section data-pdf-block className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <ChaliceIcon className="w-12 h-12 text-amber-500" />
          <div>
            <h1 className="text-3xl font-semibold text-white">UUC Solar Report</h1>
            <p className="text-slate-400">Unitarian Universalists of Clearwater · {date}</p>
            <p className="text-slate-500 text-sm">{vendorName ? `Based on the ${vendorName} quote` : 'Based on a custom system'} · made with the UUC solar calculator</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">System</p>
          <p className="text-2xl text-amber-400 font-mono">{results.systemSizeKW.toFixed(1)} kW</p>
        </div>
      </section>

      <Block title="At a glance">
        <div className="grid grid-cols-4 gap-3">
          <Kpi label={pays ? (params.isFinanced ? 'Savings pass loan payments in' : 'Pays for itself in') : 'Payback'} value={pays ? `${results.paybackPeriod.toFixed(1)} years` : 'Not within 25 years'} tone="text-amber-400" />
          <Kpi label="25-year net savings" value={formatCurrency(results.total25YearSavings)} tone={results.total25YearSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          <Kpi label="25-year return" value={`${results.roiPercentage.toFixed(0)}%`} tone="text-emerald-400" />
          <Kpi label="First-year savings" value={formatCurrency(results.yearOneSavings)} tone="text-emerald-400" />
          <Kpi label="Price before credits" value={formatCurrency(results.systemCost)} />
          <Kpi label="Cost after credits" value={formatCurrency(results.netCost)} />
          <Kpi label="CO₂ avoided per year" value={`${results.co2Impact.co2SavedTonsPerYear.toFixed(1)} t`} tone="text-sky-400" />
          <Kpi label="Clean-power share" value={`${results.co2Impact.currentRenewablePercent.toFixed(0)}% → ${results.co2Impact.newRenewablePercent.toFixed(0)}%`} tone="text-emerald-400" />
        </div>
      </Block>

      <section data-pdf-block><ExecutiveSummary params={params} results={results} vendorName={vendorName} /></section>

      <Block title={`Goal: ${goal.label.toLowerCase()}`}>
        <p className="text-slate-300 mb-3">{goal.description} Right now: <span className="font-mono text-white">{goal.format(goal.value(results, params))}</span> {goal.short}.</p>
        {suggestions.length ? (
          <>
            <p className="text-sm text-slate-400 mb-2">Changes the calculator found that would improve it most:</p>
            <ul className="space-y-1.5">
              {suggestions.map(s => (
                <li key={s.id} className="flex justify-between gap-4 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2">
                  <span><span className="text-slate-100">{s.title}</span> <span className="text-slate-500 text-sm">· {s.detail}</span></span>
                  <span className="font-mono text-emerald-400 whitespace-nowrap">{goal.formatDelta(goal.higherIsBetter ? s.gain : -s.gain)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : <p className="text-sm text-slate-400">None of the changes the calculator tries would improve this; the current setup is already the best of those.</p>}
      </Block>

      <Block title="Savings over time"><RoiChart data={results.chartData} paybackPeriod={results.paybackPeriod} /></Block>

      {scenarios.length > 0 && (
        <Block title="Scenarios compared"><ScenarioCompare current={current} others={scenarios} goal={goal} print /></Block>
      )}

      <Block title="Monthly balance"><MonthlyBalanceChart data={results.monthlyEnergyData} results={results} /></Block>
      <Block title="Energy mix"><RenewabilityChart data={results.monthlyEnergyData} gridRenewablePercent={params.gridRenewablePercentage} /></Block>
      {params.hasBattery && <Block title="Outage backup"><OutageChart data={results.outageResilience} /></Block>}

      <Block title="Settings used">
        <div className="grid grid-cols-1 gap-5">
          {SETTINGS.map(g => (
            <div key={g.group} data-pdf-row>
              <h3 className="text-sm uppercase tracking-wider text-slate-500 mb-1">{g.group}</h3>
              <table className="w-full text-sm">
                <tbody>
                  {g.rows(params, results).map(([k, v]) => (
                    <tr key={k} className="border-t border-slate-800/60">
                      <td className="py-1.5 pr-4 text-slate-400 w-64 align-top">{k}</td>
                      <td className="py-1.5 text-slate-100">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Block>

      <section data-pdf-block data-pdf-page-break className="rounded-2xl border-2 border-dashed border-amber-500/40 p-8 text-center space-y-3">
        <h2 className="text-2xl font-semibold text-amber-300">For the math nerds</h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          That’s the whole story. The rest is just for the math nerds who want to know how all of this was calculated:
          every formula with these numbers filled in, where each default came from, and what the model does and doesn’t include.
        </p>
        <div className="text-sm text-slate-400 space-y-1">
          <p>Try it yourself: <Link href={SITE_URL}>{SITE_URL}</Link></p>
          <p>The code is open: <Link href={REPO_URL}>{REPO_URL}</Link></p>
          <p>To ask a question, suggest a change or request access to the GitHub repository: <Link href={ACCESS_URL}>{`${REPO_URL}/issues/new`}</Link></p>
        </div>
      </section>

      <Block title="Every formula"><Equations params={params} results={results} printMode /></Block>

      <Block title="Where the numbers come from">
        <div className="space-y-3">
          {Object.entries(PARAM_INFO).map(([key, info]) => (
            <div key={key} data-pdf-row className="border-t border-slate-800/60 pt-3 first:border-0 first:pt-0">
              <p className="text-sm text-slate-100">{info.what}</p>
              <p className="text-sm text-slate-400"><span className="text-amber-300">Default: </span>{info.why}</p>
              {info.sources?.length ? (
                <p className="text-xs text-slate-500">
                  Sources: {info.sources.map((s, i) => (
                    <React.Fragment key={s.label}>{i > 0 && '; '}{s.label}{s.url && <> (<Link href={s.url}>{s.url}</Link>)</>}</React.Fragment>
                  ))}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Block>

      <Block title="What the model includes, and what it doesn’t">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
          <li>Solar output: {SOLAR_YIELD_KWH_PER_KW.toLocaleString()} kWh per kW of panels per year{params.useSeasonalGenerationCurve ? ', spread across the year on a seasonal curve' : ', the same every month'}.</li>
          <li>Each month, solar first covers that month’s use; the rest is sent to the grid and credited at the sell-back rate. Credits carry forward.</li>
          <li>Electricity prices rise by the yearly increase you set; savings are worked out year by year for 25 years.</li>
          <li>The federal credit, when on, is received in year 2. Loans are paid monthly at the rate and term set; upkeep is a yearly cost.</li>
          <li>CO₂: {GRID_CO2_TONS_PER_KWH} t per kWh of fossil grid power avoided (EPA eGRID, Florida). Homes comparison: {HOME_ELECTRIC_CO2_TONS} t per home per year (EPA).</li>
          <li className="text-amber-200">Not included: Florida pays leftover credits at year-end at a low as-available rate, so a system bigger than yearly use is worth less than shown.</li>
          <li className="text-amber-200">Not included: panels slowly lose output (about 0.5–0.75% a year); use the production adjustment to allow for it.</li>
          <li className="text-amber-200">With a loan, “payback” is when savings pass the payments made so far, not the full price.</li>
          <li>Estimates only: confirm figures with installers and a tax advisor before deciding.</li>
        </ul>
      </Block>
    </div>
  );
};
