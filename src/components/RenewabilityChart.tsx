import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthEnergyData } from '../types';

interface RenewabilityChartProps {
  data: MonthEnergyData[];
}

export const RenewabilityChart: React.FC<RenewabilityChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col pt-8">
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} stackOffset="expand" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(val) => `${Math.round(val * 100)}%`} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={50} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.5rem' }}
              itemStyle={{ fontSize: '14px' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}
              formatter={(value: number, name: string, props: any) => {
                const rawValue = props.payload && props.dataKey ? props.payload[props.dataKey] : value;
                const percentage = (value * 100).toFixed(1);
                return [
                  `${percentage}% (${Math.round(rawValue).toLocaleString()} kWh)`,
                  name
                ];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
            <Bar dataKey="solarConsumed" name="Solar Power" stackId="a" fill="#15803d" radius={[0, 0, 4, 4]} />
            <Bar dataKey="gridRenewable" name="Grid Renewable" stackId="a" fill="#86efac" />
            <Bar dataKey="gridNonRenewable" name="Grid Non-Renewable" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
