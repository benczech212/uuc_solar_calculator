import React, { useState, useEffect, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { SolarParams, RoiResults } from '../types';
import { formatCurrency, SOLAR_YIELD_KWH_PER_KW, GRID_CO2_TONS_PER_KWH, HOME_ELECTRIC_CO2_TONS } from '../utils';
import { cn } from './ui';

interface EquationsProps {
  params: SolarParams;
  results: RoiResults;
  printMode?: boolean;
  highlightedSection?: string | null;
  onClearHighlight?: () => void;
  onNavigateToEquation?: (sectionKey: string) => void;
  onNavigateToSlider?: (sliderId: string, sectionKey: string) => void;
}

type Nav = Pick<EquationsProps, 'onNavigateToEquation' | 'onNavigateToSlider'>;
const NavCtx = React.createContext<Nav>({});

interface VariableLinkProps {
  name: string;
  eqKey?: string;
  sliderId?: string;
  sliderSection?: string;
  onNavigateToEquation?: (key: string) => void;
  onNavigateToSlider?: (sliderId: string, sectionKey: string) => void;
}

// A term in a formula. Inputs (green) jump to their slider; results (amber) jump to their own formula.
export function VariableLink({ name, eqKey, sliderId, sliderSection, onNavigateToEquation, onNavigateToSlider }: VariableLinkProps) {
  const chip = 'inline-block align-baseline px-1.5 py-0.5 mx-0.5 rounded-md border text-[0.95em] font-sans transition-colors';
  if (eqKey && onNavigateToEquation) {
    return (
      <button type="button" onClick={() => onNavigateToEquation(eqKey)} title={`See how ${name.toLowerCase()} is worked out`}
        className={cn(chip, 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10')}>{name}</button>
    );
  }
  if (sliderId && sliderSection && onNavigateToSlider) {
    return (
      <button type="button" onClick={() => onNavigateToSlider(sliderId, sliderSection)} title={`Go to the ${name.toLowerCase()} input`}
        className={cn(chip, 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10')}>{name}</button>
    );
  }
  return <span className={cn(chip, 'border-slate-700 text-slate-200')}>{name}</span>;
}

function V({ name, eq, sld, sec }: { name: string; eq?: string; sld?: string; sec?: string }) {
  const nav = useContext(NavCtx);
  return <VariableLink name={name} eqKey={eq} sliderId={sld} sliderSection={sec} {...nav} />;
}

interface Item {
  key: string;
  title: string;
  plain: string;
  formula: React.ReactNode;
  result: React.ReactNode;
}

function Card({ item, open, highlighted, onToggle, printMode }: { item: Item; open: boolean; highlighted: boolean; onToggle: () => void; printMode?: boolean }) {
  return (
    <div id={`eq-${item.key}`} className={cn('rounded-xl border transition-all duration-500 scroll-mt-24',
      highlighted ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-slate-800 bg-slate-950/30',
      printMode && 'page-break-inside-avoid')}>
      <button type="button" onClick={onToggle} disabled={printMode} className="w-full flex items-start gap-2 text-left px-4 py-3">
        {!printMode && <ChevronDown className={cn('w-4 h-4 mt-0.5 text-slate-500 transition-transform shrink-0', !open && '-rotate-90')} />}
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-100">{item.title}</span>
          <span className="block text-xs text-slate-400">{item.plain}</span>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 text-sm">
          <div className="text-slate-300 leading-loose">{item.formula}</div>
          <div className="font-mono text-emerald-300 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 leading-relaxed">{item.result}</div>
        </div>
      )}
    </div>
  );
}

// Formulas: every calculation behind the results, in plain words, with the current numbers filled in.
export function Equations({ params, results, printMode, highlightedSection, onClearHighlight, onNavigateToEquation, onNavigateToSlider }: EquationsProps) {
  const rate = results.effectiveUtilityRate ?? params.utilityRate;
  const usd = (v: number) => formatCurrency(v);
  const kwh = (v: number) => `${Math.round(v).toLocaleString()} kWh`;
  const billWithout = results.annualUsage * rate;
  const billWith = results.annualGridPurchase * rate - results.annualGridSales * params.sellBackRate;
  const credit = params.hasIncentives ? results.systemCost * (params.federalTaxCreditPercent / 100) + params.stateRebateAmount : 0;
  const pays = results.paybackPeriod > 0 && results.paybackPeriod <= 25;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'What it costs',
      items: [
        {
          key: 'cost', title: 'Price before credits', plain: 'The installed price of the panels, plus the battery if there is one.',
          formula: <><V name="System size" sld={params.inputMode === 'detailed' ? 'slider-numberOfPanels' : 'slider-totalSystemSizeKw'} sec="system" /> × <V name="Price per watt" sld={params.inputMode === 'detailed' ? 'slider-costPerWatt' : 'slider-totalGrossCost'} sec="system" />{params.hasBattery && <> + <V name="Battery size" sld="slider-batteryCapacityKwh" sec="storage" /> × <V name="Battery cost" sld="slider-batteryCostPerKwh" sec="storage" /></>}</>,
          result: <>{results.systemSizeKW.toFixed(1)} kW × ${(results.systemSizeKW > 0 ? (results.systemCost - (params.hasBattery ? params.batteryCapacityKwh * params.batteryCostPerKwh : 0)) / (results.systemSizeKW * 1000) : 0).toFixed(2)}/W{params.hasBattery && <> + {params.batteryCapacityKwh} kWh × ${params.batteryCostPerKwh}</>} = {usd(results.systemCost)}</>,
        },
        {
          key: 'net', title: 'Cost after credits', plain: 'The price minus the federal credit and any rebate. Nonprofits get the federal credit as a payment from the IRS.',
          formula: <><V name="Price before credits" eq="cost" />{params.hasIncentives ? <> − <V name="Federal credit %" sld="slider-federalTaxCreditPercent" sec="incentives" /> of the price − <V name="Rebate" sld="slider-stateRebateAmount" sec="incentives" /></> : <> (credits are switched off)</>}</>,
          result: <>{usd(results.systemCost)}{params.hasIncentives && <> − {usd(credit)}</>} = {usd(results.netCost)}</>,
        },
      ],
    },
    {
      title: 'Energy',
      items: [
        {
          key: 'yearlygen', title: 'Solar made per year', plain: `Each kW of panels makes about ${SOLAR_YIELD_KWH_PER_KW.toLocaleString()} kWh a year around Tampa Bay, adjusted if you set a production change.`,
          formula: <><V name="System size" sld={params.inputMode === 'detailed' ? 'slider-numberOfPanels' : 'slider-totalSystemSizeKw'} sec="system" /> × {SOLAR_YIELD_KWH_PER_KW.toLocaleString()} kWh{params.hasSolarEfficiency && <> × <V name="Output vs. typical" sld="slider-solarEfficiency" sec="efficiency" /></>}</>,
          result: <>{results.systemSizeKW.toFixed(1)} kW × {SOLAR_YIELD_KWH_PER_KW.toLocaleString()}{params.hasSolarEfficiency && ` × ${params.efficiencyMode === 'monthly' ? 'monthly %' : `${params.solarEfficiency}%`}`} = {kwh(results.annualGeneration)} a year</>,
        },
        {
          key: 'gridsales', title: 'Extra sent to the grid', plain: `Solar made beyond what the building uses at the time${params.hasBattery ? ' and beyond what the battery can store' : ''}, worked out month by month.`,
          formula: <>Each month: <V name="Solar made" eq="yearlygen" /> − electricity used{params.hasBattery && <> − battery charging</>}, when positive</>,
          result: <>{kwh(results.annualGridSales)} a year</>,
        },
        {
          key: 'exported_sold', title: 'Value of power sent to the grid', plain: 'Duke credits extra solar at the sell-back rate.',
          formula: <><V name="Extra sent to the grid" eq="gridsales" /> × <V name="Sell-back rate" sld="slider-sellBackRate" sec="energy" /></>,
          result: <>{kwh(results.annualGridSales)} × ${params.sellBackRate.toFixed(2)} = {usd(results.annualGridSales * params.sellBackRate)} a year</>,
        },
        {
          key: 'battery_utilization', title: 'Drawn from the battery', plain: 'Stored solar used later, instead of buying from the grid.',
          formula: <>Limited by <V name="Battery size" sld="slider-batteryCapacityKwh" sec="storage" /> and the solar left over each day</>,
          result: <>{kwh(results.annualBatteryDraw)} a year</>,
        },
        {
          key: 'grid_purchase', title: 'Still bought from the grid', plain: 'Electricity the panels and battery can’t cover, mostly at night and in cloudy months.',
          formula: <>Electricity used − solar used − <V name="Battery" eq="battery_utilization" /></>,
          result: <>{kwh(results.annualGridPurchase)} a year, about {usd(results.annualGridPurchase * rate)} in year 1</>,
        },
      ],
    },
    {
      title: 'Bills and savings',
      items: [
        {
          key: 'yr1without', title: 'Year-1 bill without solar', plain: 'What UUC would pay for a year of electricity at today’s rate.',
          formula: <>Electricity used × <V name="Electricity rate" sld="slider-utilityRate" sec="energy" /></>,
          result: <>{kwh(results.annualUsage)} × ${rate.toFixed(3)} = {usd(billWithout)}</>,
        },
        {
          key: 'yr1with', title: 'Year-1 bill with solar', plain: 'What’s still bought, minus credits for what’s sent back.',
          formula: <>(<V name="Still bought" eq="grid_purchase" /> × <V name="Electricity rate" sld="slider-utilityRate" sec="energy" />) − (<V name="Sent to the grid" eq="gridsales" /> × <V name="Sell-back rate" sld="slider-sellBackRate" sec="energy" />)</>,
          result: <>({kwh(results.annualGridPurchase)} × ${rate.toFixed(3)}) − ({kwh(results.annualGridSales)} × ${params.sellBackRate.toFixed(2)}) = {usd(billWith)}</>,
        },
        {
          key: 'yr1savings', title: 'First-year savings', plain: 'The drop in the electric bill in year 1. Upkeep is counted separately, as a cost.',
          formula: <><V name="Bill without solar" eq="yr1without" /> − <V name="Bill with solar" eq="yr1with" /></>,
          result: <>{usd(billWithout)} − {usd(billWith)} = {usd(results.yearOneSavings)}</>,
        },
        {
          key: 'projection', title: '25-year projection', plain: 'Each year the rate rises, so the yearly savings grow. Costs paid each year are added up alongside.',
          formula: <>Each year: rate × (1 + <V name="Yearly rate increase" sld="slider-annualBillIncrease" sec="energy" />); savings = bill without − bill with. Paid so far = up-front payment or <V name="loan payments" sld="slider-loanTermYears" sec="financing" /> + <V name="upkeep" sld="slider-annualMaintenanceCost" sec="maintenance" /> − credits (received in year 2)</>,
          result: <>25-year net savings (savings − paid) = {usd(results.total25YearSavings)}</>,
        },
        {
          key: 'cum_savings', title: 'Savings to date', plain: 'The running total of bill savings, year after year.',
          formula: <>Savings to date in year N = savings to date in year N−1 + savings in year N</>,
          result: <>By year 25, net of costs: {usd(results.total25YearSavings)}</>,
        },
      ],
    },
    {
      title: 'Payback and return',
      items: [
        {
          key: 'payback', title: 'Payback time', plain: 'The first point where total savings so far catch up with everything paid so far.' + (params.isFinanced ? ' With a loan, this can come early because only the payments made so far count.' : ''),
          formula: <>First year when <V name="Savings to date" eq="cum_savings" /> ≥ paid to date (see <V name="Projection" eq="projection" />)</>,
          result: <>{pays ? `${results.paybackPeriod.toFixed(1)} years` : results.paybackPeriod > 25 ? `${results.paybackPeriod.toFixed(1)} years, past the 25-year panel life` : 'Never, with these settings'}</>,
        },
        {
          key: '25yr_roi', title: '25-year return', plain: 'Net savings after 25 years as a share of everything paid in that time.',
          formula: <><V name="25-year net savings" eq="projection" /> ÷ total paid over 25 years × 100</>,
          result: <>{results.roiPercentage > 0 ? '+' : ''}{results.roiPercentage.toFixed(0)}%</>,
        },
      ],
    },
    {
      title: 'Environment',
      items: [
        {
          key: 'renewable_mix', title: 'Clean-power share', plain: 'How much of the year’s electricity comes from your solar or the grid’s renewable plants.',
          formula: <>(solar used + grid power × <V name="Grid's renewable share" sld="slider-gridRenewablePercentage" sec="energy" />) ÷ electricity used</>,
          result: <>{results.co2Impact.currentRenewablePercent.toFixed(0)}% before solar → {results.co2Impact.newRenewablePercent.toFixed(0)}% with solar</>,
        },
        {
          key: 'co2', title: 'CO₂ avoided', plain: 'Fossil-fuel grid power no longer bought, times Florida’s grid emissions rate (EPA eGRID).',
          formula: <>fossil grid kWh avoided × {GRID_CO2_TONS_PER_KWH} tons per kWh</>,
          result: <>{results.co2Impact.co2SavedTonsPerYear.toFixed(1)} metric tons a year</>,
        },
        {
          key: 'co2homes', title: 'Homes comparison', plain: `One average US home’s electricity puts out about ${HOME_ELECTRIC_CO2_TONS} tons of CO₂ a year (EPA).`,
          formula: <><V name="CO₂ avoided" eq="co2" /> ÷ {HOME_ELECTRIC_CO2_TONS}</>,
          result: <>about {(results.co2Impact.co2SavedTonsPerYear / HOME_ELECTRIC_CO2_TONS).toFixed(1)} homes’ worth a year</>,
        },
      ],
    },
  ];

  const allKeys = groups.flatMap(g => g.items.map(i => i.key));
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(allKeys.map(k => [k, !!printMode])));

  useEffect(() => {
    if (!highlightedSection) return;
    setOpen(prev => ({ ...prev, [highlightedSection]: true }));
    const scroll = setTimeout(() => document.getElementById(`eq-${highlightedSection}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    const clear = setTimeout(() => onClearHighlight?.(), 3500);
    return () => { clearTimeout(scroll); clearTimeout(clear); };
  }, [highlightedSection, onClearHighlight]);

  const allOpen = allKeys.every(k => open[k]);

  return (
    <NavCtx.Provider value={{ onNavigateToEquation, onNavigateToSlider }}>
      <div className="space-y-5">
        {!printMode && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              <span className="text-emerald-300">Green</span> terms are inputs you can change; <span className="text-amber-300">amber</span> terms have their own formula.
            </span>
            <button type="button" onClick={() => setOpen(Object.fromEntries(allKeys.map(k => [k, !allOpen])))} className="text-slate-300 hover:text-white underline">
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        )}
        {groups.map(g => (
          <section key={g.title} className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-500">{g.title}</h3>
            {g.items.map(item => (
              <Card key={item.key} item={item} printMode={printMode} open={!!open[item.key]} highlighted={highlightedSection === item.key}
                onToggle={() => setOpen(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
            ))}
          </section>
        ))}
      </div>
    </NavCtx.Provider>
  );
}
