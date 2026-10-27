// Goals: what the user wants to optimise, how each input moves it, and which changes
// would move it most. Everything here re-runs calculateRoi on modified settings.
import { SolarParams, RoiResults } from './types';
import { calculateRoi, formatCurrency, getActiveEnergyParams } from './utils';

export type GoalKey = 'savings' | 'roi' | 'payback' | 'co2' | 'upfront';

export interface Goal {
  key: GoalKey;
  label: string;
  short: string;
  description: string;
  higherIsBetter: boolean;
  value: (r: RoiResults, p: SolarParams) => number;
  format: (v: number) => string;
  formatDelta: (d: number) => string;
}

const NO_PAYBACK = 40; // stands in for "never pays back" so it ranks as worst

const signed = (d: number, f: (v: number) => string) => `${d > 0 ? '+' : '−'}${f(Math.abs(d))}`;

export const GOALS: Goal[] = [
  {
    key: 'savings', label: 'Most money saved', short: '25-year savings',
    description: 'The biggest total savings over the panels’ 25-year life, after everything paid.',
    higherIsBetter: true,
    value: (r) => r.total25YearSavings,
    format: (v) => formatCurrency(v),
    formatDelta: (d) => signed(d, formatCurrency),
  },
  {
    key: 'roi', label: 'Best return', short: '25-year return',
    description: 'The most saved for each dollar spent. Favors efficient, right-sized systems.',
    higherIsBetter: true,
    value: (r) => r.roiPercentage,
    format: (v) => `${v.toFixed(0)}%`,
    formatDelta: (d) => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(0)} pts`,
  },
  {
    key: 'payback', label: 'Fastest payback', short: 'payback time',
    description: 'Get back what you put in as soon as possible.',
    higherIsBetter: false,
    value: (r) => (r.paybackPeriod > 0 ? Math.min(r.paybackPeriod, NO_PAYBACK) : NO_PAYBACK),
    format: (v) => (v >= NO_PAYBACK ? 'never' : `${v.toFixed(1)} yrs`),
    formatDelta: (d) => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} yrs`,
  },
  {
    key: 'co2', label: 'Lowest carbon', short: 'CO₂ avoided',
    description: 'Cut the most carbon emissions from UUC’s electricity.',
    higherIsBetter: true,
    value: (r) => r.co2Impact.co2SavedTonsPerYear,
    format: (v) => `${v.toFixed(1)} t/yr`,
    formatDelta: (d) => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} t/yr`,
  },
  {
    key: 'upfront', label: 'Least cash up front', short: 'cash up front',
    description: 'Keep the money UUC has to find at the start as low as possible.',
    higherIsBetter: false,
    value: (r, p) => (p.isFinanced ? Math.min(p.downPayment, r.systemCost) : r.systemCost),
    format: (v) => formatCurrency(v),
    formatDelta: (d) => signed(d, formatCurrency),
  },
];

export const goalByKey = (k: GoalKey) => GOALS.find(g => g.key === k)!;

// Same rules as the app's updateParam: a linked sell-back rate follows the electricity rate.
export function withParams(p: SolarParams, changes: Partial<SolarParams>): SolarParams {
  const next = { ...p, ...changes };
  if (next.hasLinkedSellBackRate) next.sellBackRate = getActiveEnergyParams(next).rate;
  return next;
}

// How much a goal improves (positive) or worsens (negative) between two results.
export function improvement(goal: Goal, before: number, after: number) {
  return goal.higherIsBetter ? after - before : before - after;
}

// One step up for each slider, used for "raising this by X would…" hints.
export const LEVER_STEPS: Record<string, { step: number; unit: (s: number) => string; when?: (p: SolarParams) => boolean }> = {
  panelWattage: { step: 25, unit: (s) => `${s} W`, when: (p) => p.inputMode === 'detailed' },
  numberOfPanels: { step: 10, unit: (s) => `${s} panels`, when: (p) => p.inputMode === 'detailed' },
  costPerWatt: { step: 0.1, unit: (s) => `$${s.toFixed(2)}/W`, when: (p) => p.inputMode === 'detailed' },
  totalSystemSizeKw: { step: 5, unit: (s) => `${s} kW`, when: (p) => p.inputMode === 'total' },
  totalGrossCost: { step: 10000, unit: (s) => formatCurrency(s), when: (p) => p.inputMode === 'total' },
  monthlyUsageKwh: { step: 500, unit: (s) => `${s} kWh`, when: (p) => p.usageMode === 'flat' },
  utilityRate: { step: 0.01, unit: (s) => `$${s.toFixed(2)}`, when: (p) => p.usageMode !== 'historical' },
  sellBackRate: { step: 0.01, unit: (s) => `$${s.toFixed(2)}`, when: (p) => !p.hasLinkedSellBackRate },
  annualBillIncrease: { step: 1, unit: (s) => `${s} pt`, when: () => true },
  gridRenewablePercentage: { step: 10, unit: (s) => `${s} pts`, when: () => true },
  federalTaxCreditPercent: { step: 5, unit: (s) => `${s} pts`, when: (p) => p.hasIncentives },
  stateRebateAmount: { step: 5000, unit: (s) => formatCurrency(s), when: (p) => p.hasIncentives },
  downPayment: { step: 10000, unit: (s) => formatCurrency(s), when: (p) => p.isFinanced },
  loanTermYears: { step: 5, unit: (s) => `${s} yrs`, when: (p) => p.isFinanced },
  loanInterestRate: { step: 1, unit: (s) => `${s} pt`, when: (p) => p.isFinanced },
  batteryCapacityKwh: { step: 10, unit: (s) => `${s} kWh`, when: (p) => p.hasBattery },
  batteryCostPerKwh: { step: 100, unit: (s) => `$${s}`, when: (p) => p.hasBattery },
  annualMaintenanceCost: { step: 250, unit: (s) => formatCurrency(s), when: (p) => p.hasMaintenance },
  solarEfficiency: { step: 10, unit: (s) => `${s} pts`, when: (p) => p.hasSolarEfficiency && p.efficiencyMode === 'flat' },
};

export interface Impact { text: string; tone: 'good' | 'bad' | 'neutral' }

export function leverImpacts(p: SolarParams, goal: Goal): Record<string, Impact> {
  const base = goal.value(calculateRoi(p), p);
  const out: Record<string, Impact> = {};
  for (const [key, l] of Object.entries(LEVER_STEPS)) {
    if (l.when && !l.when(p)) continue;
    const next = withParams(p, { [key]: (p[key as keyof SolarParams] as number) + l.step } as Partial<SolarParams>);
    const after = goal.value(calculateRoi(next), next);
    const gain = improvement(goal, base, after);
    const tiny = Math.abs(after - base) < (goal.key === 'payback' || goal.key === 'co2' ? 0.05 : goal.key === 'roi' ? 0.5 : 50);
    out[key] = tiny
      ? { text: `+${l.unit(l.step)}: no real change to ${goal.short}`, tone: 'neutral' }
      : { text: `+${l.unit(l.step)}: ${goal.formatDelta(after - base)} ${goal.short}`, tone: gain > 0 ? 'good' : 'bad' };
  }
  return out;
}

export interface Suggestion {
  id: string;
  title: string;
  detail: string;
  changes: Partial<SolarParams>;
  gain: number;
  newValue: number;
}

// Candidate changes to try, scored against the goal. Only real choices are tried
// (system, battery, loan, credits), not facts like the electricity rate.
export function suggest(p: SolarParams, goal: Goal, quotes: { companyName: string; systemSizeKw: number; totalCost: number }[]): Suggestion[] {
  const baseRes = calculateRoi(p);
  const base = goal.value(baseRes, p);
  const kw = baseRes.systemSizeKW;
  // Florida pays leftover year-end credits at a low rate the model doesn't include,
  // so never suggest more panels than cover 100% of the year's use.
  const maxKw = baseRes.systemOffset > 0 ? kw * (100 / baseRes.systemOffset) : kw;
  const candidates: Omit<Suggestion, 'gain' | 'newValue'>[] = [];

  for (const q of quotes) {
    if (p.inputMode === 'total' && p.totalSystemSizeKw === q.systemSizeKw && p.totalGrossCost === q.totalCost) continue;
    candidates.push({
      id: `quote-${q.companyName}`,
      title: `Use the ${q.companyName} quote`,
      detail: `${q.systemSizeKw.toFixed(1)} kW for ${formatCurrency(q.totalCost)}${q.systemSizeKw > maxKw + 0.5 ? `; makes about ${Math.round((q.systemSizeKw / maxKw) * 100)}% of UUC’s yearly use, and the surplus is worth less than shown` : ''}`,
      changes: { inputMode: 'total', totalSystemSizeKw: q.systemSizeKw, totalGrossCost: q.totalCost },
    });
  }

  const perWatt = p.inputMode === 'detailed' ? p.costPerWatt : p.totalSystemSizeKw > 0 ? p.totalGrossCost / (p.totalSystemSizeKw * 1000) : p.costPerWatt;
  for (const f of [0.5, 0.75, 1.25, 1.5]) {
    const size = Math.min(kw * f, maxKw);
    if (Math.abs(size - kw) < 1) continue;
    const changes: Partial<SolarParams> = p.inputMode === 'detailed'
      ? { numberOfPanels: Math.max(1, Math.round((size * 1000) / p.panelWattage)) }
      : { totalSystemSizeKw: Math.round(size * 10) / 10, totalGrossCost: Math.round(size * 1000 * perWatt) };
    const realKw = p.inputMode === 'detailed' ? ((changes.numberOfPanels as number) * p.panelWattage) / 1000 : (changes.totalSystemSizeKw as number);
    candidates.push({
      id: `size-${f}`,
      title: `${realKw > kw ? 'Grow' : 'Shrink'} the system to ${realKw.toFixed(1)} kW`,
      detail: `${p.inputMode === 'detailed' ? `${changes.numberOfPanels} panels` : formatCurrency(changes.totalGrossCost as number)} at the same price per watt${realKw >= maxKw - 0.5 ? '; about what covers all of UUC’s yearly use' : ''}`,
      changes,
    });
  }

  if (!p.hasIncentives) {
    candidates.push({ id: 'credits', title: 'Claim the federal tax credit', detail: `${p.federalTaxCreditPercent || 30}% back as an IRS payment, if the project qualifies`, changes: { hasIncentives: true, federalTaxCreditPercent: p.federalTaxCreditPercent || 30 } });
  }
  if (p.isFinanced) {
    candidates.push({ id: 'cash', title: 'Pay cash instead of borrowing', detail: 'No interest; needs the full price up front', changes: { isFinanced: false } });
    for (const term of [5, 15, 20]) if (term !== p.loanTermYears) candidates.push({ id: `term-${term}`, title: `Make the loan ${term} years`, detail: term > p.loanTermYears ? 'Smaller payments, more interest' : 'Bigger payments, less interest', changes: { loanTermYears: term } });
    if (p.downPayment < baseRes.systemCost) candidates.push({ id: 'down-more', title: 'Put more down', detail: `${formatCurrency(Math.min(baseRes.systemCost, p.downPayment + 25000))} down instead of ${formatCurrency(p.downPayment)}`, changes: { downPayment: Math.min(Math.round(baseRes.systemCost), p.downPayment + 25000) } });
    if (p.downPayment > 0) candidates.push({ id: 'down-zero', title: 'Borrow the whole amount', detail: 'Nothing down', changes: { downPayment: 0 } });
  } else {
    candidates.push({ id: 'loan', title: 'Finance it with a loan', detail: `${p.loanTermYears || 10} years at ${p.loanInterestRate || 7}%, nothing down`, changes: { isFinanced: true, downPayment: 0 } });
  }
  if (p.hasBattery) {
    candidates.push({ id: 'no-battery', title: 'Leave out the battery', detail: 'Saves its cost; no outage backup', changes: { hasBattery: false } });
  } else {
    candidates.push({ id: 'battery', title: 'Add a 40 kWh battery', detail: `About ${formatCurrency(40 * p.batteryCostPerKwh)}; adds outage backup`, changes: { hasBattery: true, batteryCapacityKwh: p.batteryCapacityKwh || 40 } });
  }

  // With a loan, payback measures when savings pass the payments made so far, so a loan always
  // looks faster. Comparing that against cash payback would mislead, so loan changes sit out.
  const pool = goal.key === 'payback' ? candidates.filter(c => !/^(loan|cash|term-|down-)/.test(c.id)) : candidates;
  const scored = pool.map(c => {
    const next = withParams(p, c.changes);
    const v = goal.value(calculateRoi(next), next);
    return { ...c, gain: improvement(goal, base, v), newValue: v };
  });
  const minGain = goal.key === 'payback' || goal.key === 'co2' ? 0.05 : goal.key === 'roi' ? 0.5 : 100;
  return scored.filter(s => s.gain > minGain).sort((a, b) => b.gain - a.gain).slice(0, 3);
}
