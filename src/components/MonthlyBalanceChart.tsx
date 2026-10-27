import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table } from 'lucide-react';
import { RoiResults } from '../types';
import { C, axisProps, tooltipStyle, compactKwh, Facts, Legend, Note } from './chartTheme';

interface MonthlyBalanceChartProps {
  data: RoiResults['monthlyEnergyData'];
  results: RoiResults;
}

const kwh = (v: number) => `${Math.round(v).toLocaleString()} kWh`;

// Monthly balance: solar made next to electricity used, for each month.
export function MonthlyBalanceChart({ data, results }: MonthlyBalanceChartProps) {
  const [showTable, setShowTable] = useState(false);

  const rows = data.map(m => {
    const solar = m.generation ?? results.annualGeneration / 12;
    const use = m.usage ?? (m.solarConsumed + m.gridRenewable + m.gridNonRenewable);
    return { month: m.monthName, solar: Math.round(solar), use: Math.round(use), balance: Math.round(solar - use) };
  });
  if (rows.length === 0) return <p className="text-sm text-slate-500 py-12 text-center">No monthly data to show yet.</p>;

  const totalSolar = rows.reduce((a, r) => a + r.solar, 0);
  const totalUse = rows.reduce((a, r) => a + r.use, 0);
  const surplusMonths = rows.filter(r => r.balance > 0);
  const worst = rows.reduce((a, r) => (r.balance < a.balance ? r : a));
  const coverage = totalUse > 0 ? (totalSolar / totalUse) * 100 : 0;

  return (
    <div>
      <Facts items={[
        { label: 'Solar covers', value: `${Math.round(coverage)}%`, tone: coverage >= 100 ? 'good' : 'sun', note: `of the year’s use (${compactKwh(totalSolar)} of ${compactKwh(totalUse)} kWh)` },
        { label: 'Months with extra solar', value: `${surplusMonths.length} of 12`, tone: surplusMonths.length ? 'good' : 'default', note: surplusMonths.length ? surplusMonths.map(r => r.month).join(', ') : 'none' },
        { label: 'Biggest shortfall', value: worst.balance < 0 ? kwh(-worst.balance) : 'none', tone: worst.balance < 0 ? 'bad' : 'good', note: worst.balance < 0 ? `in ${worst.month}, bought from the grid` : 'solar covers every month' },
      ]} />

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
            <XAxis {...axisProps} dataKey="month" interval={0} />
            <YAxis {...axisProps} tickFormatter={compactKwh} width={44} />
            <Tooltip
              {...tooltipStyle}
              cursor={{ fill: '#1e293b66' }}
              formatter={(v: number, name: string) => [kwh(v), name === 'solar' ? 'Solar made' : 'Electricity used']}
              labelFormatter={(l, p) => {
                const r = p?.[0]?.payload as typeof rows[number] | undefined;
                return r ? `${l}: ${r.balance >= 0 ? `${kwh(r.balance)} extra` : `${kwh(-r.balance)} short`}` : l;
              }}
            />
            <Bar dataKey="use" name="use" fill={C.use} radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Bar dataKey="solar" name="solar" fill={C.solar} radius={[3, 3, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ color: C.use, label: 'Electricity used' }, { color: C.solar, label: 'Solar made' }]} />
      <Note>
        In months where solar makes more than UUC uses, the extra goes to the grid as a credit for later months.
        Shortfall months are covered by grid power and those credits.
      </Note>

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={() => setShowTable(s => !s)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
        >
          <Table className="w-4 h-4" /> {showTable ? 'Hide numbers' : 'Show the numbers'}
        </button>
      </div>
      {showTable && (
        <div className="mt-3 overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs">
              <tr>
                <th className="text-left font-medium py-2 px-3">Month</th>
                <th className="text-right font-medium py-2 px-3">Used</th>
                <th className="text-right font-medium py-2 px-3">Solar</th>
                <th className="text-right font-medium py-2 px-3">Difference</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map(r => (
                <tr key={r.month} className="border-t border-slate-800/60">
                  <td className="py-1.5 px-3 font-sans text-slate-300">{r.month}</td>
                  <td className="py-1.5 px-3 text-right text-sky-300">{r.use.toLocaleString()}</td>
                  <td className="py-1.5 px-3 text-right text-amber-300">{r.solar.toLocaleString()}</td>
                  <td className={`py-1.5 px-3 text-right ${r.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{r.balance > 0 ? '+' : ''}{r.balance.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t border-slate-700 font-semibold">
                <td className="py-1.5 px-3 font-sans text-slate-200">Year</td>
                <td className="py-1.5 px-3 text-right text-sky-300">{totalUse.toLocaleString()}</td>
                <td className="py-1.5 px-3 text-right text-amber-300">{totalSolar.toLocaleString()}</td>
                <td className={`py-1.5 px-3 text-right ${totalSolar >= totalUse ? 'text-emerald-400' : 'text-rose-400'}`}>{totalSolar - totalUse > 0 ? '+' : ''}{(totalSolar - totalUse).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-500 px-3 py-2">All figures in kWh.</p>
        </div>
      )}
    </div>
  );
}
