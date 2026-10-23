import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine } from 'recharts';
import { SensitivityData, SensitivityVariable } from '../types';
import { formatCurrency } from '../utils';

interface ChartProps {
  data: SensitivityData[];
  variable: SensitivityVariable;
  metric: 'profit' | 'breakeven' | 'both' | 'slope';
  onApplyExtrema?: (value: number) => void;
  currentValue?: number;
}

export function SensitivityChart({ data, variable, metric, onApplyExtrema, currentValue }: ChartProps) {
  
  const formatXAxis = (value: number) => {
    if (variable === 'systemSize') return `${value.toFixed(1)}kW`;
    if (variable === 'battery') return `${value.toFixed(0)}kWh`;
    if (variable === 'interestRate') return `${value.toFixed(2)}%`;
    if (variable === 'downPayment') return `$${value.toLocaleString()}`;
    if (variable === 'loanTerm') return `${value.toFixed(0)}yrs`;
    return value.toString();
  };

  const getXAxisLabel = () => {
    if (variable === 'systemSize') return "System Size (kW)";
    if (variable === 'battery') return "Battery Capacity (kWh)";
    if (variable === 'interestRate') return "Interest Rate (%)";
    if (variable === 'downPayment') return "Down Payment ($)";
    if (variable === 'loanTerm') return "Loan Term (Years)";
    return "";
  };

  const validPaybacks = data.filter(d => d.paybackPeriod > 0 && d.paybackPeriod < 30);
  const minPayback = validPaybacks.length > 0 ? validPaybacks.reduce((min, p) => p.paybackPeriod < min.paybackPeriod ? p : min, validPaybacks[0]) : null;

  const validValidProfits = data.filter(d => d.netCost > 0);
  const maxProfit = validValidProfits.length > 0 ? validValidProfits.reduce((max, p) => p.netProfit > max.netProfit ? p : max, validValidProfits[0]) : null;

  const activeYAxis = metric === 'slope' ? 'slope' : metric === 'breakeven' ? 'payback' : 'profit';

  return (
    <div className="w-full flex-col items-center">
    
    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl mt-4 text-xs text-slate-300 leading-relaxed">
      {metric === 'both' && <p><span className="text-amber-400 font-semibold tracking-wide">ALL METRICS:</span> Analyzing the intersection of <span className="text-emerald-400">25-Year Value</span> and <span className="text-amber-500">Break-even time</span> across different '{getXAxisLabel().replace(/\s*\(.*\)/, '')}' settings to find the optimal balance between upfront cost and long-term savings.</p>}
      {metric === 'profit' && <p><span className="text-emerald-400 font-semibold tracking-wide">25-YEAR VALUE:</span> Shows the total net profit after 25 years. The highest point indicates the absolute best long-term financial return for '{getXAxisLabel().replace(/\s*\(.*\)/, '')}'.</p>}
      {metric === 'breakeven' && <p><span className="text-amber-500 font-semibold tracking-wide">BREAK-EVEN:</span> Shows how many years it takes for the system to pay for itself. The lowest point indicates the fastest return on investment for '{getXAxisLabel().replace(/\s*\(.*\)/, '')}'.</p>}
      {metric === 'slope' && <p><span className="text-purple-400 font-semibold tracking-wide">PROFIT SLOPE:</span> Shows the rate of change of the 25-Year Value. When the slope crosses zero (drops from positive to negative), you've reached the point of maximum return where adding more '{getXAxisLabel().replace(/\s*\(.*\)/, '')}' begins to destroy value.</p>}
    </div>

    <div className="w-full h-64 sm:h-72 lg:h-56 xl:h-[260px] h-60 mt-4 font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="xValue" 
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatXAxis} 
            stroke="#64748b" 
            tickLine={false}
            axisLine={false}
            label={{ value: getXAxisLabel(), position: "insideBottom", offset: -15, fill: "#94a3b8", fontSize: 10, fontFamily: "Inter, sans-serif" }}
          />
          
          {(metric === 'profit' || metric === 'both') && (
            <YAxis 
              yAxisId="profit"
              tickFormatter={(value) => {
                if (typeof value !== 'number') return `${value}`;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
                if (value >= 1000) return `$${Math.round(value / 1000)}k`;
                return `$${value}`;
              }}
              stroke="#10b981"
              tickLine={false}
              axisLine={false}
              label={{ value: "25-Yr Profit", angle: -90, position: "insideLeft", fill: "#10b981", fontSize: 10, fontFamily: "Inter, sans-serif" }}
            />
          )}

          {(metric === 'breakeven' || metric === 'both') && (
            <YAxis 
              yAxisId="payback"
              orientation="right"
              tickFormatter={(value) => `${value}y`} 
              stroke="#f59e0b"
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              label={{ value: "Break-even (Years)", angle: 90, position: "insideRight", fill: "#f59e0b", fontSize: 10, fontFamily: "Inter, sans-serif" }}
            />
          )}

          {metric === 'slope' && (
            <YAxis 
              yAxisId="slope"
              orientation="right"
              tickFormatter={(value) => `${value > 0 ? '+' : ''}$${value.toFixed(0)}`} 
              stroke="#8b5cf6"
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              label={{ value: "Profit Slope ($/unit)", angle: 90, position: "insideRight", fill: "#8b5cf6", fontSize: 10, fontFamily: "Inter, sans-serif" }}
            />
          )}

          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'Net 25-Yr Profit') return formatCurrency(value);
              if (name === 'Payback Period') return `${value >= 30 ? '30+' : value.toFixed(1)} Years`;
              if (name === 'Profit Slope') return `${value > 0 ? '+' : ''}${formatCurrency(value)} / unit`;
              return value;
            }}
            labelFormatter={(label, payload) => {
              const xVal = payload && payload.length > 0 ? (payload[0].payload as SensitivityData).xValue : 0;
              return `${getXAxisLabel()}: ${formatXAxis(xVal)}`;
            }}
            contentStyle={{ backgroundColor: '#020617', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
            itemStyle={{ color: '#f8fafc' }}
            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
          />

          {(metric === 'profit' || metric === 'both') && (
            <Line 
              yAxisId="profit"
              type="monotone" 
              dataKey="netProfit" 
              name="Net 25-Yr Profit"
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#10b981", stroke: "#020617", strokeWidth: 2 }}
            />
          )}

          {(metric === 'breakeven' || metric === 'both') && (
            <Line 
              yAxisId="payback"
              type="monotone" 
              dataKey="paybackPeriod" 
              name="Payback Period"
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#f59e0b", stroke: "#020617", strokeWidth: 2 }}
            />
          )}

          {metric === 'slope' && (
            <Line 
              yAxisId="slope"
              type="monotone" 
              dataKey="profitSlope" 
              name="Profit Slope"
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#020617", strokeWidth: 2 }}
            />
          )}

          {metric === 'slope' && (
            <ReferenceLine yAxisId="slope" y={0} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" />
          )}

          {minPayback && (
            <>
              {/* Always show vertical line for min payback if possible */}
              <ReferenceLine yAxisId={activeYAxis} x={minPayback.xValue} stroke="#fbbf24" strokeDasharray="3 3" opacity={0.5} />
              {(metric === 'breakeven' || metric === 'both') && <ReferenceDot yAxisId="payback" x={minPayback.xValue} y={minPayback.paybackPeriod} r={4} fill="#fbbf24" stroke="none" />}
            </>
          )}

          {maxProfit && (
            <>
              {/* Always show vertical line for max profit */}
              <ReferenceLine yAxisId={activeYAxis} x={maxProfit.xValue} stroke="#6ee7b7" strokeDasharray="3 3" opacity={0.5} />
              {metric === 'slope' && <ReferenceDot yAxisId="slope" x={maxProfit.xValue} y={0} r={4} fill="#c084fc" stroke="none" />}
              {(metric === 'profit' || metric === 'both') && <ReferenceDot yAxisId="profit" x={maxProfit.xValue} y={maxProfit.netProfit} r={4} fill="#6ee7b7" stroke="none" />}
            </>
          )}

          {currentValue !== undefined && (
            <ReferenceLine 
              yAxisId={activeYAxis}
              x={currentValue} 
              stroke="#3b82f6" 
              strokeDasharray="3 3" 
              opacity={0.8}
              label={{ value: "Current", position: "insideTopLeft", fill: "#3b82f6", fontSize: 10, fontFamily: "Inter, sans-serif" }}
            />
          )}

        </ComposedChart>
      </ResponsiveContainer>
    </div>
    
    <div className="mt-8 bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider text-center">Identified Extrema (Click to Apply)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {maxProfit && (
          <button 
            onClick={() => onApplyExtrema && onApplyExtrema(maxProfit.xValue)}
            className="bg-slate-950 p-4 rounded-lg border border-emerald-900/50 hover:border-emerald-500 shadow-sm flex flex-col items-center transition-colors cursor-pointer"
          >
            <span className="text-[11px] uppercase text-emerald-500 font-bold tracking-widest mb-1">Max 25-Yr Return</span>
            <span className="text-xl text-emerald-400 font-mono tracking-tight">{formatCurrency(maxProfit.netProfit)}</span>
            <span className="text-xs text-slate-400 mt-1">at {formatXAxis(maxProfit.xValue)}</span>
          </button>
        )}
        {minPayback && (
          <button 
            onClick={() => onApplyExtrema && onApplyExtrema(minPayback.xValue)}
            className="bg-slate-950 p-4 rounded-lg border border-amber-900/50 hover:border-amber-500 shadow-sm flex flex-col items-center transition-colors cursor-pointer"
          >
            <span className="text-[11px] uppercase text-amber-500 font-bold tracking-widest mb-1">Fastest Break-even</span>
            <span className="text-xl text-amber-400 font-mono tracking-tight">{minPayback.paybackPeriod.toFixed(1)} <span className="text-sm">Yrs</span></span>
            <span className="text-xs text-slate-400 mt-1">at {formatXAxis(minPayback.xValue)}</span>
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
