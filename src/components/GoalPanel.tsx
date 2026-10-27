import React from 'react';
import { Target, Sparkles } from 'lucide-react';
import { GOALS, Goal, GoalKey, Impact, Suggestion } from '../goals';
import { cn, btn } from './ui';

// Each slider looks up its own "what raising this does to your goal" hint here.
export const ImpactContext = React.createContext<Record<string, Impact>>({});

export function GoalPicker({ goal, onChange }: { goal: Goal; onChange: (k: GoalKey) => void }) {
  return (
    <section id="goal-picker" className="border border-amber-500/30 rounded-xl bg-amber-500/5 px-4 py-3 space-y-2 scroll-mt-24">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-100"><Target className="w-4 h-4 text-amber-400" /> What matters most to UUC?</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Goal">
        {GOALS.map(g => (
          <button
            key={g.key}
            type="button"
            role="radio"
            aria-checked={g.key === goal.key}
            onClick={() => onChange(g.key)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors',
              g.key === goal.key ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold' : 'border-slate-700 text-slate-300 hover:border-slate-500')}
          >{g.label}</button>
        ))}
      </div>
      <p className="text-xs text-slate-400">{goal.description} Each input below shows how raising it changes this, and the results suggest changes that help most.</p>
    </section>
  );
}

export function ImpactHint({ impact }: { impact?: Impact }) {
  if (!impact) return null;
  return (
    <p className={cn('text-xs', impact.tone === 'good' ? 'text-emerald-400' : impact.tone === 'bad' ? 'text-rose-400' : 'text-slate-500')}>
      {impact.tone === 'good' ? '▲ ' : impact.tone === 'bad' ? '▼ ' : '• '}{impact.text}
    </p>
  );
}

export function GoalSuggestions({ goal, current, suggestions, pending, onApply, lastApplied, onUndo }: {
  goal: Goal;
  current: number;
  suggestions: Suggestion[];
  pending: boolean;
  onApply: (s: Suggestion) => void;
  lastApplied?: string | null;
  onUndo?: () => void;
}) {
  return (
    <section id="goal-suggestions" className={cn('bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 scroll-mt-24 transition-opacity', pending && 'opacity-60')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white"><Sparkles className="w-4 h-4 text-amber-400" /> Ways to improve: {goal.label.toLowerCase()}</h2>
        <p className="text-sm text-slate-400">Now: <span className="font-mono text-white">{goal.format(current)}</span> {goal.short}</p>
      </div>
      {lastApplied && onUndo && (
        <div className="flex items-center justify-between gap-3 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-200">
          <span>Applied: {lastApplied}</span>
          <button type="button" onClick={onUndo} className="underline hover:text-white">Undo</button>
        </div>
      )}
      {suggestions.length === 0 ? (
        <p className="text-sm text-slate-400">None of the changes we tried (quotes, system size, loan, battery, credits) would improve this. The current setup is already the best of those for this goal.</p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map(s => (
            <li key={s.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-100">{s.title}</p>
                <p className="text-xs text-slate-500">{s.detail}</p>
              </div>
              <span className="text-sm font-mono text-emerald-400 whitespace-nowrap" title={`${goal.short} would be ${goal.format(s.newValue)}`}>
                {goal.formatDelta(goal.higherIsBetter ? s.gain : -s.gain)}
              </span>
              <button type="button" onClick={() => onApply(s)} className={cn(btn.base, btn.secondary, 'py-1 text-xs')}>Apply</button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">Suggestions never go beyond a system that covers all of UUC’s yearly use: Florida pays little for credits left over at year-end. Applying one changes your inputs.{goal.key === 'payback' && ' Loan changes aren’t suggested here: with a loan, payback counts only payments made so far, so it isn’t comparable to paying cash.'}</p>
    </section>
  );
}
