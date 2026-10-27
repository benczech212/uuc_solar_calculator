import React from 'react';
import { SolarParams } from '../types';
import { formatCurrency } from '../utils';
import { RoiChart } from './Chart';
import { RenewabilityChart } from './RenewabilityChart';
import { OutageChart } from './OutageChart';
import { PiggyBank, Leaf, TrendingUp, Zap, ShieldAlert, Sun, Calculator } from 'lucide-react';
import { ExecutiveSummary } from './ExecutiveSummary';
import { Equations } from './Equations';

interface PdfReportProps {
  params: SolarParams;
  results: any;
  vendorName?: string;
}

export const PdfReport: React.FC<PdfReportProps & { isHidden?: boolean }> = ({ params, results, vendorName, isHidden = true }) => {
  return (
    <div 
      id={isHidden ? "pdf-report-container-hidden" : "pdf-report-container"} 
      className={isHidden 
        ? "absolute top-[-20000px] left-0 w-[1000px] bg-[#020617] text-slate-200 p-12 overflow-hidden flex flex-col gap-8 z-[-100]" 
        : "w-[1000px] bg-[#020617] text-slate-200 p-12 overflow-hidden flex flex-col gap-8 mx-auto shrink-0 shadow-2xl ring-1 ring-white/10 my-auto"}
    >
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400">By Ben Czech</span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-white mb-2">UUC Solar ROI <span className="text-slate-500 italic font-serif">Projection</span></h1>
          <p className="text-slate-400">25-Year Projection Summary</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-slate-500">SYSTEM SIZE</p>
          <p className="text-2xl text-amber-400 font-mono tracking-tight">{results.systemSizeKW.toFixed(1)} kW</p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-slate-500" />
            <p className="text-xs uppercase text-slate-500">Net System Cost</p>
          </div>
          <p className="text-3xl text-white font-mono">{formatCurrency(results.netCost)}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-xs uppercase text-emerald-500">25-Year Value</p>
          </div>
          <p className="text-3xl text-emerald-400 font-mono">{formatCurrency(results.total25YearSavings)}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <p className="text-xs uppercase text-amber-500">Break-even</p>
          </div>
          <p className="text-3xl text-white font-light">
            {results.paybackPeriod > 0 && results.paybackPeriod <= 25 ? (
              <>{results.paybackPeriod.toFixed(1)} <span className="text-lg text-slate-400 font-serif italic">Years</span></>
            ) : "Never"}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <p className="text-xs uppercase text-emerald-500">CO2 / Year</p>
          </div>
          <p className="text-3xl text-emerald-400 font-mono">{results.co2Impact.co2SavedTonsPerYear.toFixed(1)} <span className="text-lg text-emerald-500/50">Tons</span></p>
        </div>
      </div>

      <ExecutiveSummary params={params} results={results} vendorName={vendorName} />

      {/* Grid containing charts */}
      <div className="flex flex-col gap-8">
        
        {/* Cost vs Savings Over Time */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-light text-white">25-Year Cost vs Savings</h2>
          </div>
          <div className="w-full">
            <RoiChart data={results.chartData} paybackPeriod={results.paybackPeriod} />
          </div>
        </div>

        {/* Energy Mix & Environmental Impact */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 page-break-inside-avoid">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-light text-white">Energy Renewability Transition</h2>
            </div>
          </div>
          <div className="w-full">
            <RenewabilityChart data={results.monthlyEnergyData} gridRenewablePercent={params.gridRenewablePercentage} />
          </div>
        </div>

        {/* Resilience */}
        {params.hasBattery && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-light text-white">Outage Resilience Profile</h2>
            </div>
            <div className="w-full">
              <OutageChart data={results.outageResilience} />
            </div>
          </div>
        )}

      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 page-break-inside-avoid">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-light text-white">Math & Equations</h2>
          </div>
        </div>
        <Equations params={params} results={results} printMode={true} />
      </div>
    </div>
  );
};
