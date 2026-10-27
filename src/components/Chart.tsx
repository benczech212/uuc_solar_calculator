import React, { useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { YearlyData } from '../types';
import { formatCurrency } from '../utils';
import { C, axisProps, tooltipStyle, compactUsd, Facts, Legend, Note } from './chartTheme';

interface ChartProps {
  data: YearlyData[];
  paybackPeriod: number;
  compareData?: YearlyData[];
  comparePaybackPeriod?: number;
}

const NAMES: Record<string, string> = {
  cumulativeSavings: 'Saved so far',
  netCost: 'Paid so far',
  compCumulativeSavings: 'Saved so far (other)',
  compNetCost: 'Paid so far (other)',
};

// Savings over time: what has been paid out vs. what the lower bills have saved,
// year by year. Where the green line crosses the red one, the system has paid for itself.
export function RoiChart({ data, paybackPeriod, compareData, comparePaybackPeriod }: ChartProps) {
  const merged = useMemo(() => data.map((d, i) => ({
    ...d,
    compNetCost: compareData?.[i]?.netCost,
    compCumulativeSavings: compareData?.[i]?.cumulativeSavings,
  })), [data, compareData]);

  const last = data[data.length - 1];
  if (!last) return <p className="text-sm text-slate-500 py-12 text-center">No projection to show.</p>;
  const pays = paybackPeriod > 0 && paybackPeriod <= 25;

  return (
    <div>
      <Facts items={[
        { label: 'Paid over 25 years', value: formatCurrency(last.netCost), tone: 'bad', note: 'after credits, with loan and upkeep' },
        { label: 'Saved on bills over 25 years', value: formatCurrency(last.cumulativeSavings), tone: 'good' },
        { label: pays ? 'Breaks even' : 'Break-even', value: pays ? `year ${paybackPeriod.toFixed(1)}` : 'not within 25 yrs', tone: pays ? 'sun' : 'bad' },
      ]} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={merged} margin={{ top: 20, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSaved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.savings} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.savings} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
            <XAxis {...axisProps} dataKey="year" type="number" domain={[1, 25]} ticks={[1, 5, 10, 15, 20, 25]} tickFormatter={(v) => `Yr ${v}`} />
            <YAxis {...axisProps} tickFormatter={compactUsd} width={56} />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(l) => `Year ${l}`}
              formatter={(v: number, name: string) => [formatCurrency(v), NAMES[name] ?? name]}
            />
            <Area type="monotone" dataKey="cumulativeSavings" name="cumulativeSavings" stroke={C.savings} strokeWidth={2.5} fill="url(#fillSaved)" />
            <Line type="monotone" dataKey="netCost" name="netCost" stroke={C.cost} strokeWidth={2.5} dot={false} />
            {compareData && <Line type="monotone" dataKey="compCumulativeSavings" name="compCumulativeSavings" stroke={C.savings} strokeDasharray="6 4" strokeWidth={1.5} dot={false} />}
            {compareData && <Line type="monotone" dataKey="compNetCost" name="compNetCost" stroke={C.cost} strokeDasharray="6 4" strokeWidth={1.5} dot={false} />}
            {pays && (
              <ReferenceLine x={paybackPeriod} stroke={C.solar} strokeDasharray="4 4"
                label={{ value: `Breaks even (yr ${paybackPeriod.toFixed(1)})`, position: 'top', fill: C.solar, fontSize: 12 }} />
            )}
            {compareData && comparePaybackPeriod !== undefined && comparePaybackPeriod > 0 && comparePaybackPeriod <= 25 && (
              <ReferenceLine x={comparePaybackPeriod} stroke={C.current} strokeDasharray="2 4"
                label={{ value: 'other', position: 'insideBottomRight', fill: C.current, fontSize: 11 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[
        { color: C.savings, label: 'Saved on bills so far' },
        { color: C.cost, label: 'Paid so far' },
        ...(compareData ? [{ color: C.axis, label: 'Dashed: the setup you’re comparing against', dashed: true }] : []),
      ]} />
      <Note>
        “Paid so far” is the cash actually spent by each year: the up-front payment or loan payments, plus upkeep, minus
        tax credits (received in year 2). Savings grow faster over time because electricity prices rise each year.
      </Note>
    </div>
  );
}
