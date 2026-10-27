import React from 'react';
import { cn, InfoTip } from './ui';
import { PARAM_INFO } from '../paramInfo';

interface SliderProps {
  id?: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  disabled?: boolean;
  onChange: (v: number) => void;
}

// A labelled range input with an exact-value box. The box accepts values outside
// the slider's range; the track just pins to the end. The (i) tooltip comes from
// PARAM_INFO, keyed by the id without its "slider-" prefix.
export function Slider({ id, label, hint, value, min, max, step, unit, format, disabled, onChange }: SliderProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const fmt = format ?? ((v: number) => v.toLocaleString('en-US'));

  return (
    <div id={id} className={cn('space-y-2 rounded-xl transition-all', disabled && 'opacity-50')}>
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5">
            <label htmlFor={id ? `${id}-input` : undefined} className="text-sm text-slate-200">{label}</label>
            <InfoTip info={id ? PARAM_INFO[id.replace(/^slider-/, '')] : undefined} label={label} />
          </span>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            id={id ? `${id}-input` : undefined}
            type="number"
            inputMode="decimal"
            value={draft ?? String(value)}
            step={step}
            disabled={disabled}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value !== '' && Number.isFinite(n)) onChange(n);
            }}
            onBlur={() => setDraft(null)}
            className="w-24 bg-slate-950 border border-slate-700 hover:border-slate-500 rounded-md text-sm text-white text-right font-mono py-1 px-2 focus:outline-none focus:border-amber-500"
          />
          {unit && <span className="text-xs text-slate-500 w-10">{unit}</span>}
        </div>
      </div>
      <div className="relative w-full h-5 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
        </div>
        <div
          className="absolute h-4 w-4 rounded-full bg-white border-2 border-amber-500 shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          disabled={disabled}
          onChange={(e) => { setDraft(null); onChange(Number(e.target.value)); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 font-mono">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}
