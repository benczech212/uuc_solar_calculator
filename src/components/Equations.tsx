import React, { useState, useEffect } from 'react';
import { SolarParams, RoiResults } from '../types';
import { formatCurrency } from '../utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface EquationsProps {
  params: SolarParams;
  results: RoiResults;
  printMode?: boolean;
  highlightedSection?: string | null;
  onClearHighlight?: () => void;
  onNavigateToEquation?: (sectionKey: string) => void;
  onNavigateToSlider?: (sliderId: string, sectionKey: string) => void;
}

interface VariableLinkProps {
  name: string;
  eqKey?: string;
  sliderId?: string;
  sliderSection?: string;
  onNavigateToEquation?: (key: string) => void;
  onNavigateToSlider?: (sliderId: string, sectionKey: string) => void;
}

export function VariableLink({ name, eqKey, sliderId, sliderSection, onNavigateToEquation, onNavigateToSlider }: VariableLinkProps) {
  if (eqKey && onNavigateToEquation) {
    return (
      <button
        onClick={() => onNavigateToEquation(eqKey)}
        className="font-semibold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer hover:bg-amber-400/10 px-1 py-0.5 rounded transition-all inline-block align-baseline text-left font-mono"
        title={`Click to view formula for ${name}`}
      >
        {name}
      </button>
    );
  }

  if (sliderId && sliderSection && onNavigateToSlider) {
    return (
      <button
        onClick={() => onNavigateToSlider(sliderId, sliderSection)}
        className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer hover:bg-emerald-400/10 px-1 py-0.5 rounded transition-all inline-block align-baseline text-left font-mono"
        title={`Click to adjust ${name} slider`}
      >
        {name}
      </button>
    );
  }

  return <span className="font-semibold text-slate-200">{name}</span>;
}

export function Equations({ 
  params, 
  results, 
  printMode, 
  highlightedSection, 
  onClearHighlight,
  onNavigateToEquation,
  onNavigateToSlider
}: EquationsProps) {
  const activeRate = results.effectiveUtilityRate !== undefined ? results.effectiveUtilityRate : params.utilityRate;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cost: true,
    net: true,
    yearlygen: true,
    yr1without: true,
    yr1with: true,
    gridsales: true,
    exported_sold: true,
    battery_utilization: true,
    grid_purchase: true,
    yr1savings: true,
    projection: true,
    cum_savings: true,
    payback: true,
    "25yr_roi": true,
    renewable_mix: true,
    co2: true,
    co2homes: true
  });

  const toggleSection = (key: string) => {
    if (printMode) return;
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (highlightedSection) {
      setOpenSections(prev => ({ ...prev, [highlightedSection]: true }));
      
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`eq-${highlightedSection}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const clearTimer = setTimeout(() => {
        if (onClearHighlight) {
          onClearHighlight();
        }
      }, 3500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedSection, onClearHighlight]);

  const EquationBlock = ({ title, sectionKey, children }: { title: string, sectionKey: string, children: React.ReactNode }) => {
    const isHighlighted = highlightedSection === sectionKey;
    return (
      <div 
        id={`eq-${sectionKey}`} 
        className={`space-y-2 transition-all duration-500 rounded-xl ${isHighlighted ? 'scale-[1.02] ring-2 ring-amber-500/40 p-1.5 bg-amber-500/5' : ''} ${printMode ? 'page-break-inside-avoid' : ''}`}
      >
        <button 
          onClick={() => toggleSection(sectionKey)}
          className={`flex items-center gap-2 text-amber-500 uppercase tracking-widest text-sm font-semibold transition-colors w-full text-left ${printMode ? 'cursor-default' : 'hover:text-amber-400'}`}
        >
          {!printMode && (
            openSections[sectionKey] ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-amber-500" />
          )}
          {title}
        </button>
        {openSections[sectionKey] && (
          <p className={`p-4 rounded-xl border text-base leading-relaxed transition-all duration-500 ${isHighlighted ? 'bg-slate-950/95 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)]' : 'bg-slate-900/50 border-slate-800'}`}>
            {children}
          </p>
        )}
      </div>
    );
  };

  const Var = ({ name, eq, sld, sec }: { name: string, eq?: string, sld?: string, sec?: string }) => (
    <VariableLink
      name={name}
      eqKey={eq}
      sliderId={sld}
      sliderSection={sec}
      onNavigateToEquation={onNavigateToEquation}
      onNavigateToSlider={onNavigateToSlider}
    />
  );

  return (
    <div className={`w-full text-slate-300 font-mono space-y-6 ${printMode ? 'mt-0' : 'mt-6 overflow-y-auto pr-4 h-[603px]'}`}>
      
      <EquationBlock title="System Cost (Gross)" sectionKey="cost">
        <span className="text-slate-500">GrossCost = </span>
        (<Var name="SystemSizekW" sld="slider-totalSystemSizeKw" sec="system" /> × 1000 × <Var name="CostPerWatt" sld="slider-costPerWatt" sec="system" />) {params.hasBattery ? <>+ (<Var name="BatteryCapacity" sld="slider-batteryCapacityKwh" sec="storage" /> × <Var name="BatteryCostPerKwh" sld="slider-batteryCostPerKwh" sec="storage" />)</> : ''}<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = ({results.systemSizeKW.toFixed(1)}kW × 1000 × ${params.costPerWatt.toFixed(2)}/W) {params.hasBattery ? `+ (${params.batteryCapacityKwh}kWh × $${params.batteryCostPerKwh}/kWh)` : ''}<br/>
          = {formatCurrency(results.systemCost)}
        </span>
      </EquationBlock>

      <EquationBlock title="Net Investment" sectionKey="net">
        <span className="text-slate-500">NetCost = </span>
        <Var name="GrossCost" eq="cost" /> {params.hasIncentives ? <>- (<Var name="Federal Tax Credit" sld="slider-federalTaxCreditPercent" sec="incentives" /> + <Var name="State Rebate" sld="slider-stateRebateAmount" sec="incentives" />)</> : ''}<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {formatCurrency(results.systemCost)} {params.hasIncentives ? `- (${formatCurrency(results.systemCost * (params.federalTaxCreditPercent / 100))} + ${formatCurrency(params.stateRebateAmount)})` : ''}<br/>
          = {formatCurrency(results.netCost)}
        </span>
      </EquationBlock>

      <EquationBlock title="Yearly Generation" sectionKey="yearlygen">
        <span className="text-slate-500">YearlyGeneration = </span>
        <Var name="SystemSizekW" sld="slider-totalSystemSizeKw" sec="system" /> × 1500 kWh/kW {params.hasSolarEfficiency ? <>× <Var name="SolarEfficiency" sld="slider-solarEfficiency" sec="efficiency" /></> : ''}<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.systemSizeKW.toFixed(1)} kW × 1,500 {params.hasSolarEfficiency ? `× ${params.efficiencyMode === 'monthly' ? 'monthly profile' : `${params.solarEfficiency}%`}` : ''}<br/>
          = {results.annualGeneration.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh/year
        </span>
      </EquationBlock>

      <EquationBlock title="Year 1 Bill Without Solar" sectionKey="yr1without">
        <span className="text-slate-500">BillWithoutSolar = </span>
        <Var name="AnnualUsage" sld="slider-monthlyUsageKwh" sec="energy" /> × <Var name="UtilityRate" sld="slider-utilityRate" sec="energy" /><br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.annualUsage.toLocaleString()} kWh × ${activeRate.toFixed(4)}/kWh<br/>
          = {formatCurrency(results.annualUsage * activeRate)}
        </span>
      </EquationBlock>

      <EquationBlock title="Year 1 Bill With Solar" sectionKey="yr1with">
        <span className="text-slate-500">BillWithSolar = </span>
        (<Var name="GridPurchase" eq="grid_purchase" /> × <Var name="UtilityRate" sld="slider-utilityRate" sec="energy" />) - (<Var name="GridSales" eq="gridsales" /> × <Var name="SellBackRate" sld="slider-sellBackRate" sec="energy" />)<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = ({results.annualGridPurchase.toLocaleString(undefined, {maximumFractionDigits:0})} kWh × ${activeRate.toFixed(4)}) - 
          ({results.annualGridSales.toLocaleString(undefined, {maximumFractionDigits:0})} kWh × ${params.sellBackRate.toFixed(2)})<br/>
          = {formatCurrency(results.annualGridPurchase * activeRate - results.annualGridSales * params.sellBackRate)}
        </span>
      </EquationBlock>

      <EquationBlock title="Grid Sales (Sold to Utility)" sectionKey="gridsales">
        <span className="text-slate-500">GridSales = </span>
        Sum over 365 Days of Max(0, DailySolarGen - DirectSolarUsage {params.hasBattery ? <>- BatteryCharge</> : ''})<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = The surplus solar energy generated during daylight hours that cannot be immediately consumed by the building's loads {params.hasBattery ? <>nor stored in the battery (due to it being fully charged)</> : <>and is exported to the grid</>}.<br/>
          = {results.annualGridSales.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh/year
        </span>
      </EquationBlock>

      <EquationBlock title="Exported & Sold" sectionKey="exported_sold">
        <span className="text-slate-500">ExportedRevenue = </span>
        <Var name="GridSales" eq="gridsales" /> × <Var name="SellBackRate" sld="slider-sellBackRate" sec="energy" /><br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.annualGridSales.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh × ${params.sellBackRate.toFixed(2)}/kWh<br/>
          = {formatCurrency(results.annualGridSales * params.sellBackRate)}/year
        </span>
      </EquationBlock>

      <EquationBlock title="Battery Utilization" sectionKey="battery_utilization">
        <span className="text-slate-500">BatteryDraw = </span>
        Cumulative annual storage draw to cover building loads. Managed by <Var name="BatteryCapacity" sld="slider-batteryCapacityKwh" sec="storage" /><br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.annualBatteryDraw.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh/year
        </span>
      </EquationBlock>

      <EquationBlock title="Grid Purchase Needed" sectionKey="grid_purchase">
        <span className="text-slate-500">GridPurchase = </span>
        Total usage unmet by immediate solar generation or <Var name="BatteryDraw" eq="battery_utilization" /><br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.annualGridPurchase.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh/year<br/>
          ≈ {formatCurrency(results.annualGridPurchase * activeRate)} spent on utility purchases (Year 1)
        </span>
      </EquationBlock>

      <EquationBlock title="Year 1 Savings" sectionKey="yr1savings">
        <span className="text-slate-500">Year1Savings = </span>
        <Var name="BillWithoutSolar" eq="yr1without" /> - <Var name="BillWithSolar" eq="yr1with" /> - <Var name="AnnualMaintenance" sld="slider-annualMaintenanceCost" sec="maintenance" /><br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {formatCurrency(results.annualUsage * activeRate)} - 
          {formatCurrency(results.annualGridPurchase * activeRate - results.annualGridSales * params.sellBackRate)} - 
          {formatCurrency(params.hasMaintenance ? params.annualMaintenanceCost : 0)}<br/>
          = {formatCurrency(results.yearOneSavings)}
        </span>
      </EquationBlock>

      <EquationBlock title="25-Year Projection Loop" sectionKey="projection">
        <span className="text-slate-500">For Year 1 to 25:</span><br/>
        <Var name="UtilityRate" sld="slider-utilityRate" sec="energy" />_Y = <Var name="UtilityRate" sld="slider-utilityRate" sec="energy" />_(Y-1) × (1 + <Var name="AnnualBillIncrease" sld="slider-annualBillIncrease" sec="energy" />%)<br/>
        AnnualSavings_Y = (<Var name="BillWithoutSolar" eq="yr1without" />_Y - <Var name="BillWithSolar" eq="yr1with" />_Y) - <Var name="AnnualMaintenance" sld="slider-annualMaintenanceCost" sec="maintenance" /><br/>
        <Var name="CumulativeSavings" eq="cum_savings" /> += AnnualSavings_Y
      </EquationBlock>

      <EquationBlock title="Cumulative Savings Yr-by-Yr" sectionKey="cum_savings">
        <span className="text-slate-500">CumulativeSavings_Y = </span>
        <Var name="CumulativeSavings" eq="cum_savings" />_(Y-1) + AnnualSavings_Y<br/>
        <span className="text-slate-500">Year 25 Total Cumulative Savings = </span>
        Total savings accumulated over 25 years<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {formatCurrency(results.total25YearSavings)}
        </span>
      </EquationBlock>

      <EquationBlock title="Payback Period" sectionKey="payback">
        <span className="text-slate-500">PaybackPeriod = </span>
        Year where <Var name="CumulativeSavings" eq="cum_savings" /> &ge; <Var name="NetCost" eq="net" /><br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.paybackPeriod > 0 
              ? (results.paybackPeriod < 1 ? `${(results.paybackPeriod * 12).toFixed(1)} months` : `${results.paybackPeriod.toFixed(1)} years`) 
              : 'Does not break even within 30 years'}
        </span>
      </EquationBlock>

      <EquationBlock title="25-Year ROI" sectionKey="25yr_roi">
        <span className="text-slate-500">25YearROI = </span>
        (25-Year Net Profit ÷ Total Costs Incurred) × 100<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = ({formatCurrency(results.total25YearSavings)} ÷ ({formatCurrency(results.systemCost)} + <Var name="AnnualMaintenance" sld="slider-annualMaintenanceCost" sec="maintenance" /> × 25)) × 100<br/>
          = {results.roiPercentage.toFixed(1)}%
        </span>
      </EquationBlock>

      <EquationBlock title="Renewable Mix (Green Energy %)" sectionKey="renewable_mix">
        <span className="text-slate-500">RenewableMix% = </span>
        ((<Var name="SolarGenerationUsed" eq="yearlygen" /> + (<Var name="GridPurchase" eq="grid_purchase" /> × <Var name="GridRenewable%" sld="slider-gridRenewablePercentage" sec="energy" />)) ÷ <Var name="AnnualUsage" sld="slider-monthlyUsageKwh" sec="energy" />) × 100<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.co2Impact?.newRenewablePercent.toFixed(1)}% green energy share of total building loads
        </span>
      </EquationBlock>

      <EquationBlock title="CO2 Impact (Tons Saved)" sectionKey="co2">
        <span className="text-slate-500">KWhSaved = </span>
        (<Var name="AnnualUsage" sld="slider-monthlyUsageKwh" sec="energy" /> - (<Var name="AnnualUsage" sld="slider-monthlyUsageKwh" sec="energy" /> × <Var name="GridRenewable%" sld="slider-gridRenewablePercentage" sec="energy" />)) - (<Var name="AnnualUsage" sld="slider-monthlyUsageKwh" sec="energy" /> - NewRenewableKwh)<br/>
        <span className="text-slate-500">CO2TonsSaved = </span>
        KWhSaved × 0.00043 (tons/kWh)<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {results.co2Impact?.co2SavedTonsPerYear.toFixed(2)} tons avoided per year
        </span>
      </EquationBlock>

      <EquationBlock title="CO2 Impact (Equivalent Homes)" sectionKey="co2homes">
        <span className="text-slate-500">EquivalentHomes = </span>
        <Var name="CO2TonsSaved" eq="co2" /> / 4.515<br/>
        <span className="text-emerald-400 mt-3 block/80 text-[15px]">
          = {(results.co2Impact?.co2SavedTonsPerYear / 4.515).toFixed(1)} homes per year
        </span>
      </EquationBlock>

    </div>
  );
}
