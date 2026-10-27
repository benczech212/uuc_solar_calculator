import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { YearlyData } from '../types';
import { formatCurrency } from '../utils';

interface ChartProps {
  data: YearlyData[];
  paybackPeriod: number;
  compareData?: YearlyData[];
  comparePaybackPeriod?: number;
}

export function RoiChart({ data, paybackPeriod, compareData, comparePaybackPeriod }: ChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const mergedData = useMemo(() => data.map((d, i) => ({
    ...d,
    compNetCost: compareData ? compareData[i]?.netCost : undefined,
    compCumulativeSavings: compareData ? compareData[i]?.cumulativeSavings : undefined,
  })), [data, compareData]);

  const formatLegend = (value: string) => {
    if (value === 'netCost') return 'Net System Cost';
    if (value === 'cumulativeSavings') return 'Cumulative Savings';
    if (value === 'compNetCost') return 'Net Cost (Toggled)';
    if (value === 'compCumulativeSavings') return 'Savings (Toggled)';
    return value;
  };

  const handleLegendClick = (dataKey: string, event: React.MouseEvent) => {
    const isCtrl = event.ctrlKey || event.metaKey;
    const allKeys = ['netCost', 'cumulativeSavings'];
    if (compareData) {
      allKeys.push('compNetCost', 'compCumulativeSavings');
    }
    
    if (isCtrl) {
      const isOnlyVisible = allKeys.every(k => (k === dataKey ? !hiddenSeries[k] : hiddenSeries[k]));
      if (isOnlyVisible) {
        setHiddenSeries({});
      } else {
        const newHidden: Record<string, boolean> = {};
        allKeys.forEach(k => {
          newHidden[k] = k !== dataKey;
        });
        setHiddenSeries(newHidden);
      }
    } else {
      setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    }
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    
    // Create a normalized payload list including all possible series if compareData exists
    // The chart only puts areas with dataKey into the payload
    // If we want a fixed legend, we can rely on what Recharts passes
    return (
      <ul className="flex justify-center gap-6 pt-5 text-[11px] text-slate-400 font-sans flex-wrap h-12">
        {payload.map((entry: any, index: number) => {
          const key = entry.dataKey || entry.value;
          let actualKey = key;
          if (entry.value === 'Net System Cost') actualKey = 'netCost';
          if (entry.value === 'Cumulative Savings') actualKey = 'cumulativeSavings';

          const isHidden = hiddenSeries[actualKey];
          return (
            <li 
              key={`item-${index}`} 
              className={`flex items-center gap-2 cursor-pointer transition-all hover:text-white ${isHidden ? 'opacity-40 grayscale' : 'opacity-100'}`}
              onClick={(e) => handleLegendClick(actualKey, e)}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color, opacity: isHidden ? 0.3 : 1 }}></div>
              <span>{formatLegend(entry.value)}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="w-full h-72 mt-4 font-mono text-xs flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={mergedData}
          margin={{
            top: 20,
            right: 20,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="year" 
            type="number"
            domain={[1, 25]}
            tickFormatter={(value) => `Y${value}`}
            stroke="#64748b" 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={(value) => {
              if (typeof value !== 'number') return `${value}`;
              if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
              if (value >= 1000) return `$${Math.round(value / 1000)}k`;
              return `$${value}`;
            }}
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.05))]}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              formatLegend(name)
            ]}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: '#020617', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
            itemStyle={{ color: '#f8fafc' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          
          <Legend content={renderLegend} verticalAlign="bottom" height={50} />

          {compareData && (
            <>
              <Area 
                type="monotone" 
                dataKey="compNetCost" 
                name="compNetCost"
                stroke="#f87171" 
                strokeDasharray="5 5"
                strokeWidth={2}
                fillOpacity={0} 
                hide={hiddenSeries['compNetCost']}
              />
              <Area 
                type="monotone" 
                dataKey="compCumulativeSavings" 
                name="compCumulativeSavings"
                stroke="#34d399" 
                strokeDasharray="5 5"
                strokeWidth={2}
                fillOpacity={0} 
                hide={hiddenSeries['compCumulativeSavings']}
              />
            </>
          )}
          <Area 
            type="monotone" 
            dataKey="netCost" 
            name="netCost"
            stroke="#ef4444" 
            strokeWidth={2}
            fillOpacity={compareData ? 0.3 : 1} 
            fill="url(#colorCost)" 
            hide={hiddenSeries['netCost']}
          />
          <Area 
            type="monotone" 
            dataKey="cumulativeSavings" 
            name="cumulativeSavings"
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={compareData ? 0.3 : 1} 
            fill="url(#colorSavings)" 
            hide={hiddenSeries['cumulativeSavings']}
          />
          {paybackPeriod > 0 && paybackPeriod <= 25 && !hiddenSeries['netCost'] && !hiddenSeries['cumulativeSavings'] && (
            <ReferenceLine 
              x={paybackPeriod} 
              stroke="#fbbf24" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ position: 'top', value: 'Break-even', fill: '#fbbf24', fontSize: 10, fontFamily: 'Inter' }}
            />
          )}
          {comparePaybackPeriod && comparePaybackPeriod > 0 && comparePaybackPeriod <= 25 && !hiddenSeries['compNetCost'] && !hiddenSeries['compCumulativeSavings'] && (
            <ReferenceLine 
              x={comparePaybackPeriod} 
              stroke="#818cf8" 
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{ position: 'bottom', value: 'Compare Break-even', fill: '#818cf8', fontSize: 10, fontFamily: 'Inter' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}