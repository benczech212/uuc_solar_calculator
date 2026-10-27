import React from 'react';
import { TrendingUp, X } from 'lucide-react';
import { Stat, cn } from './ui';
import { RoiResults } from '../types';
import { formatCurrency, HOME_ELECTRIC_CO2_TONS } from '../utils';

interface ResultsSummaryProps {
  results: RoiResults;
  compare: RoiResults | null;
  compareLabel?: string;
  onClearCompare: () => void;
  onExplain: (key: string, e?: React.MouseEvent) => void;
  sellBackRate: number;
}

// "+$1,200 vs. other" in green when it is better, red when worse.
function Delta({ now, other, fmt, higherIsBetter = true }: { now: number; other: number; fmt: (v: number) => string; higherIsBetter?: boolean }) {
  const diff = now - other;
  if (Math.abs(diff) < 1e-6) return <span className="text-slate-500">no change</span>;
  const better = higherIsBetter ? diff > 0 : diff < 0;
  return <span className={better ? 'text-emerald-400' : 'text-rose-400'}>{diff > 0 ? '+' : '−'}{fmt(Math.abs(diff))} vs. other</span>;
}

export function ResultsSummary({ results, compare, compareLabel, onClearCompare, onExplain, sellBackRate }: ResultsSummaryProps) {
  const paysBack = results.paybackPeriod > 0 && results.paybackPeriod <= 25;
  const kwh = (v: number) => `${Math.round(v).toLocaleString()} kWh`;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
      {compare && (
        <div className="flex items-center justify-between gap-3 bg-indigo-500/10 border border-indigo-400/30 rounded-lg px-3 py-2 text-sm text-indigo-200">
          <span>Comparing against the same setup {compareLabel}. Differences show under each number.</span>
          <button type="button" onClick={onClearCompare} className="text-indigo-300 hover:text-white shrink-0" title="Stop comparing"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <button type="button" onClick={(e) => onExplain(paysBack ? 'payback' : 'projection', e)} className="text-left group" title="See how this is calculated">
          <span className="flex items-center gap-2 text-sm text-amber-400 font-semibold">
            <TrendingUp className="w-4 h-4" /> {paysBack ? 'Pays for itself in' : 'Over 25 years'}
          </span>
          {paysBack ? (
            <span className="flex items-baseline gap-2">
              <span className="text-5xl font-light text-white tracking-tight group-hover:text-amber-300 transition-colors">{results.paybackPeriod.toFixed(1)}</span>
              <span className="text-xl text-slate-400">years</span>
            </span>
          ) : (
            <span className="block">
              <span className="text-4xl font-light text-rose-400">{formatCurrency(results.total25YearSavings)}</span>
              <span className="block text-sm text-slate-400">
                {results.paybackPeriod > 25 ? `Breaks even after ${results.paybackPeriod.toFixed(1)} years, past the panels' 25-year life` : 'Never breaks even with these settings'}
              </span>
            </span>
          )}
          {compare && compare.paybackPeriod > 0 && paysBack && (
            <span className="block text-sm font-mono"><Delta now={results.paybackPeriod} other={compare.paybackPeriod} fmt={(v) => `${v.toFixed(1)} yrs`} higherIsBetter={false} /></span>
          )}
        </button>
        <button type="button" onClick={(e) => onExplain('cost', e)} className="text-right" title="See how this is calculated">
          <span className="block text-sm text-slate-400">System size</span>
          <span className="block text-3xl font-mono text-amber-400">{results.systemSizeKW.toFixed(1)} <span className="text-lg text-amber-500/60">kW</span></span>
          <span className="block text-xs text-slate-500">covers {Math.round(results.systemOffset)}% of yearly use</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Cost after credits" value={formatCurrency(results.netCost)} onClick={(e) => onExplain('net', e)}
          delta={compare && <Delta now={results.netCost} other={compare.netCost} fmt={formatCurrency} higherIsBetter={false} />} />
        <Stat label="First-year savings" value={formatCurrency(results.yearOneSavings)} tone={results.yearOneSavings >= 0 ? 'good' : 'bad'} onClick={(e) => onExplain('yr1savings', e)}
          delta={compare && <Delta now={results.yearOneSavings} other={compare.yearOneSavings} fmt={formatCurrency} />} />
        <Stat label="25-year net savings" value={formatCurrency(results.total25YearSavings)} tone={results.total25YearSavings >= 0 ? 'good' : 'bad'} onClick={(e) => onExplain('projection', e)}
          delta={compare && <Delta now={results.total25YearSavings} other={compare.total25YearSavings} fmt={formatCurrency} />} />
        <Stat label="25-year return" value={`${results.roiPercentage > 0 ? '+' : ''}${results.roiPercentage.toFixed(0)}%`} tone={results.roiPercentage >= 0 ? 'good' : 'bad'}
          sub="savings ÷ total cost" onClick={(e) => onExplain('25yr_roi', e)} />
      </div>

      <details className="group">
        <summary className={cn('cursor-pointer list-none text-sm text-slate-400 hover:text-slate-200 select-none')}>
          <span className="group-open:hidden">Show energy and carbon details ▾</span>
          <span className="hidden group-open:inline">Hide energy and carbon details ▴</span>
        </summary>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          <Stat label="Solar made per year" value={kwh(results.annualGeneration)} tone="sun" onClick={(e) => onExplain('yearlygen', e)}
            delta={compare && <Delta now={results.annualGeneration} other={compare.annualGeneration} fmt={kwh} />} />
          <Stat label="Extra sold to the grid" value={kwh(results.annualGridSales)} tone="good" sub={`earns about ${formatCurrency(results.annualGridSales * sellBackRate)}`} onClick={(e) => onExplain('exported_sold', e)} />
          <Stat label="Still bought from the grid" value={kwh(results.annualGridPurchase)} tone="bad" onClick={(e) => onExplain('grid_purchase', e)} />
          <Stat label="Drawn from battery" value={kwh(results.annualBatteryDraw)} onClick={(e) => onExplain('battery_utilization', e)} />
          <Stat label="Renewable share" value={`${results.co2Impact.newRenewablePercent.toFixed(0)}%`} tone="good"
            sub={`was ${results.co2Impact.currentRenewablePercent.toFixed(0)}%`} onClick={(e) => onExplain('co2', e)} />
          <Stat label="CO₂ avoided per year" value={`${results.co2Impact.co2SavedTonsPerYear.toFixed(1)} tons`} tone="sky"
            sub={`like ${(results.co2Impact.co2SavedTonsPerYear / HOME_ELECTRIC_CO2_TONS).toFixed(1)} homes' electricity`} onClick={(e) => onExplain('co2homes', e)} />
        </div>
      </details>
    </div>
  );
}
