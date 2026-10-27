import React from 'react';
import { cn, InfoTip } from './ui';
import { PARAM_INFO } from '../paramInfo';
import { TRACK_SAMPLES, TRACK_SCALE } from '../goals';
import { TrackContext, gainColor } from './goalTracks';

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
// PARAM_INFO, keyed by the id without its "slider-" prefix. When a goal is picked,
// the track is painted greener where moving there helps the goal and redder where
// it hurts; hovering it shows the exact change.
export function Slider({ id, label, hint, value, min, max, step, unit, format, disabled, onChange }: SliderProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const [hover, setHover] = React.useState<number | null>(null); // 0..1 along the track
  const key = id?.replace(/^slider-/, '');
  const { tracks, goal, register } = React.useContext(TrackContext);
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const fmt = format ?? ((v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 }));

  React.useEffect(() => {
    if (!key || disabled) return;
    return register({ key, min, max });
  }, [key, min, max, disabled, register]);

  const track = key && !disabled && goal ? tracks[key] : undefined;
  // Full colour at this slider's own biggest effect, so the gradient shows across its range,
  // but never below a tenth of the goal's scale, so near-zero effects stay grey.
  const scale = goal ? Math.max(TRACK_SCALE[goal.key] * 0.1, ...(track ?? [0]).map(Math.abs)) : 1;
  const background = track
    ? `linear-gradient(to right, ${track.map((g, i) => `${gainColor(g, scale)} ${((i / (TRACK_SAMPLES - 1)) * 100).toFixed(1)}%`).join(', ')})`
    : undefined;

  const hoverInfo = (() => {
    if (hover === null || !track || !goal) return null;
    const i = Math.round(hover * (TRACK_SAMPLES - 1));
    const raw = min + ((max - min) * i) / (TRACK_SAMPLES - 1);
    const at = Math.round(raw / step) * step;
    const gain = track[i];
    const change = Math.abs(gain) < scale * 0.005 ? 'about the same' : goal.formatDelta(goal.higherIsBetter ? gain : -gain);
    return { left: (i / (TRACK_SAMPLES - 1)) * 100, text: `${fmt(at)}: ${change} ${goal.short}`, good: gain >= 0 };
  })();

  // Plain words for screen readers instead of the colours.
  const summary = track && goal ? (() => {
    const lo = track[0], hi = track[track.length - 1];
    const dir = Math.abs(hi - lo) < scale * 0.01 ? 'makes little difference to' : hi > lo ? 'higher values improve' : 'lower values improve';
    return `For ${goal.label.toLowerCase()}, ${dir} ${goal.short}.`;
  })() : undefined;

  return (
    <div id={id} className={cn('space-y-2 rounded-xl transition-all', disabled && 'opacity-50')}>
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5">
            <label htmlFor={id ? `${id}-input` : undefined} className="text-sm text-slate-200">{label}</label>
            <InfoTip info={key ? PARAM_INFO[key] : undefined} label={label} />
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
      <div
        className="relative w-full h-5 flex items-center"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <div className={cn('absolute w-full rounded-full overflow-hidden transition-[background] duration-300', track ? 'h-2' : 'h-1.5 bg-slate-700')} style={{ background }}>
          {!track && <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />}
        </div>
        <div
          className="absolute h-4 w-4 rounded-full bg-white border-2 border-amber-500 shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
        {hoverInfo && (
          <span
            className={cn('absolute top-6 -translate-x-1/2 whitespace-nowrap text-xs font-mono px-2 py-0.5 rounded-md bg-slate-950 border pointer-events-none z-10',
              hoverInfo.good ? 'border-emerald-500/50 text-emerald-300' : 'border-rose-500/50 text-rose-300')}
            style={{ left: `clamp(4rem, ${hoverInfo.left}%, calc(100% - 4rem))` }}
          >{hoverInfo.text}</span>
        )}
        <input
          type="range"
          aria-label={label}
          aria-description={summary}
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
