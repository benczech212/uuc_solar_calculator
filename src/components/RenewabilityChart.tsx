import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthEnergyData } from '../types';

interface RenewabilityChartProps {
  data: MonthEnergyData[];
}

export const RenewabilityChart: React.FC<RenewabilityChartProps> = ({ data }) => {
  const chartData = data.map(d => {
    const total = d.solarConsumed + d.gridRenewable + d.gridNonRenewable;
    if (total === 0) {
       return {
         ...d,
         percSolar: 0,
         percGridRenewable: 0,
         percGridNonRenewable: 0,
         rawSolar: d.solarConsumed,
         rawGridRenewable: d.gridRenewable,
         rawGridNonRenewable: d.gridNonRenewable
       };
    }
    return {
      ...d,
      percSolar: isNaN((d.solarConsumed / total)) ? 0 : (d.solarConsumed / total) * 100,
      percGridRenewable: isNaN((d.gridRenewable / total)) ? 0 : (d.gridRenewable / total) * 100,
      percGridNonRenewable: isNaN((d.gridNonRenewable / total)) ? 0 : (d.gridNonRenewable / total) * 100,
      rawSolar: d.solarConsumed || 0,
      rawGridRenewable: d.gridRenewable || 0,
      rawGridNonRenewable: d.gridNonRenewable || 0
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col pt-8">
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(val) => `${Math.round(val)}%`} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={50} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl outline-none">
                      <p className="text-slate-300 font-semibold mb-2">{label}</p>
                      <div className="space-y-1">
                        {[...payload].reverse().map((entry, index) => {
                          const d = entry.payload;
                          let rawVal = 0;
                          let percVal = 0;
                          if (entry.dataKey === 'percSolar') { rawVal = d.rawSolar; percVal = d.percSolar; }
                          if (entry.dataKey === 'percGridRenewable') { rawVal = d.rawGridRenewable; percVal = d.percGridRenewable; }
                          if (entry.dataKey === 'percGridNonRenewable') { rawVal = d.rawGridNonRenewable; percVal = d.percGridNonRenewable; }
                          
                          return (
                            <div key={index} className="flex items-center justify-between gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-400">{entry.name}</span>
                              </div>
                              <span className="text-slate-200 font-mono">
                                {percVal.toFixed(1)}% <span className="text-slate-500 text-xs">({Math.round(rawVal).toLocaleString()} kWh)</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
            <Bar dataKey="percSolar" name="Solar Power" stackId="a" fill="#15803d" />
            <Bar dataKey="percGridRenewable" name="Grid Renewable" stackId="a" fill="#86efac" />
            <Bar dataKey="percGridNonRenewable" name="Grid Non-Renewable" stackId="a" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
