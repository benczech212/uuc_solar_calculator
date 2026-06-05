import { Lock, Unlock, Save } from 'lucide-react';
import { ComponentProps } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SliderProps extends ComponentProps<'input'> {
  label: string;
  valueDisplay: string;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onSetDefault?: () => void;
  paramKey?: string;
}

export function Slider({ label, valueDisplay, isLocked, onToggleLock, onSetDefault, paramKey, className, id, ...props }: SliderProps) {
  const min = props.min ? Number(props.min) : 0;
  const max = props.max ? Number(props.max) : 100;
  const val = props.value ? Number(props.value) : 0;
  
  const percentage = ((val - min) / (max - min)) * 100;

  return (
    <div id={id} className={cn("space-y-3 transition-all duration-300", className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {onToggleLock && (
            <button 
              onClick={onToggleLock} 
              className={cn("p-1 rounded transition-colors", isLocked ? "bg-rose-500/20 text-rose-400" : "bg-slate-800/50 text-slate-500 hover:text-slate-300")}
              title={isLocked ? "Unlock parameter" : "Lock parameter (prevent AI from changing)"}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}
          <label className="text-xs uppercase tracking-wider text-slate-400">{label}</label>
        </div>
        <div className="flex items-center gap-2">
          {onSetDefault && (
            <button
              onClick={onSetDefault}
              className="p-1 rounded bg-slate-800/50 text-slate-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
              title="Set as default"
            >
              <Save className="w-3 h-3" />
            </button>
          )}
          <input
            type="number"
            value={val}
            min={props.min}
            max={props.max}
            step={props.step}
            onChange={props.onChange}
            disabled={isLocked}
            className="w-16 sm:w-24 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded text-xs text-white text-right font-mono py-1 px-1.5 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline text-right min-w-[3rem]">
            = {valueDisplay}
          </span>
        </div>
      </div>
      <div className="relative w-full h-6 flex items-center">
        <div className={cn("absolute w-full h-1 rounded-lg overflow-hidden", isLocked ? "bg-slate-800" : "bg-slate-700")}>
          <div 
            className={cn("absolute top-0 left-0 h-full rounded-full", isLocked ? "bg-rose-900/50" : "bg-amber-500")}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div 
          className={cn("absolute h-4 w-4 rounded-full border-2 pointer-events-none z-0", 
            isLocked ? "bg-slate-800 border-rose-900/50" : "bg-white shadow-[0_0_10px_#fbbf24] border-amber-500")}
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
        <input 
          type="range"
          className={cn("absolute top-0 left-0 w-full h-full opacity-0 z-10", isLocked ? "cursor-not-allowed" : "cursor-pointer")}
          disabled={isLocked}
          {...props}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
        <span>{props.min}</span>
        <span>{props.max}{props.max === 100 || props.max === 10 ? '%' : '+'}</span>
      </div>
    </div>
  );
}
