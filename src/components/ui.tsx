import React from 'react';
import type { ParamInfo } from '../paramInfo';
import { ChevronDown, GitCompare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={cn('relative w-10 h-6 rounded-full transition-colors shrink-0', checked ? 'bg-amber-500' : 'bg-slate-700')}
    >
      <span className={cn('absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform', checked && 'translate-x-4')} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, className }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg', className)} onClick={e => e.stopPropagation()}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap',
            value === o.value ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          )}
        >{o.label}</button>
      ))}
    </div>
  );
}

interface SectionProps {
  id?: string;
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggleOpen: () => void;
  enabled?: boolean;
  onToggleEnabled?: (v: boolean) => void;
  comparing?: boolean;
  onCompare?: () => void;
  headerExtra?: React.ReactNode;
  info?: ParamInfo;
  children: React.ReactNode;
}

// A collapsible group of inputs. Optional sections carry an on/off switch and a
// "Compare" button that shows the results with that section flipped.
export function Section({ id, title, hint, icon, open, onToggleOpen, enabled, onToggleEnabled, comparing, onCompare, headerExtra, info, children }: SectionProps) {
  const optional = onToggleEnabled !== undefined;
  return (
    <section id={id} className="border border-slate-800 rounded-xl bg-slate-900/40 scroll-mt-4">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggleOpen} className="flex items-center gap-2 flex-1 min-w-0 text-left group" aria-expanded={open}>
          <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform shrink-0', !open && '-rotate-90')} />
          {icon}
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">{title}</span>
            {hint && <span className="block text-xs text-slate-500 truncate">{hint}</span>}
          </span>
        </button>
        <InfoTip info={info} label={title} />
        {headerExtra}
        {onCompare && (
          <button
            type="button"
            onClick={onCompare}
            title={`Show results ${enabled ? 'without' : 'with'} ${title.toLowerCase()} for comparison`}
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors',
              comparing ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'
            )}
          >
            <GitCompare className="w-3.5 h-3.5" /> Compare
          </button>
        )}
        {optional && <Toggle checked={!!enabled} onChange={onToggleEnabled!} label={`Include ${title}`} />}
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-5 border-t border-slate-800/60">
          {optional && !enabled ? (
            <p className="text-xs text-slate-500 pt-3">Not included in the results. Turn the switch on to use these settings.</p>
          ) : children}
        </div>
      )}
    </section>
  );
}

export function Stat({ label, value, sub, tone = 'default', onClick, delta }: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'default' | 'good' | 'bad' | 'sun' | 'sky';
  onClick?: (e: React.MouseEvent) => void;
  delta?: React.ReactNode;
}) {
  const color = { default: 'text-white', good: 'text-emerald-400', bad: 'text-rose-400', sun: 'text-amber-400', sky: 'text-sky-400' }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      title="See how this is calculated"
      className="text-left p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-amber-500/40 transition-colors min-w-0"
    >
      <span className="block text-xs text-slate-400 mb-1">{label}</span>
      <span className={cn('block text-lg font-mono truncate', color)}>{value}</span>
      {sub && <span className="block text-xs text-slate-500 mt-0.5 truncate">{sub}</span>}
      {delta && <span className="block text-xs font-mono mt-0.5">{delta}</span>}
    </button>
  );
}

export function Modal({ title, children, onClose, actions }: { title: string; children: React.ReactNode; onClose: () => void; actions: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <div className="text-slate-400 mb-6 text-sm">{children}</div>
        <div className="flex gap-3 justify-end">{actions}</div>
      </div>
    </div>
  );
}

export const btn = {
  base: 'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
  primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 font-semibold',
  danger: 'bg-red-600 hover:bg-red-500 text-white border-red-500',
  ghost: 'text-slate-300 hover:text-white border-transparent',
};

// An (i) button that explains an input: what it means, why the default was picked,
// and where the number came from. Opens on hover or tap; tap again or Esc to close.
export function InfoTip({ info, label }: { info?: ParamInfo; label: string }) {
  const [open, setOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!pinned) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [pinned]);

  if (!info) return null;
  const show = open || pinned;
  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={show}
        onClick={(e) => { e.stopPropagation(); setPinned(p => !p); }}
        className={cn('w-4 h-4 rounded-full border text-[10px] leading-none font-semibold flex items-center justify-center transition-colors',
          show ? 'border-amber-400 text-amber-300' : 'border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200')}
      >i</button>
      {show && (
        <span
          role="tooltip"
          onClick={e => e.stopPropagation()}
          className="absolute z-50 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-6 w-72 max-w-[80vw] bg-slate-950 border border-slate-700 rounded-lg p-3 shadow-xl text-left text-xs text-slate-300 font-normal normal-case tracking-normal space-y-2"
        >
          <span className="block">{info.what}</span>
          <span className="block"><span className="text-amber-300 font-semibold">Default: </span>{info.why}</span>
          {info.sources && info.sources.length > 0 && (
            <span className="block text-slate-500">
              Source{info.sources.length > 1 ? 's' : ''}:{' '}
              {info.sources.map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && '; '}
                  {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="underline hover:text-slate-200">{s.label}</a> : s.label}
                </React.Fragment>
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
