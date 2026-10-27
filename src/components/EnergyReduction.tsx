import React from 'react';
import { EnergyReductionProject, SolarParams } from '../types';
import { Zap, Plus, Trash2, ShieldAlert, Home } from 'lucide-react';
import { formatCurrency, calculateReductionKwh, getActiveEnergyParams } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface EnergyReductionProps {
  params: SolarParams;
  projects: EnergyReductionProject[];
  setProjects: React.Dispatch<React.SetStateAction<EnergyReductionProject[]>>;
  updateParam: (key: keyof SolarParams, value: any) => void;
}

export function EnergyReduction({ params, projects, setProjects, updateParam }: EnergyReductionProps) {
  const addProject = () => {
    setProjects([
      ...projects,
      {
        id: Date.now().toString(),
        name: 'New Upgrade',
        type: 'lighting',
        percentageReduction: 10,
        upfrontCost: 1000,
        enabled: true,
        calculationMethod: 'percentage',
        wattsBefore: 60,
        wattsAfter: 10,
        quantity: 10,
        hoursPerDay: 8
      }
    ]);
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const updateProject = (id: string, updates: Partial<EnergyReductionProject>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const activeParams = getActiveEnergyParams(params);
  const useProfile = params.usageMode === 'monthly' || params.usageMode === 'historical';

  // Use base or current usage directly
  const baseAnnualKwh = useProfile
    ? activeParams.profile.reduce((a, b) => a + b, 0)
    : activeParams.flatUsage * 12;

  const estimatedAnnualSavingsKwh = projects
    .filter(p => p.enabled)
    .reduce((acc, p) => acc + calculateReductionKwh(p, baseAnnualKwh), 0);

  const totalReductionPercent = baseAnnualKwh > 0 ? (estimatedAnnualSavingsKwh / baseAnnualKwh) * 100 : 0;

  const totalCost = projects
    .filter(p => p.enabled)
    .reduce((acc, p) => acc + p.upfrontCost, 0);

  const currentBill = baseAnnualKwh * activeParams.rate;
  
  const estimatedAnnualBillSavings = estimatedAnnualSavingsKwh * activeParams.rate;
  const newAnnualKwh = Math.max(0, baseAnnualKwh - estimatedAnnualSavingsKwh);
  const newBill = newAnnualKwh * activeParams.rate;

  const paybackYears = estimatedAnnualBillSavings > 0 ? totalCost / estimatedAnnualBillSavings : 0;

  const formatPayback = (years: number) => {
    if (years <= 0) return 'No payback';
    if (years < 1) {
      return `Payback: ${(years * 12).toFixed(1)} mos`;
    }
    return `Payback: ${years.toFixed(1)} yrs`;
  };

  const totalLifespanSavings = projects
    .filter(p => p.enabled)
    .reduce((acc, p) => {
        const savingsKwh = calculateReductionKwh(p, baseAnnualKwh);
        let projectSavings = 0;
        let rate = activeParams.rate;
        for (let y = 1; y <= (p.lifespanYears || 10); y++) {
             projectSavings += savingsKwh * rate;
             rate *= (1 + params.annualBillIncrease / 100);
        }
        return acc + projectSavings;
    }, 0);

  const totalLifespanCo2Tons = projects
    .filter(p => p.enabled)
    .reduce((acc, p) => {
         const savingsKwh = calculateReductionKwh(p, baseAnnualKwh);
         return acc + (savingsKwh * (p.lifespanYears || 10));
    }, 0) * (1 - params.gridRenewablePercentage / 100) * 0.00043;

  const chartData = [
    { name: 'Annual kWh', Before: baseAnnualKwh, After: newAnnualKwh },
    { name: 'Annual Bill ($)', Before: currentBill, After: newBill }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-light text-white tracking-tight mb-2">Energy Reduction Hub</h2>
            <p className="text-sm text-slate-400">Implement efficiency upgrades to lower your baseline energy consumption before or independently of solar.</p>
          </div>
          <button 
            onClick={addProject}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Upgrade
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="h-56 bg-slate-950/40 border border-slate-800 p-4 rounded-xl font-mono text-xs flex flex-col">
            <p className="font-sans text-sm text-slate-300 mb-2">Yearly electricity use (kWh)</p>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[chartData[0]]} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => Math.round(v).toLocaleString('en-US')} width={70} />
                  <Tooltip
                    cursor={{ fill: '#1e293b55' }}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                    formatter={(value: number) => Math.round(value).toLocaleString('en-US')}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Before" name="Before upgrades" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  <Bar dataKey="After" name="After upgrades" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="h-56 bg-slate-950/40 border border-slate-800 p-4 rounded-xl font-mono text-xs flex flex-col">
            <p className="font-sans text-sm text-slate-300 mb-2">Yearly electric bill</p>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[chartData[1]]} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} width={70} />
                  <Tooltip
                    cursor={{ fill: '#1e293b55' }}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Before" name="Before upgrades" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  <Bar dataKey="After" name="After upgrades" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8 mt-6">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
            <p className="text-[11px] uppercase text-slate-500 tracking-wider mb-1">Baseline Usage</p>
            <p className="text-xl font-mono text-white">{baseAnnualKwh.toLocaleString('en-US', {maximumFractionDigits: 0})} <span className="text-xs text-slate-500">kWh/yr</span></p>
            <p className="text-xs text-slate-400 mt-1">{formatCurrency(currentBill)} /yr</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-900/50">
            <p className="text-[11px] uppercase text-emerald-500 tracking-wider mb-1">Reduction</p>
            <p className="text-xl font-mono text-emerald-400">-{Math.min(totalReductionPercent, 100).toFixed(1)}%</p>
            <p className="text-xs text-emerald-500/80 mt-1">Avoid {formatCurrency(estimatedAnnualBillSavings)} /yr</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-sky-900/50">
            <p className="text-[11px] uppercase text-sky-500 tracking-wider mb-1">New Usage</p>
            <p className="text-xl font-mono text-sky-400">{newAnnualKwh.toLocaleString('en-US', {maximumFractionDigits: 0})} <span className="text-xs text-sky-500/50">kWh/yr</span></p>
            <p className="text-xs text-sky-500/70 mt-1">{formatCurrency(newBill)} /yr</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-amber-900/50">
            <p className="text-[11px] uppercase text-amber-500 tracking-wider mb-1">Upgrade Cost</p>
            <p className="text-xl font-mono text-amber-400">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-amber-500/70 mt-1">{formatPayback(paybackYears)}</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-purple-900/50">
            <p className="text-[11px] uppercase text-purple-500 tracking-wider mb-1">Lifespan Net & ROI</p>
            <p className="text-xl font-mono text-purple-400">{formatCurrency(totalLifespanSavings - totalCost)}</p>
            <p className="text-xs text-purple-500/70 mt-1 font-mono">
               ROI: {totalCost > 0 ? (((totalLifespanSavings - totalCost) / totalCost) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-teal-900/50">
            <p className="text-[11px] uppercase text-teal-500 tracking-wider mb-1">CO₂ Averted</p>
            <p className="text-xl font-mono text-teal-400">{totalLifespanCo2Tons.toFixed(1)} <span className="text-xs text-teal-500/50">tons</span></p>
            <p className="text-xs text-teal-500/70 mt-1">Over project lifespans</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-sky-900/50 flex flex-col justify-center">
            <div className="flex items-center gap-1 mb-1">
              <Home className="w-3 h-3 text-sky-400/80" />
              <p className="text-[11px] uppercase text-sky-400/80">Homes Offset</p>
            </div>
            <p className="text-xl font-mono text-sky-400">{(totalLifespanCo2Tons / 4.515).toFixed(1)} <span className="text-xs text-sky-500/50">home-yrs</span></p>
            <p className="text-xs text-sky-500/70 mt-1">Equivalent lifespan savings</p>
          </div>
        </div>
        
        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Factor Reduction into Solar Calculator</p>
              <p className="text-xs text-slate-400">Apply this reduced energy profile to the solar projection.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={params.useReducedEnergyProfile}
              onChange={(e) => updateParam('useReducedEnergyProfile', e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        <div className="space-y-4">
          {projects.length === 0 && (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl">
              No energy reduction projects added. Click "Add Upgrade" to start.
            </div>
          )}
          
          {projects.map((p) => (
            <div key={p.id} className={`bg-slate-900 border ${p.enabled ? 'border-slate-700' : 'border-slate-800 opacity-60'} p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center`}>
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  checked={p.enabled}
                  onChange={(e) => updateProject(p.id, { enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-600 focus:ring-amber-500 mt-1 sm:mt-0"
                />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
                  <div>
                    <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Project Name</label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updateProject(p.id, { name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Method</label>
                    <select
                      value={p.calculationMethod || 'percentage'}
                      onChange={(e) => updateProject(p.id, { calculationMethod: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="percentage">Total % Reduction</option>
                      <option value="fixtures">Fixture Replacement</option>
                      <option value="kwh_reduction">Direct kWh Reduction</option>
                      <option value="usage_before_after">Usage Before / After</option>
                      <option value="thermostat">Thermostat Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Upfront Cost ($)</label>
                    <input
                        type="number"
                        value={p.upfrontCost}
                        onChange={(e) => updateProject(p.id, { upfrontCost: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Starts In (Mos)</label>
                    <input
                      type="number"
                      value={p.startMonthOut ?? 0}
                      onChange={(e) => updateProject(p.id, { startMonthOut: Number(e.target.value) })}
                      min="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Lifespan (Yrs)</label>
                    <input
                      type="number"
                      value={p.lifespanYears ?? 10}
                      onChange={(e) => updateProject(p.id, { lifespanYears: Number(e.target.value) })}
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex flex-col items-end justify-end gap-1 mb-1">
                    <p className="text-sm font-semibold text-amber-500/90 font-mono">
                      -{Math.round(calculateReductionKwh(p, baseAnnualKwh)).toLocaleString()} kWh/yr
                    </p>
                    <p className="text-[11px] text-teal-400 font-mono">
                      -{((calculateReductionKwh(p, baseAnnualKwh) * (p.lifespanYears || 10)) * (1 - params.gridRenewablePercentage / 100) * 0.00043).toFixed(1)}t CO₂ total
                    </p>
                    <p className="text-[11px] text-purple-400 font-mono">
                      {(() => {
                        const savingsKwh = calculateReductionKwh(p, baseAnnualKwh);
                        let projectSavings = 0;
                        let rate = activeParams.rate;
                        for (let y = 1; y <= (p.lifespanYears || 10); y++) {
                            projectSavings += savingsKwh * rate;
                            rate *= (1 + params.annualBillIncrease / 100);
                        }
                        const netProfit = projectSavings - (p.upfrontCost || 0);
                        const roi = (p.upfrontCost || 0) > 0 ? (netProfit / (p.upfrontCost || 1)) * 100 : 0;
                        return `${formatCurrency(netProfit)} (${roi.toFixed(1)}% ROI)`;
                      })()}
                    </p>
                  </div>
                </div>

                {(!p.calculationMethod || p.calculationMethod === 'percentage') && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Reduction %</label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={p.percentageReduction}
                          onChange={(e) => updateProject(p.id, { percentageReduction: Number(e.target.value) })}
                          min="0"
                          max="100"
                          className="w-full bg-slate-950 border border-slate-800 rounded-l px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                        />
                        <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded-r border-y border-r border-slate-800 text-sm">%</span>
                      </div>
                    </div>
                  </div>
                )}

                {p.calculationMethod === 'fixtures' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Watts Before</label>
                      <input
                        type="number"
                        value={p.wattsBefore ?? 60}
                        onChange={(e) => updateProject(p.id, { wattsBefore: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Watts After</label>
                      <input
                        type="number"
                        value={p.wattsAfter ?? 10}
                        onChange={(e) => updateProject(p.id, { wattsAfter: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Quantity</label>
                      <input
                        type="number"
                        value={p.quantity ?? 10}
                        onChange={(e) => updateProject(p.id, { quantity: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Hours/Day</label>
                      <input
                        type="number"
                        value={p.hoursPerDay ?? 8}
                        onChange={(e) => updateProject(p.id, { hoursPerDay: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {p.calculationMethod === 'kwh_reduction' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">kWh Reduction / Month</label>
                      <input
                        type="number"
                        value={p.kwhReductionPerMonth ?? 0}
                        onChange={(e) => updateProject(p.id, { kwhReductionPerMonth: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {p.calculationMethod === 'usage_before_after' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">kWh / Month Before</label>
                      <input
                        type="number"
                        value={p.kwhBefore ?? 0}
                        onChange={(e) => updateProject(p.id, { kwhBefore: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">kWh / Month After</label>
                      <input
                        type="number"
                        value={p.kwhAfter ?? 0}
                        onChange={(e) => updateProject(p.id, { kwhAfter: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {p.calculationMethod === 'thermostat' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">Degree Decrease</label>
                      <input
                        type="number"
                        value={p.degreeDecrease ?? 0}
                        onChange={(e) => updateProject(p.id, { degreeDecrease: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase text-slate-500 tracking-wider mb-1 block">kWh Savings / ° / Mo</label>
                      <input
                        type="number"
                        value={p.kwhSavingsPerDegree ?? 0}
                        onChange={(e) => updateProject(p.id, { kwhSavingsPerDegree: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => removeProject(p.id)}
                className="text-slate-500 hover:text-rose-400 p-2 ml-auto shrink-0 transition-colors"
                title="Remove Project"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
