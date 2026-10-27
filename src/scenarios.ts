// Scenarios: named snapshots of the settings, kept in this browser, that can be
// compared against the current setup and each other.
import { SolarParams, RoiResults } from './types';
import { formatCurrency } from './utils';
import { Goal } from './goals';

export interface Scenario {
  id: string;
  name: string;
  params: SolarParams;
  compare: boolean;
  createdAt: number;
}

const KEY = 'UUC_SOLAR_SCENARIOS';

export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Scenario[]) : [];
  } catch {
    return [];
  }
}

export function storeScenarios(list: Scenario[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage blocked: kept for this visit only */ }
}

export const SCENARIO_COLORS = ['#38bdf8', '#c084fc', '#f472b6', '#2dd4bf'];
export const CURRENT_COLOR = '#f59e0b';

export interface Compared { name: string; color: string; params: SolarParams; results: RoiResults }

const yrs = (r: RoiResults) => (r.paybackPeriod > 0 && r.paybackPeriod <= 25 ? r.paybackPeriod : null);
const upfront = (r: RoiResults, p: SolarParams) => (p.isFinanced ? Math.min(p.downPayment, r.systemCost) : r.systemCost);

// The setting differences that explain why two setups come out differently.
export function describeDiff(a: Compared, b: Compared): string[] {
  const pa = a.params, pb = b.params, ra = a.results, rb = b.results;
  const out: string[] = [];
  if (Math.abs(ra.systemSizeKW - rb.systemSizeKW) > 0.05 || Math.abs(ra.systemCost - rb.systemCost) > 1) {
    out.push(`System: ${rb.systemSizeKW.toFixed(1)} kW for ${formatCurrency(rb.systemCost)} (vs ${ra.systemSizeKW.toFixed(1)} kW for ${formatCurrency(ra.systemCost)})`);
  }
  if (pa.hasIncentives !== pb.hasIncentives || (pb.hasIncentives && (pa.federalTaxCreditPercent !== pb.federalTaxCreditPercent || pa.stateRebateAmount !== pb.stateRebateAmount))) {
    out.push(pb.hasIncentives ? `Tax credit ${pb.federalTaxCreditPercent}%${pb.stateRebateAmount ? ` + ${formatCurrency(pb.stateRebateAmount)} rebate` : ''}` : 'No tax credits');
  }
  if (pa.isFinanced !== pb.isFinanced || (pb.isFinanced && (pa.loanTermYears !== pb.loanTermYears || pa.loanInterestRate !== pb.loanInterestRate || pa.downPayment !== pb.downPayment))) {
    out.push(pb.isFinanced ? `Loan: ${pb.loanTermYears} yrs at ${pb.loanInterestRate}%, ${formatCurrency(pb.downPayment)} down` : 'Paid in cash');
  }
  if (pa.hasBattery !== pb.hasBattery || (pb.hasBattery && pa.batteryCapacityKwh !== pb.batteryCapacityKwh)) {
    out.push(pb.hasBattery ? `Battery: ${pb.batteryCapacityKwh} kWh` : 'No battery');
  }
  if (pa.hasMaintenance !== pb.hasMaintenance || (pb.hasMaintenance && pa.annualMaintenanceCost !== pb.annualMaintenanceCost)) {
    out.push(pb.hasMaintenance ? `Maintenance ${formatCurrency(pb.annualMaintenanceCost)}/yr` : 'No maintenance cost');
  }
  if (Math.abs(ra.effectiveUtilityRate - rb.effectiveUtilityRate) > 0.0005) out.push(`Electricity rate $${rb.effectiveUtilityRate.toFixed(3)}/kWh`);
  if (pa.annualBillIncrease !== pb.annualBillIncrease) out.push(`Rates rise ${pb.annualBillIncrease}%/yr`);
  if (Math.abs(ra.annualUsage - rb.annualUsage) > 1) out.push(`Use ${Math.round(rb.annualUsage).toLocaleString()} kWh/yr`);
  if (pa.hasSolarEfficiency !== pb.hasSolarEfficiency || (pb.hasSolarEfficiency && pa.solarEfficiency !== pb.solarEfficiency)) {
    out.push(pb.hasSolarEfficiency ? `Output ${pb.efficiencyMode === 'flat' ? `${pb.solarEfficiency}%` : 'adjusted by month'}` : 'Standard output');
  }
  if (pa.gridRenewablePercentage !== pb.gridRenewablePercentage) out.push(`Grid ${pb.gridRenewablePercentage}% renewable`);
  return out;
}

// Plain sentences comparing one setup (b) against a reference (a).
export function compareSentences(a: Compared, b: Compared): string[] {
  const ra = a.results, rb = b.results;
  const s: string[] = [];
  const dSave = rb.total25YearSavings - ra.total25YearSavings;
  s.push(Math.abs(dSave) < 500
    ? `About the same 25-year savings (${formatCurrency(rb.total25YearSavings)}).`
    : `Saves ${formatCurrency(Math.abs(dSave))} ${dSave > 0 ? 'more' : 'less'} over 25 years (${formatCurrency(rb.total25YearSavings)} vs ${formatCurrency(ra.total25YearSavings)}).`);
  const pa = yrs(ra), pb = yrs(rb);
  if (pa !== null && pb !== null) {
    const d = pb - pa;
    s.push(Math.abs(d) < 0.1 ? `Pays back in about the same time (${pb.toFixed(1)} years).` : `Pays back ${Math.abs(d).toFixed(1)} years ${d < 0 ? 'sooner' : 'later'} (${pb.toFixed(1)} vs ${pa.toFixed(1)} years).`);
  } else if (pb !== null) s.push(`Pays back in ${pb.toFixed(1)} years, where the other never does within 25 years.`);
  else if (pa !== null) s.push(`Never pays back within 25 years, where the other does in ${pa.toFixed(1)}.`);
  if (a.params.isFinanced !== b.params.isFinanced && (pa !== null || pb !== null)) {
    s[s.length - 1] += ' (Only one has a loan, and loan payback counts only payments made so far, so compare these with care.)';
  }
  const dUp = upfront(rb, b.params) - upfront(ra, a.params);
  if (Math.abs(dUp) >= 500) s.push(`Needs ${formatCurrency(Math.abs(dUp))} ${dUp > 0 ? 'more' : 'less'} cash up front (${formatCurrency(upfront(rb, b.params))}).`);
  const dRoi = rb.roiPercentage - ra.roiPercentage;
  if (Math.abs(dRoi) >= 1) s.push(`Its 25-year return is ${Math.abs(dRoi).toFixed(0)} points ${dRoi > 0 ? 'higher' : 'lower'} (${rb.roiPercentage.toFixed(0)}% vs ${ra.roiPercentage.toFixed(0)}%).`);
  const dCo2 = rb.co2Impact.co2SavedTonsPerYear - ra.co2Impact.co2SavedTonsPerYear;
  if (Math.abs(dCo2) >= 0.1) s.push(`Avoids ${Math.abs(dCo2).toFixed(1)} ${dCo2 > 0 ? 'more' : 'fewer'} tons of CO₂ a year.`);
  return s;
}

// Which of the setups does best on the goal, in one sentence.
export function goalVerdict(goal: Goal, all: Compared[]): string {
  if (all.length < 2) return '';
  const val = (c: Compared) => goal.value(c.results, c.params);
  const sorted = [...all].sort((x, y) => (goal.higherIsBetter ? val(y) - val(x) : val(x) - val(y)));
  const best = sorted[0], next = sorted[1];
  const gap = Math.abs(val(best) - val(next));
  if (gap < (goal.key === 'payback' || goal.key === 'co2' ? 0.05 : goal.key === 'roi' ? 0.5 : 100)) {
    return `For ${goal.label.toLowerCase()}, ${best.name} and ${next.name} are about even (${goal.format(val(best))}).`;
  }
  return `For ${goal.label.toLowerCase()}, ${best.name} comes out ahead: ${goal.format(val(best))} ${goal.short}, ${goal.formatDelta(goal.higherIsBetter ? gap : -gap).replace(/^[+−]/, '')} better than ${next.name}.`;
}

export const METRICS: { label: string; get: (r: RoiResults, p: SolarParams) => number; fmt: (v: number) => string; higherIsBetter?: boolean; comparable?: (v: number) => boolean }[] = [
  { label: 'System size', get: (r) => r.systemSizeKW, fmt: (v) => `${v.toFixed(1)} kW` },
  { label: 'Price before credits', get: (r) => r.systemCost, fmt: formatCurrency, higherIsBetter: false },
  { label: 'Cost after credits', get: (r) => r.netCost, fmt: formatCurrency, higherIsBetter: false },
  { label: 'Cash up front', get: upfront, fmt: formatCurrency, higherIsBetter: false },
  { label: 'First-year savings', get: (r) => r.yearOneSavings, fmt: formatCurrency, higherIsBetter: true },
  { label: 'Payback', get: (r) => yrs(r) ?? 99, fmt: (v) => (v >= 99 ? 'never' : `${v.toFixed(1)} yrs`), higherIsBetter: false, comparable: (v) => v < 99 },
  { label: '25-year net savings', get: (r) => r.total25YearSavings, fmt: formatCurrency, higherIsBetter: true },
  { label: '25-year return', get: (r) => r.roiPercentage, fmt: (v) => `${v.toFixed(0)}%`, higherIsBetter: true },
  { label: 'CO₂ avoided', get: (r) => r.co2Impact.co2SavedTonsPerYear, fmt: (v) => `${v.toFixed(1)} t/yr`, higherIsBetter: true },
  { label: 'Clean-power share', get: (r) => r.co2Impact.newRenewablePercent, fmt: (v) => `${v.toFixed(0)}%`, higherIsBetter: true },
];

