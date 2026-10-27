import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Bookmark, Trash2, Upload, Pencil, Check } from 'lucide-react';
import { Scenario, Compared, describeDiff, compareSentences, goalVerdict, METRICS } from '../scenarios';
import { Goal } from '../goals';
import { formatCurrency } from '../utils';
import { C, axisProps, tooltipStyle, compactUsd, Legend, Note } from './chartTheme';
import { cn, btn } from './ui';

// Save the current settings as a named scenario, tick which ones to compare,
// rename, load back into the inputs, or delete.
export function ScenarioManager({ scenarios, colors, onSave, onToggle, onRename, onLoad, onDelete }: {
  scenarios: Scenario[];
  colors: Record<string, string>;
  onSave: () => void;
  onToggle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const commit = () => { if (editing && draft.trim()) onRename(editing, draft.trim()); setEditing(null); };

  return (
    <section id="scenarios" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white"><Bookmark className="w-4 h-4 text-sky-400" /> Scenarios</h2>
          <p className="text-xs text-slate-400">Save the current settings, change things, save again, then compare them side by side.</p>
        </div>
        <button type="button" onClick={onSave} className={cn(btn.base, btn.secondary, 'text-sky-300')}><Bookmark className="w-4 h-4" /> Save current as scenario</button>
      </div>
      {scenarios.length === 0 ? (
        <p className="text-sm text-slate-500">No scenarios yet. Try saving the setup as it is, then pick a different quote or turn on a loan and save that too.</p>
      ) : (
        <ul className="space-y-1.5">
          {scenarios.map(s => (
            <li key={s.id} className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={s.compare}
                onChange={() => onToggle(s.id)}
                aria-label={`Compare ${s.name}`}
                className="accent-sky-500 w-4 h-4 shrink-0"
              />
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.compare ? colors[s.id] : '#475569' }} />
              {editing === s.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null); }}
                  className="flex-1 min-w-0 bg-slate-950 border border-slate-600 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              ) : (
                <span className="flex-1 min-w-0 truncate text-sm text-slate-200">{s.name}</span>
              )}
              {editing === s.id ? (
                <button type="button" onClick={commit} className="text-slate-400 hover:text-white" title="Save name"><Check className="w-4 h-4" /></button>
              ) : (
                <button type="button" onClick={() => { setEditing(s.id); setDraft(s.name); }} className="text-slate-400 hover:text-white" title="Rename"><Pencil className="w-4 h-4" /></button>
              )}
              <button type="button" onClick={() => onLoad(s.id)} className="text-slate-400 hover:text-white" title="Load into the inputs"><Upload className="w-4 h-4" /></button>
              <button type="button" onClick={() => onDelete(s.id)} className="text-slate-400 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}
      {scenarios.length > 0 && <p className="text-xs text-slate-500">Tick up to four to compare in the “Compare” tab. Scenarios are kept in this browser; sign in and save a setup to keep one for good.</p>}
    </section>
  );
}

// The comparison: a plain-words verdict, net position over time for every setup on one
// chart, a side-by-side table with differences, and what's different about each.
export function ScenarioCompare({ current, others, goal, print }: { current: Compared; others: Compared[]; goal: Goal; print?: boolean }) {
  if (others.length === 0) {
    return (
      <div className="text-center py-10 px-4 border border-dashed border-slate-700 rounded-xl space-y-2">
        <p className="text-slate-200 font-medium">Nothing to compare yet</p>
        <p className="text-sm text-slate-400 max-w-md mx-auto">Use “Save current as scenario” above, change some settings, and tick the scenarios you want to compare. They’ll appear here next to your current setup.</p>
      </div>
    );
  }
  const all = [current, ...others];
  const data = current.results.chartData.map((d, i) => {
    const row: Record<string, number> = { year: d.year };
    all.forEach((c, j) => {
      const y = c.results.chartData[i];
      if (y) row[`s${j}`] = y.cumulativeSavings - y.netCost;
    });
    return row;
  });

  return (
    <div className="space-y-5">
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-sm text-white font-medium">{goalVerdict(goal, all)}</p>
        {others.map(o => (
          <div key={o.name}>
            <p className="text-sm font-semibold" style={{ color: o.color }}>{o.name} compared with {current.name.toLowerCase()}:</p>
            <ul className="mt-1 space-y-0.5 text-sm text-slate-300 list-disc pl-5">
              {compareSentences(current, o).map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-sm text-slate-200 mb-1">Money ahead (or behind) over time</h4>
        <p className="text-xs text-slate-500 mb-2">Savings so far minus money paid so far. Where a line crosses zero, that setup has paid for itself.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.grid} />
              <XAxis {...axisProps} dataKey="year" type="number" domain={[1, 25]} ticks={[1, 5, 10, 15, 20, 25]} tickFormatter={(v) => `Yr ${v}`} />
              <YAxis {...axisProps} tickFormatter={compactUsd} width={56} />
              <ReferenceLine y={0} stroke="#64748b" />
              {!print && <Tooltip {...tooltipStyle} labelFormatter={(l) => `Year ${l}`} formatter={(v: number, k: string) => [formatCurrency(v), all[Number(k.slice(1))]?.name ?? k]} />}
              {all.map((c, j) => (
                <Line key={c.name} dataKey={`s${j}`} name={`s${j}`} stroke={c.color} strokeWidth={j === 0 ? 3 : 2} dot={false} isAnimationActive={!print} type="monotone" />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Legend items={all.map((c, j) => ({ color: c.color, label: j === 0 ? `${c.name} (thick line)` : c.name }))} />
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-xs text-slate-400">
            <tr>
              <th className="text-left font-medium py-2 px-3"></th>
              {all.map(c => <th key={c.name} className="text-right font-medium py-2 px-3" style={{ color: c.color }}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(m => {
              const base = m.get(current.results, current.params);
              return (
                <tr key={m.label} className="border-t border-slate-800/60">
                  <td className="py-1.5 px-3 text-slate-300 whitespace-nowrap">{m.label}</td>
                  {all.map((c, j) => {
                    const v = m.get(c.results, c.params);
                    const d = v - base;
                    const better = m.higherIsBetter === undefined ? null : m.higherIsBetter ? d > 0 : d < 0;
                    const comparable = !m.comparable || (m.comparable(v) && m.comparable(base));
                    const show = j > 0 && comparable && Math.abs(d) > 1e-6 && m.fmt(Math.abs(d)) !== m.fmt(0);
                    return (
                      <td key={c.name} className="py-1.5 px-3 text-right font-mono whitespace-nowrap">
                        <span className="text-slate-100">{m.fmt(v)}</span>
                        {show && (
                          <span className={cn('block text-xs', better === null ? 'text-slate-500' : better ? 'text-emerald-400' : 'text-rose-400')}>
                            {d > 0 ? '+' : '−'}{m.fmt(Math.abs(d))}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {others.map(o => {
          const diff = describeDiff(current, o);
          return (
            <div key={o.name} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
              <p className="text-sm font-semibold mb-1" style={{ color: o.color }}>What’s different in {o.name}</p>
              {diff.length ? (
                <ul className="text-xs text-slate-300 space-y-0.5 list-disc pl-4">{diff.map(d => <li key={d}>{d}</li>)}</ul>
              ) : <p className="text-xs text-slate-500">Same settings as {current.name.toLowerCase()}.</p>}
            </div>
          );
        })}
      </div>
      <Note>Green differences are better than {current.name.toLowerCase()}, red are worse. Each scenario is worked out with the same model and assumptions.</Note>
    </div>
  );
}
