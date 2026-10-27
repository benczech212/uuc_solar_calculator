import React, { useState } from 'react';
import { RoiResults } from '../types';
import { formatCurrency } from '../utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Info, Table } from 'lucide-react';

interface MonthlyBalanceChartProps {
  data: RoiResults['monthlyEnergyData'];
  results: RoiResults;
}

export function MonthlyBalanceChart({ data, results }: MonthlyBalanceChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Prepare and calculate monthly balance data
  const chartData = data.map(m => {
    // Falls back to direct calculation if not explicitly stored
    const gen = m.generation !== undefined ? m.generation : results.annualGeneration / 12;
    const use = m.usage !== undefined ? m.usage : (m.solarConsumed + m.gridRenewable + m.gridNonRenewable);
    const balance = gen - use;
    return {
      month: m.monthName,
      generation: Math.round(gen),
      usage: Math.round(use),
      balance: Math.round(balance),
    };
  });

  // Calculate high-level summary statistics
  const totalAnnualOverage = chartData.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0);
  const totalAnnualShortage = chartData.reduce((acc, curr) => acc + (curr.balance < 0 ? Math.abs(curr.balance) : 0), 0);
  
  const bestMonth = [...chartData].sort((a, b) => b.balance - a.balance)[0];
  const worstMonth = [...chartData].sort((a, b) => a.balance - b.balance)[0];

  if (!bestMonth || !worstMonth) {
    return <p className="text-sm text-slate-500 py-12 text-center">No monthly data to show yet.</p>;
  }

  const netAnnualBalance = results.annualGeneration - results.annualUsage;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isOverage = dataPoint.balance >= 0;
      return (
        <div className="bg-slate-900 border border-slate-700/60 p-3.5 rounded-xl shadow-xl font-mono text-xs text-slate-300">
          <p className="text-slate-100 font-bold mb-2 uppercase tracking-wider">{dataPoint.month} Energy Profile</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Solar Generation:</span>
              <span className="text-amber-400 font-semibold">{dataPoint.generation.toLocaleString()} kWh</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Grid/Building Usage:</span>
              <span className="text-sky-400 font-semibold">{dataPoint.usage.toLocaleString()} kWh</span>
            </div>
            <div className="border-t border-slate-800/80 my-1.5" />
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Net Balance:</span>
              <span className={`font-bold ${isOverage ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isOverage ? '+' : ''}{dataPoint.balance.toLocaleString()} kWh
                {isOverage ? ' (Surplus)' : ' (Shortage)'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full text-slate-300 space-y-6 mt-4">
      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Annual Overview */}
        <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">Net Annual Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-mono font-bold ${netAnnualBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netAnnualBalance >= 0 ? '+' : ''}{netAnnualBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs text-slate-500 font-sans">kWh</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-3">
            {netAnnualBalance >= 0 
              ? "Your solar array is net-positive across the full annual cycle." 
              : "Building loads exceed total annual solar electricity generation."}
          </p>
        </div>

        {/* Metric 2: Peak Surplus Month */}
        <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">Peak Monthly Surplus</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-mono font-bold text-emerald-400">
                {bestMonth.balance > 0 ? '+' : ''}{bestMonth.balance.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-500/70 font-sans">kWh ({bestMonth.month})</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-3">
            Solar generation peak. Maximizes sold energy exports back to the grid.
          </p>
        </div>

        {/* Metric 3: Deepest Shortage Month */}
        <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">Max Monthly Deficit</span>
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-mono font-bold text-rose-400">
                {worstMonth.balance.toLocaleString()}
              </span>
              <span className="text-xs text-rose-500/70 font-sans">kWh ({worstMonth.month})</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-3">
            Winter solar minimum or peak cooling usage triggers grid draw dependence.
          </p>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-900 shadow-inner relative">
        <h4 className="text-xs uppercase tracking-widest font-mono text-slate-400 mb-6 flex items-center justify-between">
          <span>Projected Monthly Balance Net Profile (kWh)</span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-sans">
            <Info className="w-3.5 h-3.5" /> Hover bars to inspect exact details
          </span>
        </h4>
        
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.2 }} />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              <Bar dataKey="balance">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.balance >= 0 ? 'url(#greenGlow)' : 'url(#redGlow)'} 
                  />
                ))}
              </Bar>

              {/* Define gradients for beautiful neon glows in dark mode */}
              <defs>
                <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.25} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex gap-6 justify-center text-xs font-mono mt-2 pt-4 border-t border-slate-900/80">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#10b981] to-[#059669] border border-emerald-500/30" />
            <span className="text-emerald-400">Net Surplus / Overage (kWh)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#f43f5e] to-[#e11d48] border border-rose-500/30" />
            <span className="text-rose-400">Net Deficit / Shortage (kWh)</span>
          </span>
        </div>
      </div>

      {/* Toggle Table Data */}
      <div className="flex justify-end pr-1">
        <button
          onClick={() => setShowTable(!showTable)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/90 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Table className="w-4 h-4 text-amber-500/70" />
          <span>{showTable ? 'Hide Tabular Log' : 'Show Monthly Numbers'}</span>
        </button>
      </div>

      {showTable && (
        <div className="bg-slate-950/40 border border-slate-900 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950 text-slate-400">
                <th className="py-2.5 px-4 font-normal uppercase tracking-wider text-[11px]">Month</th>
                <th className="py-2.5 px-4 font-normal uppercase tracking-wider text-[11px] text-amber-500">Generation</th>
                <th className="py-2.5 px-4 font-normal uppercase tracking-wider text-[11px] text-sky-400">Usage</th>
                <th className="py-2.5 px-4 font-normal uppercase tracking-wider text-[11px] text-slate-300">Net Balance</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => (
                <tr key={i} className="border-b border-slate-900/40 hover:bg-slate-900/30">
                  <td className="py-2.5 px-4 text-slate-300 font-semibold">{row.month}</td>
                  <td className="py-2.5 px-4 text-amber-400">{row.generation.toLocaleString()} kWh</td>
                  <td className="py-2.5 px-4 text-sky-400">{row.usage.toLocaleString()} kWh</td>
                  <td className={`py-2.5 px-4 font-bold ${row.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.balance >= 0 ? '+' : ''}{row.balance.toLocaleString()} kWh
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
