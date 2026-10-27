import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthEnergyData } from '../types';
import { C, axisProps, tooltipStyle, Facts, Legend, Note } from './chartTheme';

interface RenewabilityChartProps {
  data: MonthEnergyData[];
  gridRenewablePercent?: number;
}

const SERIES = [
  { key: 'solar', label: 'Your solar', color: C.solar },
  { key: 'clean', label: 'Clean grid power', color: C.gridClean },
  { key: 'fossil', label: 'Fossil grid power', color: C.gridFossil },
] as const;

// Energy mix: where each month's electricity comes from, as shares of that month's use.
export const RenewabilityChart: React.FC<RenewabilityChartProps> = ({ data, gridRenewablePercent }) => {
  const rows = data.map(d => {
    const total = d.solarConsumed + d.gridRenewable + d.gridNonRenewable;
    const pct = (x: number) => (total > 0 ? (x / total) * 100 : 0);
    return {
      month: d.monthName,
      solar: pct(d.solarConsumed), clean: pct(d.gridRenewable), fossil: pct(d.gridNonRenewable),
      kwh: { solar: d.solarConsumed, clean: d.gridRenewable, fossil: d.gridNonRenewable },
    };
  });
  if (rows.length === 0) return <p className="text-sm text-slate-500 py-12 text-center">No monthly data to show yet.</p>;

  const sum = (k: 'solar' | 'clean' | 'fossil') => data.reduce((a, d) => a + (k === 'solar' ? d.solarConsumed : k === 'clean' ? d.gridRenewable : d.gridNonRenewable), 0);
  const total = sum('solar') + sum('clean') + sum('fossil');
  const yearClean = total > 0 ? ((sum('solar') + sum('clean')) / total) * 100 : 0;

  return (
    <div>
      <Facts items={[
        { label: 'Clean power before solar', value: `${Math.round(gridRenewablePercent ?? 0)}%`, note: 'the grid’s renewable share' },
        { label: 'Clean power with solar', value: `${Math.round(yearClean)}%`, tone: 'good', note: 'your solar plus clean grid power' },
        { label: 'Covered by your solar', value: `${Math.round(total > 0 ? (sum('solar') / total) * 100 : 0)}%`, tone: 'sun', note: 'of the year’s use, month by month' },
      ]} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
            <XAxis {...axisProps} dataKey="month" interval={0} />
            <YAxis {...axisProps} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} width={44} />
            <Tooltip
              {...tooltipStyle}
              cursor={{ fill: '#1e293b66' }}
              formatter={(v: number, key: string, item: any) => [
                `${v.toFixed(0)}% (${Math.round(item.payload.kwh[key]).toLocaleString()} kWh)`,
                SERIES.find(s => s.key === key)?.label ?? key,
              ]}
            />
            {SERIES.map(s => <Bar key={s.key} dataKey={s.key} stackId="mix" fill={s.color} maxBarSize={36} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={SERIES.map(s => ({ color: s.color, label: s.label }))} />
      <Note>
        Each month, “your solar” is the solar made that month, up to what UUC used. Extra solar in a sunny month earns
        credits but isn’t counted toward other months, so this is a conservative view of how clean UUC’s power is.
      </Note>
    </div>
  );
};
