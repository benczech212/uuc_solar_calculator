import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { OutageResilience, OutageScenario } from '../types';

interface Props {
  data: OutageResilience;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: OutageScenario = payload[0].payload;
    const hoursPerDay = data.hoursPerDay;
    const duration = hoursPerDay >= 24 ? "24 Hours (100%)" : `${Math.floor(hoursPerDay)} Hours, ${Math.floor((hoursPerDay % 1)*60)} Mins / Day`;
                     
    return (
      <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] font-mono text-xs z-50 min-w-[200px]">
        <p className="text-amber-500 font-bold mb-1 uppercase tracking-wider">{data.name}</p>
        <p className="text-slate-400 mb-3 font-sans leading-tight text-[11px]">{data.description}</p>
        
        <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Endurance:</span>
            <span className={hoursPerDay === 24 ? "text-emerald-400" : hoursPerDay >= 12 ? "text-amber-400" : "text-rose-400"}>{duration}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Power Req:</span>
            <span className="text-white">{data.usageKwH.toFixed(1)} kWh/day</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function OutageChart({ data }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<OutageScenario | null>(null);

  if (data.scenarios.every(s => s.hoursPerDay === 0)) {
    return (
      <div className="w-full h-64 sm:h-72 lg:h-56 xl:h-[260px] h-60 mt-4 flex flex-col items-center justify-center text-slate-500 font-mono text-sm bg-slate-900/20 rounded-xl border border-slate-800 border-dashed">
        <span className="text-amber-500 mb-2">No Battery Storage Detected</span>
        <span className="text-center px-4">Grid-tied solar systems automatically disconnect during outages for safety.</span>
        <span className="text-center px-4">Add Battery Capacity in the parameters to view resilience data.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full mt-6 flex flex-col pb-4">
      <div className="h-56 lg:h-64 font-mono text-xs relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.scenarios}
            margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Inter', cursor: 'pointer' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}h`} 
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              domain={[0, 24]}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Inter' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0f172a', opacity: 0.5 }} />
            <Bar 
              dataKey="hoursPerDay" 
              radius={[4, 4, 0, 0]} 
              className="cursor-pointer"
              onClick={(data: any) => {
                if (data && data.payload) setSelectedScenario(data.payload);
                else if (data) setSelectedScenario(data);
              }}
            >
              {data.scenarios.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.hoursPerDay === 24 ? '#10b981' : entry.hoursPerDay >= 12 ? '#f59e0b' : '#ef4444'} 
                  opacity={selectedScenario ? (selectedScenario.name === entry.name ? 1 : 0.3) : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/50 pt-4">
        {selectedScenario ? (
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2 border-l-4 border-l-amber-500 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">{selectedScenario.name} Selected</h3>
              <button onClick={() => setSelectedScenario(null)} className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-wider">Clear</button>
            </div>
            
            {selectedScenario.surplusKwHPerDay > 0 ? (
              <>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-2">Extra Daily Capacity</p>
                <p className="text-xl text-emerald-400 font-mono">+{selectedScenario.surplusKwHPerDay.toFixed(1)} kWh <span className="text-xs text-emerald-500/50">/ day</span></p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  System can power <b>{selectedScenario.name}</b> 24 hours a day AND fully charge <b className="text-emerald-400 font-mono">{Math.floor(selectedScenario.surplusKwHPerDay / 0.015).toLocaleString()}</b> phones per day.
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-2">Extra Daily Capacity</p>
                <p className="text-xl text-rose-400 font-mono">0 kWh <span className="text-xs text-rose-500/50">/ day</span></p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  System can only sustain operation for <b className="text-amber-400 font-mono">{selectedScenario.hoursPerDay.toFixed(1)} hours per day</b>. There is NO extra capacity to charge phones without reducing survival time.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-full min-h-[120px] rounded-xl text-slate-500 bg-slate-800/30">
            <span className="text-xs tracking-wide">Click a bar above to view phone charging capacity</span>
          </div>
        )}

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
           <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-500 mb-1">Max Battery Potential</p>
           <p className="text-3xl text-emerald-400 font-mono">
             {data.cellPhoneCharges.toLocaleString()} <span className="text-sm text-emerald-500/50">charges total</span>
           </p>
           <p className="text-[10px] text-slate-500 mt-1 uppercase leading-snug">
             Absolute total lifetime from 100% full battery<br/>(assumes 15Wh per full phone charge)
           </p>
        </div>
      </div>
    </div>
  );
}
