import React, { useState, useMemo, useEffect } from 'react';
import { SolarParams } from '../types';
import { calculateRoi, formatCurrency } from '../utils';
import { Plus, Trash2, LineChart, Target, AlertCircle, Sun } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { SavedConfig } from '../lib/firebase';

interface ProgressTrackerProps {
  params: SolarParams;
  updateParam: <K extends keyof SolarParams>(key: K, value: SolarParams[K]) => void;
  savedConfigs?: SavedConfig[];
}

export function ProgressTracker({ params, updateParam, savedConfigs }: ProgressTrackerProps) {
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  
  const entries = [...(params.historicalBills || [])].sort((a, b) => b.monthString.localeCompare(a.monthString));

  useEffect(() => {
    if (!entries || entries.length === 0) return;
    
    const sorted = [...entries].sort((a, b) => b.monthString.localeCompare(a.monthString));
    const latestEntry = sorted[0];
    const latestMonthStr = latestEntry.monthString;
    
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (latestMonthStr < currentMonthStr) {
      const newEntries = [...entries];
      let [year, month] = latestMonthStr.split('-').map(Number);
      
      let added = false;
      let failsafe = 0;
      while (failsafe < 100) { // arbitrary limit to prevent infinite loops
        failsafe++;
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
        
        const nextMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        // Dont add if it already exists in case of weird manual gaps
        if (!newEntries.find(e => e.monthString === nextMonthStr)) {
          newEntries.push({
            id: `auto-${nextMonthStr}`,
            monthString: nextMonthStr,
            billAmount: 0,
            actualUsageKwh: 0,
          });
          added = true;
        }
        
        if (nextMonthStr >= currentMonthStr) {
          break;
        }
      }
      
      if (added) {
        updateParam('historicalBills', newEntries.sort((a, b) => a.monthString.localeCompare(b.monthString)));
      }
    }
  }, [entries, updateParam]);

  const addEntry = () => {
    const d = new Date();
    const defaultMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const newBill = {
      id: Date.now().toString(),
      monthString: defaultMonth,
      billAmount: 150,
      actualUsageKwh: 900
    };
    updateParam('historicalBills', [...entries, newBill].sort((a, b) => a.monthString.localeCompare(b.monthString)));
  };

  const removeEntry = (id: string) => {
    updateParam('historicalBills', entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: any) => {
    updateParam('historicalBills', 
      entries.map(e => e.id === id ? { ...e, ...updates } : e)
        .sort((a, b) => a.monthString.localeCompare(b.monthString))
    );
  };

  const selectedParams = useMemo(() => {
    if (selectedConfigId && savedConfigs) {
      const config = savedConfigs.find(c => c.id === selectedConfigId);
      if (config) return config.params;
    }
    return params;
  }, [selectedConfigId, savedConfigs, params]);

  const results = useMemo(() => calculateRoi(selectedParams), [selectedParams]);

  const isDetailed = selectedParams.usageMode === 'monthly' || selectedParams.usageMode === 'historical';
  const activeRate = results.effectiveUtilityRate ?? selectedParams.utilityRate;
  const activeRateProfile = results.effectiveUtilityRateProfile ?? Array(12).fill(activeRate);
  const activeProfile = results.effectiveMonthlyUsageProfile ?? selectedParams.monthlyUsageProfile;
  const activeFlat = results.effectiveMonthlyUsageKwh ?? selectedParams.monthlyUsageKwh;

  const baselineAnnualCost = isDetailed 
    ? activeProfile.reduce((acc, usage, i) => acc + (usage * activeRateProfile[i]), 0)
    : activeFlat * 12 * activeRate;
    
  // Filter for post-solar bills for ROI tracking
  const postSolarEntries = useMemo(() => {
    if (!params.solarSwitchDate) return [];
    return entries.filter(e => e.monthString >= params.solarSwitchDate! && (e.actualUsageKwh > 0 || e.billAmount > 0));
  }, [entries, params.solarSwitchDate]);

  const projectedAvgMonthlyBill = Math.max(0, (baselineAnnualCost - results.yearOneSavings) / 12);
  const actualAvgMonthlyBill = postSolarEntries.length > 0 ? postSolarEntries.reduce((a, b) => a + b.billAmount, 0) / postSolarEntries.length : 0;
  
  const adjustedAnnualSavings = (baselineAnnualCost - actualAvgMonthlyBill * 12);
  const newPaybackPeriod = adjustedAnnualSavings > 0 ? results.netCost / adjustedAnnualSavings : 0;
  
  const projected25YearSavings = results.total25YearSavings;
  const new25YearSavings = adjustedAnnualSavings > 0 ? (adjustedAnnualSavings * 25) - results.netCost : -results.netCost;
  const newRoiPercentage = results.netCost > 0 ? (new25YearSavings / results.netCost) * 100 : 0;

  const chartData = [...entries]
    .filter(e => e.actualUsageKwh > 0 || e.billAmount > 0)
    .sort((a, b) => a.monthString.localeCompare(b.monthString))
    .map(e => {
    const isPostSolar = params.solarSwitchDate ? e.monthString >= params.solarSwitchDate : false;
    let targetBill = projectedAvgMonthlyBill;
    
    if (!isPostSolar) {
       const mMatch = e.monthString.match(/-(\d{2})$/);
       let preSolarTarget = activeFlat * activeRate;
       if (mMatch && isDetailed) {
          const mIdx = parseInt(mMatch[1], 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
             preSolarTarget = activeProfile[mIdx] * activeRateProfile[mIdx];
          }
       }
       targetBill = preSolarTarget;
    }

    return {
      month: e.monthString,
      ActualBill: e.billAmount,
      TargetBill: targetBill,
      Usage: e.actualUsageKwh
    }
  });

  const totalVariance = postSolarEntries.reduce((acc, e) => acc + (e.billAmount - projectedAvgMonthlyBill), 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-start mb-6 align-middle">
          <div>
            <h2 className="text-2xl font-light text-white tracking-tight mb-2">Manage Bills & Track Progress</h2>
            <p className="text-sm text-slate-400">Track your actual monthly bills before and after solar to see variance against projections.</p>
          </div>
          <div className="flex items-center gap-4">
            {savedConfigs && savedConfigs.length > 0 && (
              <select
                value={selectedConfigId || ''}
                onChange={(e) => setSelectedConfigId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 max-w-[200px]"
              >
                <option value="">Current Setup</option>
                <optgroup label="Saved Projections">
                  {savedConfigs.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </optgroup>
              </select>
            )}
            <button 
              onClick={addEntry}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Bill
            </button>
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-900/30 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
               <Sun className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-200">Solar Switch Date</h3>
              <p className="text-xs text-slate-500">When was (or will) your solar system be activated?</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <label className="text-xs text-slate-400 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!params.solarSwitchDate} 
                  onChange={(e) => updateParam('solarSwitchDate', e.target.checked ? '' : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                Not yet switched
             </label>
             {params.solarSwitchDate && (
               <input
                 type="month"
                 value={params.solarSwitchDate}
                 onChange={(e) => updateParam('solarSwitchDate', e.target.value)}
                 className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
               />
             )}
          </div>
        </div>

        {postSolarEntries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 mt-6">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-sky-500" />
                <p className="text-[10px] uppercase text-slate-500 tracking-wider">Projected Post-Solar</p>
              </div>
              <p className="text-2xl font-mono text-white">{formatCurrency(projectedAvgMonthlyBill)} <span className="text-sm text-slate-500">/mo</span></p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <LineChart className="w-4 h-4 text-amber-500" />
                <p className="text-[10px] uppercase text-slate-500 tracking-wider">Actual Post-Solar</p>
              </div>
              <p className="text-2xl font-mono text-white">
                {formatCurrency(actualAvgMonthlyBill)} <span className="text-sm text-slate-500">/mo</span>
              </p>
            </div>
            <div className={`bg-slate-900/60 p-4 rounded-xl border ${totalVariance <= 0 ? 'border-emerald-900/50' : 'border-rose-900/50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className={`w-4 h-4 ${totalVariance <= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                <p className="text-[10px] uppercase text-slate-500 tracking-wider">Post-Solar Variance</p>
              </div>
              <p className={`text-2xl font-mono ${totalVariance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalVariance <= 0 ? '-' : '+'}{formatCurrency(Math.abs(totalVariance))}
              </p>
              <p className="text-xs text-slate-400 mt-1">{totalVariance <= 0 ? 'Ahead of projection' : 'Behind projection'}</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-sky-900/50">
              <p className="text-[10px] uppercase text-sky-500 tracking-wider mb-1">Adjusted Payback</p>
              <p className="text-2xl font-mono text-sky-400">
                {newPaybackPeriod > 0 ? `${newPaybackPeriod.toFixed(1)} yrs` : '---'}
              </p>
              <p className="text-xs text-sky-500/70 mt-1">vs {results.paybackPeriod.toFixed(1)} yrs mod</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-purple-900/50">
              <p className="text-[10px] uppercase text-purple-500 tracking-wider mb-1">Adj. 25yr Profit</p>
              <p className="text-2xl font-mono text-purple-400">
                {formatCurrency(new25YearSavings)}
              </p>
              <p className="text-xs text-purple-500/70 mt-1">vs {formatCurrency(projected25YearSavings)} mod</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-900/50">
              <p className="text-[10px] uppercase text-indigo-500 tracking-wider mb-1">Adj. 25yr ROI</p>
              <p className="text-2xl font-mono text-indigo-400">
                {newRoiPercentage > 0 ? `+${newRoiPercentage.toFixed(1)}%` : `${newRoiPercentage.toFixed(1)}%`}
              </p>
              <p className="text-xs text-indigo-500/70 mt-1">vs +{results.roiPercentage.toFixed(1)}% mod</p>
            </div>
          </div>
        )}

        {entries.length > 0 && (
          <div className="w-full mb-8 bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
            <div className="mb-4 text-xs text-slate-400 max-w-3xl">
              <span className="text-amber-500 font-medium">Model Target ($):</span> This line represents the expectation set by your solar projection model. Before the solar switch date, it shows what the model computed your bill should have been based on your baseline utility rate and profile. After solar, it shows the projected average post-solar bill. Compare your actual bills against this line to track accuracy.
            </div>
            <div className="w-full h-72 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontFamily: 'monospace' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="ActualBill" name="Actual Bill ($)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line yAxisId="left" type="step" dataKey="TargetBill" name="Model Target ($)" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {entries.length === 0 && (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl">
              No bills recorded yet. Add a bill to track your progress.
            </div>
          )}
          
          {entries.map((e) => {
            const isPostSolar = params.solarSwitchDate ? e.monthString >= params.solarSwitchDate : false;
            
            let projectedGen = 0;
            let efficiency = 0;
            let currentMonthRate = activeRate;
            const mMatch = e.monthString.match(/-(\d{2})$/);
            if (mMatch) {
              const mIdx = parseInt(mMatch[1], 10) - 1;
              if (mIdx >= 0 && mIdx < 12) {
                 projectedGen = results.monthlyEnergyData[mIdx]?.generation || 0;
                 currentMonthRate = activeRateProfile[mIdx];
              }
            }
            
            if (e.solarGeneratedKwh && projectedGen > 0) {
              efficiency = (e.solarGeneratedKwh / projectedGen) * 100;
            }
            
            const solarGen = e.solarGeneratedKwh || 0;
            const gridExp = e.gridExportedKwh || 0;
            const solarConsumed = Math.max(0, solarGen - gridExp);
            const solarValue = (solarConsumed * currentMonthRate) + (gridExp * params.sellBackRate);

            return (
              <div key={e.id} className={`bg-slate-900 border ${isPostSolar ? 'border-amber-900/40' : 'border-slate-800'} p-4 rounded-xl flex flex-col gap-4`}>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 tracking-wider mb-1 block">Billing Month (YYYY-MM)</label>
                      <input
                        type="month"
                        value={e.monthString}
                        onChange={(evt) => updateEntry(e.id, { monthString: evt.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 tracking-wider mb-1 block">Actual Bill Amount ($)</label>
                       <input
                          type="number"
                          value={e.billAmount}
                          onChange={(evt) => updateEntry(e.id, { billAmount: Number(evt.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white text-right font-mono focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 tracking-wider mb-1 block">Usage (kWh)</label>
                       <input
                          type="number"
                          value={e.actualUsageKwh}
                          onChange={(evt) => updateEntry(e.id, { actualUsageKwh: Number(evt.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white text-right font-mono focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 tracking-wider mb-1 block">Computed Rate ($/kWh)</label>
                      <div className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-sm text-slate-400 text-right font-mono h-[38px] flex items-center justify-end">
                        {e.actualUsageKwh > 0 ? (e.billAmount / e.actualUsageKwh).toFixed(4) : "0.0000"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 rounded-lg text-xs font-mono text-slate-400 w-full sm:w-auto shrink-0 justify-between sm:justify-start h-[38px] mt-5">
                     <span className={isPostSolar ? 'text-amber-500' : ''}>{isPostSolar ? 'Post-Solar' : 'Pre-Solar'}</span>
                  </div>
                  <button 
                    onClick={() => removeEntry(e.id)}
                    className="text-slate-500 hover:text-rose-400 p-2 shrink-0 transition-colors mt-5"
                    title="Remove Entry"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {isPostSolar && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full pt-4 border-t border-amber-900/20">
                    <div>
                      <label className="text-[10px] uppercase text-amber-500 tracking-wider mb-1 block border-b border-amber-900/30 pb-1">Solar Gen (kWh)</label>
                      <input
                        type="number"
                        placeholder={projectedGen > 0 ? projectedGen.toFixed(0) : '0'}
                        value={e.solarGeneratedKwh || ''}
                        onChange={(evt) => updateEntry(e.id, { solarGeneratedKwh: Number(evt.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-700 mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-amber-500 tracking-wider mb-1 block border-b border-amber-900/30 pb-1">Exported (kWh)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={e.gridExportedKwh || ''}
                        onChange={(evt) => updateEntry(e.id, { gridExportedKwh: Number(evt.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-700 mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-emerald-500 tracking-wider mb-1 block border-b border-emerald-900/30 pb-1">Solar Value ($)</label>
                      <div className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-sm text-emerald-400 text-right font-mono h-[38px] flex items-center justify-end mt-2">
                        {solarValue > 0 ? formatCurrency(solarValue) : "$0"}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-sky-500 tracking-wider mb-1 block border-b border-sky-900/30 pb-1">Gen Efficiency</label>
                      <div className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-sm text-sky-400 text-right font-mono h-[38px] flex items-center justify-end mt-2">
                        {efficiency > 0 ? `${efficiency.toFixed(1)}%` : "---"}
                      </div>
                      <p className="text-[9px] text-slate-500 text-right mt-1">vs {projectedGen.toFixed(0)} kWh mod</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
