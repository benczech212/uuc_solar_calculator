import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SensitivityData, SensitivityVariable } from '../types';
import { formatCurrency } from '../utils';
import { C, axisProps, tooltipStyle, compactUsd, Legend, Note } from './chartTheme';

interface ChartProps {
  data: SensitivityData[];
  variable: SensitivityVariable;
  metric: 'profit' | 'breakeven' | 'both' | 'slope';
  onApplyExtrema?: (value: number) => void;
  currentValue?: number;
}

const VARS: Record<SensitivityVariable, { name: string; fmt: (v: number) => string }> = {
  systemSize: { name: 'system size', fmt: (v) => `${v.toFixed(1)} kW` },
  battery: { name: 'battery size', fmt: (v) => `${Math.round(v)} kWh` },
  interestRate: { name: 'interest rate', fmt: (v) => `${v.toFixed(2)}%` },
  downPayment: { name: 'down payment', fmt: (v) => formatCurrency(v) },
  loanTerm: { name: 'loan length', fmt: (v) => `${Math.round(v)} yrs` },
};

const yrs = (v: number) => (v >= 30 ? '30+ yrs' : `${v.toFixed(1)} yrs`);

function Option({ title, p, value, tone, v, edge, onApply }: { title: string; p: SensitivityData; value: string; tone: string; v: { name: string; fmt: (x: number) => string }; edge: boolean; onApply?: (x: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onApply?.(p.xValue)}
      className="text-left bg-slate-950/40 border border-slate-800 hover:border-amber-500/50 rounded-lg p-3 transition-colors"
      title={`Set the ${v.name} to ${v.fmt(p.xValue)}`}
    >
      <span className="block text-xs text-slate-400">{title}</span>
      <span className={`block text-xl font-mono ${tone}`}>{value}</span>
      <span className="block text-xs text-slate-500">at {v.fmt(p.xValue)}{edge ? ' (edge of range)' : ''} · <span className="text-amber-400">use this</span></span>
    </button>
  );
}

// "What if": re-runs the whole model across a range of one setting and plots the results,
// with the current setting marked and the best points one click away.
export function SensitivityChart({ data, variable, metric, onApplyExtrema, currentValue }: ChartProps) {
  if (data.length < 2) return <p className="text-sm text-slate-500 py-12 text-center">Working it out…</p>;
  const v = VARS[variable];
  const showProfit = metric === 'profit' || metric === 'both';
  const showPayback = metric === 'breakeven' || metric === 'both';

  const paying = data.filter(d => d.paybackPeriod > 0 && d.paybackPeriod < 30);
  const fastest = paying.length ? paying.reduce((a, b) => (b.paybackPeriod < a.paybackPeriod ? b : a)) : null;
  const best = data.reduce((a, b) => (b.netProfit > a.netProfit ? b : a));
  const here = currentValue === undefined ? null : data.reduce((a, b) => (Math.abs(b.xValue - currentValue) < Math.abs(a.xValue - currentValue) ? b : a));
  const edge = (p: SensitivityData) => p === data[0] || p === data[data.length - 1];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {here && (
          <div className="bg-slate-950/40 border border-indigo-400/30 rounded-lg p-3">
            <span className="block text-xs text-slate-400">Your setting now</span>
            <span className="block text-xl font-mono text-white">{v.fmt(currentValue!)}</span>
            <span className="block text-xs text-slate-500">{formatCurrency(here.netProfit)} · payback {yrs(here.paybackPeriod)}</span>
          </div>
        )}
        <Option v={v} edge={edge(best)} onApply={onApplyExtrema} title="Most 25-year savings" p={best} value={formatCurrency(best.netProfit)} tone="text-emerald-400" />
        {fastest && <Option v={v} edge={edge(fastest)} onApply={onApplyExtrema} title="Fastest payback" p={fastest} value={yrs(fastest.paybackPeriod)} tone="text-amber-400" />}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 8, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
            <XAxis {...axisProps} dataKey="xValue" type="number" domain={['dataMin', 'dataMax']} tickFormatter={v.fmt} tickCount={6} />
            {showProfit &&<YAxis {...axisProps} yAxisId="profit" tickFormatter={compactUsd} width={56} stroke={C.savings} tick={{ fill: C.savings, fontSize: 12 }} />}
            {showPayback && <YAxis {...axisProps} yAxisId="payback" orientation="right" width={52} domain={[0, 'auto']} tickFormatter={(x: number) => `${Number(x).toFixed(0)} yr`} stroke={C.solar} tick={{ fill: C.solar, fontSize: 12 }} />}
            {metric === 'slope' && <YAxis {...axisProps} yAxisId="slope" tickFormatter={compactUsd} width={56} />}
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(_, p) => (p?.[0] ? `${v.name[0].toUpperCase()}${v.name.slice(1)}: ${v.fmt((p[0].payload as SensitivityData).xValue)}` : '')}
              formatter={(val: number, name: string) =>
                name === 'payback' ? [yrs(val), 'Payback'] :
                name === 'slope' ? [`${formatCurrency(val)} per unit`, 'Extra savings per step'] :
                [formatCurrency(val), '25-year savings']}
            />
            {showProfit &&<Line yAxisId="profit" dataKey="netProfit" name="profit" stroke={C.savings} strokeWidth={2.5} dot={false} type="monotone" />}
            {showPayback && <Line yAxisId="payback" dataKey="paybackPeriod" name="payback" stroke={C.solar} strokeWidth={2.5} dot={false} type="monotone" />}
            {metric === 'slope' && <Line yAxisId="slope" dataKey="profitSlope" name="slope" stroke={C.current} strokeWidth={2.5} dot={false} type="monotone" />}
            {metric === 'slope' && <ReferenceLine yAxisId="slope" y={0} stroke={C.axis} strokeDasharray="4 4" />}
            {currentValue !== undefined && (
              <ReferenceLine yAxisId={metric === 'slope' ? 'slope' : showProfit ? 'profit' : 'payback'} x={currentValue} stroke={C.current} strokeDasharray="4 4"
                label={{ value: 'You', position: 'top', fill: C.current, fontSize: 12 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[
        ...(showProfit ?[{ color: C.savings, label: '25-year savings (left scale)' }] : []),
        ...(showPayback ? [{ color: C.solar, label: 'Years to pay back (right scale)' }] : []),
        ...(metric === 'slope' ? [{ color: C.current, label: 'Extra 25-year savings from one more step' }] : []),
      ]} />
      <Note>
        Each point re-runs the whole calculation with only the {v.name} changed; everything else stays as you set it.
        {variable === 'systemSize' && ' Cost scales with size at your current price per watt. Bigger keeps paying here because Duke credits extra solar at the full rate; credits left at year-end are paid at a much lower rate, which this model does not include.'}
        {metric === 'slope' && ' Where the line drops below zero, making it bigger starts to cost more than it saves.'}
      </Note>
    </div>
  );
}
