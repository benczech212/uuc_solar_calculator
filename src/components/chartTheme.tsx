import React from 'react';
import { cn } from './ui';

// One palette and axis style for every chart, so the same thing is always the same colour.
export const C = {
  solar: '#f59e0b',      // solar made
  use: '#38bdf8',        // electricity used
  savings: '#10b981',    // money saved / good
  cost: '#f43f5e',       // money spent / shortfall
  gridClean: '#4ade80',  // renewable grid power
  gridFossil: '#64748b', // fossil grid power
  current: '#818cf8',    // "you are here" marker
  grid: '#1e293b',
  axis: '#94a3b8',
};

export const axisProps = {
  stroke: C.axis,
  tickLine: false,
  axisLine: false,
  tick: { fill: C.axis, fontSize: 12 },
} as const;

export const tooltipStyle = {
  contentStyle: { backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 13 },
  labelStyle: { color: '#e2e8f0', fontWeight: 600, marginBottom: 4 },
  itemStyle: { padding: 0 },
} as const;

export const compactUsd = (v: number) => {
  const a = Math.abs(v);
  const s = a >= 1e6 ? `$${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `$${Math.round(a / 1e3)}k` : `$${Math.round(a)}`;
  return v < 0 ? `−${s}` : s;
};
export const compactKwh = (v: number) => (Math.abs(v) >= 1000 ? `${Number((v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1))}k` : `${Math.round(v)}`);

// A row of headline facts above a chart: the answer first, then the picture.
export function Facts({ items }: { items: { label: string; value: React.ReactNode; tone?: 'good' | 'bad' | 'sun' | 'sky' | 'default'; note?: string }[] }) {
  const color = { good: 'text-emerald-400', bad: 'text-rose-400', sun: 'text-amber-400', sky: 'text-sky-400', default: 'text-white' };
  return (
    <div className={cn('grid gap-2 mb-4', items.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
      {items.map(f => (
        <div key={f.label} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400">{f.label}</p>
          <p className={cn('text-xl font-mono mt-0.5', color[f.tone ?? 'default'])}>{f.value}</p>
          {f.note && <p className="text-xs text-slate-500 mt-0.5">{f.note}</p>}
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-2 text-xs text-slate-300">
      {items.map(i => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={i.dashed ? { border: `2px dashed ${i.color}` } : { backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-500 mt-3 leading-relaxed">{children}</p>;
}
