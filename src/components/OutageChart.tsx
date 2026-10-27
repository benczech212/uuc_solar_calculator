import React from 'react';
import { BatteryCharging, ShieldOff } from 'lucide-react';
import { OutageResilience } from '../types';
import { cn } from './ui';
import { Note } from './chartTheme';

interface Props {
  data: OutageResilience;
  onEnableBattery?: () => void;
}

const LABELS: Record<string, { title: string; detail: string }> = {
  'Normal Ops': { title: 'Everything as usual', detail: 'All lights, air conditioning and equipment' },
  'Half Capacity': { title: 'Half the usual load', detail: 'Cooling turned down, nonessential rooms off' },
  'Quarter Capacity': { title: 'A quarter of the load', detail: 'A few rooms, fans instead of AC' },
  'Essentials Only': { title: 'Essentials only', detail: 'Doors, cameras, some lights, phone charging' },
};

const hrs = (h: number) => {
  if (h >= 23.95) return 'All day and night';
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return `${whole} h${mins ? ` ${mins} min` : ''} a day`;
};

// Outage backup: how many hours a day each level of use could keep running on solar plus
// the battery during a long grid outage.
export function OutageChart({ data, onEnableBattery }: Props) {
  if (data.scenarios.every(s => s.hoursPerDay === 0)) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-10 px-4 border border-dashed border-slate-700 rounded-xl">
        <ShieldOff className="w-8 h-8 text-slate-500" />
        <p className="text-slate-200 font-medium">Without a battery, solar shuts off when the grid goes down</p>
        <p className="text-sm text-slate-400 max-w-md">
          Grid-tied systems switch off in an outage so they don’t send power onto lines that line crews are repairing.
          A battery (with a transfer switch) lets the building keep running.
        </p>
        {onEnableBattery && (
          <button type="button" onClick={onEnableBattery} className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950">
            <BatteryCharging className="w-4 h-4" /> Add a battery to see backup time
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {data.scenarios.map(s => {
          const label = LABELS[s.name] ?? { title: s.name, detail: s.description };
          const full = s.hoursPerDay >= 23.95;
          const pct = Math.min(100, (s.hoursPerDay / 24) * 100);
          const color = full ? 'bg-emerald-500' : s.hoursPerDay >= 12 ? 'bg-amber-500' : 'bg-rose-500';
          return (
            <div key={s.name} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  <p className="text-sm text-slate-100 font-medium">{label.title}</p>
                  <p className="text-xs text-slate-500">{label.detail} · {s.usageKwH.toFixed(0)} kWh a day</p>
                </div>
                <p className={cn('text-sm font-mono', full ? 'text-emerald-400' : s.hoursPerDay >= 12 ? 'text-amber-400' : 'text-rose-400')}>{hrs(s.hoursPerDay)}</p>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-slate-800 overflow-hidden" role="img" aria-label={`${hrs(s.hoursPerDay)} out of 24 hours`}>
                <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
              </div>
              {full && s.surplusKwHPerDay > 0 && (
                <p className="text-xs text-slate-500 mt-1.5">With {s.surplusKwHPerDay.toFixed(0)} kWh a day to spare, for example for charging community members’ phones.</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
        <span>0 h</span><span>12 h</span><span>24 h</span>
      </div>
      <p className="text-sm text-slate-300 mt-4">
        A full battery alone holds enough to charge about <span className="font-mono text-emerald-400">{data.cellPhoneCharges.toLocaleString()}</span> phones.
      </p>
      <Note>
        Assumes average sunny days, a battery that starts full, and that the battery covers about 60% of each day’s use (the hours without sun).
        Cloudy days cut solar output, so real backup time in a storm can be much shorter. Phone charges assume 15 Wh each.
      </Note>
    </div>
  );
}
