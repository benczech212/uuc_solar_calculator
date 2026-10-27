import React from 'react';
import { Sun, Zap, Receipt, Wrench, Battery, PiggyBank, FileText, Landmark, Trash2, Eye, EyeOff } from 'lucide-react';
import { Slider } from './Slider';
import { Section, Segmented, Toggle, InfoTip, cn, btn } from './ui';
import { PARAM_INFO } from '../paramInfo';
import { SolarParams, RoiResults } from '../types';
import { formatCurrency } from '../utils';

export interface VendorQuote {
  id: string;
  companyName: string;
  systemSizeKw: number;
  totalCost: number;
}

export type SectionKey = 'quotes' | 'system' | 'efficiency' | 'energy' | 'maintenance' | 'storage' | 'incentives' | 'financing';
export type CompareKey = 'efficiency' | 'maintenance' | 'storage' | 'incentives' | 'financing';

interface InputsPanelProps {
  params: SolarParams;
  results: RoiResults;
  quotes: VendorQuote[];
  updateParam: (key: keyof SolarParams, value: any) => void;
  applyQuote: (q: VendorQuote) => void;
  sectionsOpen: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey) => void;
  comparisonMode: CompareKey | null;
  toggleCompare: (key: CompareKey) => void;
  onOpenBills: () => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const usd = (v: number) => formatCurrency(v);
const usd2 = (v: number) => `$${v.toFixed(2)}`;
const pct = (v: number) => `${v}%`;

function MonthGrid({ values, onChange, round }: { values: number[]; onChange: (v: number[]) => void; round?: boolean }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {MONTHS.map((mo, i) => (
        <label key={mo} className="bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1.5 flex items-center gap-2">
          <span className="text-xs text-slate-500 w-7">{mo}</span>
          <input
            type="number"
            className="w-full min-w-0 bg-transparent text-sm text-white text-right font-mono focus:outline-none"
            value={round ? Math.round(values[i] ?? 0) : values[i] ?? 0}
            onChange={(e) => {
              const next = [...values];
              next[i] = Number(e.target.value);
              onChange(next);
            }}
          />
        </label>
      ))}
    </div>
  );
}

function LumpSums({ params, updateParam }: Pick<InputsPanelProps, 'params' | 'updateParam'>) {
  const [year, setYear] = React.useState(1);
  const [amount, setAmount] = React.useState('');
  const payments = params.lumpSumPayments || [];
  const setPayments = (p: SolarParams['lumpSumPayments']) => updateParam('lumpSumPayments', p);

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm text-slate-200">Extra loan payments <InfoTip info={PARAM_INFO.lumpSums} label="extra loan payments" /></p>
      <p className="text-xs text-slate-500">One-time payments toward the loan, such as a grant or a fundraising drive.</p>
      <div className="flex gap-2">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-slate-950 border border-slate-700 rounded-md text-sm text-white px-2 py-1.5 focus:outline-none focus:border-amber-500"
        >
          {Array.from({ length: Math.max(1, params.loanTermYears) }, (_, i) => i + 1).map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <input
          type="number"
          placeholder="Amount ($)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-md text-sm text-white px-2 py-1.5 focus:outline-none focus:border-amber-500"
        />
        <button
          type="button"
          className={cn(btn.base, btn.secondary, 'py-1.5')}
          disabled={!(Number(amount) > 0)}
          onClick={() => { setPayments([...payments, { year, amount: Number(amount), enabled: true }]); setAmount(''); }}
        >Add</button>
      </div>
      {payments.map((p, i) => (
        <div key={i} className={cn('flex justify-between items-center text-sm bg-slate-950/60 px-3 py-2 rounded-md border border-slate-800', p.enabled === false && 'opacity-50')}>
          <span className="text-slate-300">Year {p.year}</span>
          <div className="flex items-center gap-3">
            <span className="text-white font-mono">{usd(p.amount)}</span>
            <button
              type="button"
              onClick={() => setPayments(payments.map((q, j) => j === i ? { ...q, enabled: q.enabled === false } : q))}
              className="text-slate-400 hover:text-white"
              title={p.enabled !== false ? 'Leave out for now' : 'Include'}
            >{p.enabled !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
            <button type="button" onClick={() => setPayments(payments.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400" title="Remove">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InputsPanel(props: InputsPanelProps) {
  const { params, results, quotes, updateParam, applyQuote, sectionsOpen, toggleSection, comparisonMode, toggleCompare, onOpenBills } = props;
  const optional = (key: CompareKey, flag: keyof SolarParams) => ({
    open: sectionsOpen[key],
    onToggleOpen: () => toggleSection(key),
    enabled: !!params[flag],
    onToggleEnabled: (v: boolean) => updateParam(flag, v),
    comparing: comparisonMode === key,
    onCompare: () => toggleCompare(key),
  });

  return (
    <div className="space-y-3">
      <Section
        id="section-quotes"
        title="1. Start from a quote"
        hint="Pick a vendor quote, or enter your own system below"
        icon={<FileText className="w-4 h-4 text-emerald-400" />}
        info={PARAM_INFO.quotes}
        open={sectionsOpen.quotes}
        onToggleOpen={() => toggleSection('quotes')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-2 pt-3">
          {quotes.map(q => {
            const active = params.inputMode === 'total' && params.totalSystemSizeKw === q.systemSizeKw && params.totalGrossCost === q.totalCost;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => applyQuote(q)}
                aria-pressed={active}
                className={cn('p-3 rounded-lg border text-left transition-colors', active ? 'bg-emerald-500/15 border-emerald-500/60' : 'bg-slate-950/40 border-slate-800 hover:border-slate-600')}
              >
                <span className={cn('block font-semibold', active ? 'text-emerald-300' : 'text-slate-100')}>{q.companyName}</span>
                <span className="block text-xs text-slate-400 mt-1">{q.systemSizeKw.toFixed(1)} kW · {usd(q.totalCost)}</span>
                <span className="block text-xs text-slate-500 font-mono">{usd2(q.totalCost / (q.systemSizeKw * 1000))}/W</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        id="section-system"
        title="2. Solar system"
        hint={`${results.systemSizeKW.toFixed(1)} kW for ${usd(results.systemCost)} before credits`}
        icon={<Zap className="w-4 h-4 text-amber-400" />}
        open={sectionsOpen.system}
        onToggleOpen={() => toggleSection('system')}
        headerExtra={
          <Segmented
            value={params.inputMode}
            onChange={(v) => updateParam('inputMode', v)}
            options={[{ value: 'detailed', label: 'By panel' }, { value: 'total', label: 'Total' }]}
          />
        }
      >
        <div className="space-y-5 pt-3">
          {params.inputMode === 'detailed' ? (
            <>
              <Slider id="slider-panelWattage" label="Panel wattage" unit="W" min={100} max={1000} step={5}
                value={params.panelWattage} onChange={(v) => updateParam('panelWattage', v)} />
              <Slider id="slider-numberOfPanels" label="Number of panels" unit="panels" min={1} max={500} step={1}
                value={params.numberOfPanels} onChange={(v) => updateParam('numberOfPanels', v)} />
              <Slider id="slider-costPerWatt" label="Installed cost per watt" hint="Before any tax credit" unit="$/W" min={0.5} max={15} step={0.05}
                format={usd2} value={params.costPerWatt} onChange={(v) => updateParam('costPerWatt', v)} />
            </>
          ) : (
            <>
              <Slider id="slider-totalSystemSizeKw" label="System size" unit="kW" min={1} max={100} step={0.5}
                value={params.totalSystemSizeKw} onChange={(v) => updateParam('totalSystemSizeKw', v)} />
              <Slider id="slider-totalGrossCost" label="Total installed cost" hint="Before any tax credit" unit="$" min={1000} max={300000} step={1000}
                format={usd} value={params.totalGrossCost} onChange={(v) => updateParam('totalGrossCost', v)} />
            </>
          )}
        </div>
      </Section>

      <Section
        id="section-energy"
        title="3. Energy use and rates"
        hint={`${Math.round(results.effectiveMonthlyUsageKwh).toLocaleString()} kWh a month at $${results.effectiveUtilityRate.toFixed(3)}/kWh`}
        icon={<Receipt className="w-4 h-4 text-amber-400" />}
        open={sectionsOpen.energy}
        onToggleOpen={() => toggleSection('energy')}
      >
        <div className="space-y-5 pt-3">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm text-slate-200">How should usage be entered? <InfoTip info={PARAM_INFO.usageMode} label="usage entry" /></p>
            <Segmented
              className="w-full"
              value={params.usageMode}
              onChange={(v) => updateParam('usageMode', v)}
              options={[{ value: 'flat', label: 'Same every month' }, { value: 'monthly', label: 'Month by month' }, { value: 'historical', label: 'From bills' }]}
            />
          </div>

          {params.usageMode === 'historical' ? (
            <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-200">Based on {params.historicalBills?.length ?? 0} uploaded bills</p>
                <Segmented
                  value={params.historicalCompMode ?? 'average'}
                  onChange={(v) => updateParam('historicalCompMode', v)}
                  options={[{ value: 'average', label: 'Average' }, { value: 'recent', label: 'Latest year' }]}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={!!params.historicalByMonth} onChange={(e) => updateParam('historicalByMonth', e.target.checked)} className="accent-amber-500" />
                Keep each month's own usage and rate (seasonal)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Effective rate</p>
                  <p className="font-mono text-amber-400">${results.effectiveUtilityRate.toFixed(4)}/kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Monthly usage</p>
                  <p className="font-mono text-white">{Math.round(results.effectiveMonthlyUsageKwh).toLocaleString()} kWh</p>
                </div>
              </div>
              <button type="button" onClick={onOpenBills} className={cn(btn.base, btn.secondary, 'w-full')}>Add or edit bills</button>
            </div>
          ) : (
            <>
              {params.usageMode === 'flat' ? (
                <Slider id="slider-monthlyUsageKwh" label="Monthly electricity use" unit="kWh" min={50} max={20000} step={50}
                  value={params.monthlyUsageKwh} onChange={(v) => updateParam('monthlyUsageKwh', v)} />
              ) : (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-sm text-slate-200">Electricity use by month (kWh) <InfoTip info={PARAM_INFO.monthlyUsageProfile} label="monthly use" /></p>
                  <MonthGrid round values={params.monthlyUsageProfile} onChange={(v) => updateParam('monthlyUsageProfile', v)} />
                </div>
              )}
              <Slider id="slider-utilityRate" label="Electricity rate" hint="What the utility charges per kWh" unit="$/kWh" min={0.01} max={1} step={0.01}
                format={usd2} value={params.utilityRate} onChange={(v) => updateParam('utilityRate', v)} />
            </>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm text-slate-200">Same rate for power sold back <InfoTip info={PARAM_INFO.linkSellBack} label="net metering" /></p>
                <p className="text-xs text-slate-500">Net metering credits extra solar at the retail rate</p>
              </div>
              <Toggle checked={params.hasLinkedSellBackRate} onChange={(v) => updateParam('hasLinkedSellBackRate', v)} label="Link sell-back rate to utility rate" />
            </div>
            <Slider id="slider-sellBackRate" label="Sell-back rate" unit="$/kWh" min={0} max={1} step={0.01} format={usd2}
              disabled={params.hasLinkedSellBackRate} value={params.sellBackRate} onChange={(v) => updateParam('sellBackRate', v)} />
          </div>

          <Slider id="slider-annualBillIncrease" label="Yearly rate increase" hint="How fast electricity prices rise" unit="%/yr" min={0} max={15} step={0.5}
            format={pct} value={params.annualBillIncrease} onChange={(v) => updateParam('annualBillIncrease', v)} />
          <Slider id="slider-gridRenewablePercentage" label="Grid's renewable share" hint="Used for the carbon and energy-mix numbers" unit="%" min={0} max={100} step={1}
            format={pct} value={params.gridRenewablePercentage} onChange={(v) => updateParam('gridRenewablePercentage', v)} />
        </div>
      </Section>

      <p className="text-xs uppercase tracking-wider text-slate-500 pt-3 px-1">Optional: switch on what applies</p>

      <Section id="section-incentives" title="Tax credits and rebates" hint={params.hasIncentives ? `${params.federalTaxCreditPercent}% federal credit` : 'Off'}
        icon={<Landmark className="w-4 h-4 text-rose-300" />} {...optional('incentives', 'hasIncentives')}>
        <div className="space-y-5 pt-3">
          <Slider id="slider-federalTaxCreditPercent" label="Federal tax credit" hint="Nonprofits can claim this as a direct payment" unit="%" min={0} max={50} step={1}
            format={pct} value={params.federalTaxCreditPercent} onChange={(v) => updateParam('federalTaxCreditPercent', v)} />
          <Slider id="slider-stateRebateAmount" label="State or utility rebate" unit="$" min={0} max={20000} step={100}
            format={usd} value={params.stateRebateAmount} onChange={(v) => updateParam('stateRebateAmount', v)} />
        </div>
      </Section>

      <Section id="section-financing" title="Loan" hint={params.isFinanced ? `${params.loanTermYears} years at ${params.loanInterestRate}%` : 'Off: paid in cash'}
        icon={<PiggyBank className="w-4 h-4 text-purple-300" />} {...optional('financing', 'isFinanced')}>
        <div className="space-y-5 pt-3">
          <Slider id="slider-downPayment" label="Down payment" unit="$" min={0} max={Math.max(1000, Math.round(results.systemCost))} step={500}
            format={usd} value={params.downPayment} onChange={(v) => updateParam('downPayment', v)} />
          <Slider id="slider-loanTermYears" label="Loan length" unit="years" min={1} max={30} step={1}
            value={params.loanTermYears} onChange={(v) => updateParam('loanTermYears', v)} />
          <Slider id="slider-loanInterestRate" label="Interest rate" unit="%" min={0} max={20} step={0.25}
            format={pct} value={params.loanInterestRate} onChange={(v) => updateParam('loanInterestRate', v)} />
          <LumpSums params={params} updateParam={updateParam} />
        </div>
      </Section>

      <Section id="section-storage" title="Battery" hint={params.hasBattery ? `${params.batteryCapacityKwh} kWh` : 'Off'}
        icon={<Battery className="w-4 h-4 text-emerald-400" />} {...optional('storage', 'hasBattery')}>
        <div className="space-y-5 pt-3">
          <Slider id="slider-batteryCapacityKwh" label="Battery size" unit="kWh" min={0} max={200} step={1}
            value={params.batteryCapacityKwh} onChange={(v) => updateParam('batteryCapacityKwh', v)} />
          <Slider id="slider-batteryCostPerKwh" label="Battery cost per kWh" unit="$/kWh" min={100} max={3000} step={25}
            format={usd} value={params.batteryCostPerKwh} onChange={(v) => updateParam('batteryCostPerKwh', v)} />
        </div>
      </Section>

      <Section id="section-maintenance" title="Maintenance" hint={params.hasMaintenance ? `${usd(params.annualMaintenanceCost)} a year` : 'Off'}
        icon={<Wrench className="w-4 h-4 text-amber-300" />} {...optional('maintenance', 'hasMaintenance')}>
        <div className="pt-3">
          <Slider id="slider-annualMaintenanceCost" label="Yearly maintenance cost" unit="$/yr" min={0} max={5000} step={25}
            format={usd} value={params.annualMaintenanceCost} onChange={(v) => updateParam('annualMaintenanceCost', v)} />
        </div>
      </Section>

      <Section id="section-efficiency" title="Production adjustment" hint={params.hasSolarEfficiency ? 'Custom output' : 'Off: standard output'}
        icon={<Sun className="w-4 h-4 text-amber-300" />} {...optional('efficiency', 'hasSolarEfficiency')}>
        <div className="space-y-5 pt-3">
          <p className="text-xs text-slate-500">Scale the expected output up or down, for shade, panel aging or a better-than-average roof. 100% is a typical system.</p>
          <Segmented
            value={params.efficiencyMode}
            onChange={(v) => updateParam('efficiencyMode', v)}
            options={[{ value: 'flat', label: 'One value' }, { value: 'monthly', label: 'By month' }]}
          />
          {params.efficiencyMode === 'flat' ? (
            <Slider id="slider-solarEfficiency" label="Output vs. typical" unit="%" min={50} max={150} step={1}
              format={pct} value={params.solarEfficiency} onChange={(v) => updateParam('solarEfficiency', v)} />
          ) : (
            <MonthGrid values={params.monthlyEfficiencyProfile} onChange={(v) => updateParam('monthlyEfficiencyProfile', v)} />
          )}
        </div>
      </Section>

      <div className="flex items-center justify-between gap-3 border border-slate-800 rounded-xl bg-slate-900/40 px-4 py-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-slate-200">Seasonal sunshine <InfoTip info={PARAM_INFO.seasonal} label="seasonal sunshine" /></p>
          <p className="text-xs text-slate-500">More output in summer, less in winter, instead of the same every month</p>
        </div>
        <Toggle checked={params.useSeasonalGenerationCurve} onChange={(v) => updateParam('useSeasonalGenerationCurve', v)} label="Seasonal sunshine" />
      </div>

      <div className="border border-slate-800 rounded-xl bg-slate-900/40 px-4 py-3 space-y-2">
        <p className="text-sm text-slate-200">Fixed assumptions</p>
        <p className="text-xs text-slate-500">Built into the model, not adjustable here.</p>
        {([['solarYield', '1,500 kWh per kW of panels per year'], ['co2', '0.000366 t CO₂ per grid kWh (Florida)'], ['homes', '4.8 t CO₂ per home, for the homes comparison']] as const).map(([key, text]) => (
          <p key={key} className="flex items-center gap-1.5 text-xs text-slate-400">{text} <InfoTip info={PARAM_INFO[key]} label={text} /></p>
        ))}
      </div>
    </div>
  );
}
