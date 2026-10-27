import React, { useState, useMemo, useDeferredValue } from 'react';
import { Sun, Download, Zap, Leaf, BarChart2, Activity, Calculator, ShieldAlert, Save, GitCompare, RotateCcw, LayoutDashboard, LineChart, FileText, User as UserIcon, Loader2, Copy, Check, Trash2, HelpCircle, Columns3 } from 'lucide-react';
import { RoiChart } from './components/Chart';
import { SensitivityChart } from './components/SensitivityChart';
import { Equations } from './components/Equations';
import { OutageChart } from './components/OutageChart';
import { MonthlyBalanceChart } from './components/MonthlyBalanceChart';
import { ChaliceIcon } from './components/ChaliceIcon';
import { RenewabilityChart } from './components/RenewabilityChart';
import { calculateRoi, formatCurrency, generateSensitivityData, getActiveEnergyParams } from './utils';
import { SolarParams, SensitivityVariable, EnergyReductionProject } from './types';
import { EnergyReduction } from './components/EnergyReduction';
import { ProgressTracker } from './components/ProgressTracker';
import { PdfReport } from './components/PdfReport';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { InputsPanel, VendorQuote, SectionKey } from './components/InputsPanel';
import { ScenarioManager, ScenarioCompare } from './components/Scenarios';
import { Scenario, Compared, loadScenarios, storeScenarios, SCENARIO_COLORS, CURRENT_COLOR } from './scenarios';
import { ResultsSummary } from './components/ResultsSummary';
import { Segmented, Modal, cn, btn } from './components/ui';
import { GoalPicker, GoalSuggestions } from './components/GoalPanel';
import { TrackContext, useGoalTracks } from './components/goalTracks';
import { Tour, TourStep, shouldAutoStartTour } from './components/Tour';
import { GoalKey, goalByKey, suggest, withParams, Suggestion } from './goals';
import { exportToPDF } from './pdfExport';
import { auth, signInWithGoogle, logout, saveConfiguration, updateConfiguration, getConfiguration, getUserConfigurations, SavedConfig } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const DEFAULT_QUOTES: VendorQuote[] = [
  { id: '1', companyName: 'EPC', systemSizeKw: 76.7, totalCost: 183693 },
  { id: '2', companyName: 'New Era', systemSizeKw: 75.9, totalCost: 193232 },
  { id: '3', companyName: 'Bay Area', systemSizeKw: 75.5, totalCost: 218976 },
];

// Why each default was chosen, with sources: src/paramInfo.ts.
const DEFAULT_PARAMS: SolarParams = {
  inputMode: 'detailed',
  panelWattage: 400,
  numberOfPanels: 110,
  costPerWatt: 2.39,
  totalSystemSizeKw: 44.0,
  totalGrossCost: 99880,
  hasSolarEfficiency: false,
  useSeasonalGenerationCurve: true,
  efficiencyMode: 'flat',
  solarEfficiency: 100,
  monthlyEfficiencyProfile: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
  hasIncentives: true,
  federalTaxCreditPercent: 30,
  stateRebateAmount: 0,
  
  usageMode: 'monthly',
  monthlyUsageKwh: 8850,
  monthlyUsageProfile: [6842.21258, 5022.635169, 6764.87517, 10431.95739, 11368.59936, 14279.49357, 11063.54624, 10790.71705, 6406.115515, 5286.871322, 6661.758622, 11160.21801],
  historicalBills: [
    { id: "2024-03", monthString: "2024-03", actualUsageKwh: 5730.96, billAmount: 1259.57 },
    { id: "2024-04", monthString: "2024-04", actualUsageKwh: 5411.03, billAmount: 1138.17 },
    { id: "2024-05", monthString: "2024-05", actualUsageKwh: 5051.64, billAmount: 1042.57 },
    { id: "2024-06", monthString: "2024-06", actualUsageKwh: 9039.04, billAmount: 1718.57 },
    { id: "2024-07", monthString: "2024-07", actualUsageKwh: 10397.04, billAmount: 1818.58 },
    { id: "2024-08", monthString: "2024-08", actualUsageKwh: 10242.16, billAmount: 1807.45 },
    { id: "2024-09", monthString: "2024-09", actualUsageKwh: 10937.48, billAmount: 1942.09 },
    { id: "2024-10", monthString: "2024-10", actualUsageKwh: 9547.60, billAmount: 1726.25 },
    { id: "2024-11", monthString: "2024-11", actualUsageKwh: 7829.40, billAmount: 1558.61 },
    { id: "2024-12", monthString: "2024-12", actualUsageKwh: 8134.40, billAmount: 1502.14 },
    { id: "2025-01", monthString: "2025-01", actualUsageKwh: 4576.88, billAmount: 1157.93 },
    { id: "2025-02", monthString: "2025-02", actualUsageKwh: 5378.32, billAmount: 1190.47 },
    { id: "2025-03", monthString: "2025-03", actualUsageKwh: 5488.32, billAmount: 1092.90 },
    { id: "2025-04", monthString: "2025-04", actualUsageKwh: 4569.12, billAmount: 1241.78 },
    { id: "2025-05", monthString: "2025-05", actualUsageKwh: 6748.60, billAmount: 1405.00 },
    { id: "2025-06", monthString: "2025-06", actualUsageKwh: 12103.04, billAmount: 2316.16 },
    { id: "2025-07", monthString: "2025-07", actualUsageKwh: 10477.52, billAmount: 2041.93 },
    { id: "2025-08", monthString: "2025-08", actualUsageKwh: 10304.36, billAmount: 2032.60 },
    { id: "2025-09", monthString: "2025-09", actualUsageKwh: 12900.96, billAmount: 2526.67 },
    { id: "2025-10", monthString: "2025-10", actualUsageKwh: 10343.24, billAmount: 2066.25 },
    { id: "2025-11", monthString: "2025-11", actualUsageKwh: 12411.60, billAmount: 2386.05 },
    { id: "2025-12", monthString: "2025-12", actualUsageKwh: 7765.12, billAmount: 1643.40 },
    { id: "2026-01", monthString: "2026-01", actualUsageKwh: 6784.72, billAmount: 1531.81 },
    { id: "2026-02", monthString: "2026-02", actualUsageKwh: 6723.32, billAmount: 1674.37 }
  ],
  historicalCompMode: 'average',
  solarSwitchDate: '',
  useReducedEnergyProfile: false,
  
  utilityRate: 0.20,
  annualBillIncrease: 3,
  
  hasBattery: false,
  batteryCapacityKwh: 0,
  batteryCostPerKwh: 400,
  sellBackRate: 0.20,
  hasLinkedSellBackRate: true,

  hasMaintenance: false,
  annualMaintenanceCost: 750,
  
  isFinanced: false,
  loanTermYears: 10,
  loanInterestRate: 7,
  downPayment: 0,
  lumpSumPayments: [],

  gridRenewablePercentage: 10,
};

const getInitialDefaults = (): SolarParams => {
  try {
    const saved = localStorage.getItem('UUC_SOLAR_DEFAULTS');
    if (saved) return { ...DEFAULT_PARAMS, ...JSON.parse(saved) };
  } catch (e) {}
  return DEFAULT_PARAMS;
};

type ChartTab = 'timeline' | 'scenarios' | 'sensitivity' | 'compare' | 'renewability' | 'outage' | 'equations';

const CHART_TABS: { key: ChartTab; label: string; icon: React.ReactNode; blurb: string }[] = [
  { key: 'timeline', label: 'Savings over time', icon: <Activity className="w-4 h-4" />, blurb: 'Does it pay off, and when?' },
  { key: 'scenarios', label: 'Compare', icon: <Columns3 className="w-4 h-4" />, blurb: 'How do our saved scenarios stack up?' },
  { key: 'sensitivity', label: 'What if…', icon: <BarChart2 className="w-4 h-4" />, blurb: 'What changes if we adjust one setting?' },
  { key: 'compare', label: 'Monthly balance', icon: <GitCompare className="w-4 h-4" />, blurb: 'Does solar keep up with our use each month?' },
  { key: 'renewability', label: 'Energy mix', icon: <Leaf className="w-4 h-4" />, blurb: 'How clean is our electricity, before and after?' },
  { key: 'outage', label: 'Outage backup', icon: <ShieldAlert className="w-4 h-4" />, blurb: 'Could we keep the lights on in a long outage?' },
  { key: 'equations', label: 'Formulas', icon: <Calculator className="w-4 h-4" />, blurb: 'How is each number worked out?' },
];

export default function App() {
  const [params, setParams] = useState<SolarParams>(getInitialDefaults());
  const [appScreen, setAppScreen] = useState<'solar' | 'reduction' | 'progress'>('solar');
  const [reductionProjects, setReductionProjects] = useState<EnergyReductionProject[]>([]);

  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [scenarios, setScenariosState] = useState<Scenario[]>(loadScenarios);
  const setScenarios = (fn: (prev: Scenario[]) => Scenario[]) => setScenariosState(prev => { const next = fn(prev); storeScenarios(next); return next; });
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [activeTab, setActiveTab] = useState<ChartTab>('timeline');
  const [summaryTab, setSummaryTab] = useState<'metrics' | 'narrative'>('metrics');
  const [goalKey, setGoalKey] = useState<GoalKey>(() => {
    try { return (localStorage.getItem('UUC_SOLAR_GOAL') as GoalKey) || 'savings'; } catch { return 'savings'; }
  });
  const goal = goalByKey(goalKey) ?? goalByKey('savings');
  const chooseGoal = (k: GoalKey) => {
    setGoalKey(k);
    try { localStorage.setItem('UUC_SOLAR_GOAL', k); } catch { /* not remembered this time */ }
  };
  const [undo, setUndo] = useState<{ title: string; params: SolarParams; applied: SolarParams } | null>(null);
  const [touring, setTouring] = useState(false);
  React.useEffect(() => {
    if (shouldAutoStartTour()) {
      const t = setTimeout(() => setTouring(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  const [highlightedEquationSection, setHighlightedEquationSection] = useState<string | null>(null);

  const [sectionsOpen, setSectionsOpen] = useState<Record<SectionKey, boolean>>({
    quotes: true,
    system: true,
    energy: false,
    efficiency: false,
    maintenance: false,
    storage: false,
    incentives: false,
    financing: false,
  });
  const toggleSection = (key: SectionKey) => setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const chartRef = React.useRef<HTMLDivElement>(null);

  // Clicking a number opens its formula.
  const navigateToEquation = (sectionKey: string) => {
    setAppScreen('solar');
    setActiveTab('equations');
    setHighlightedEquationSection(sectionKey);
    setTimeout(() => chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // Clicking an input name in a formula opens its section and points at it. It never
  // changes settings: if the input isn't shown in the current mode, it points at the section.
  const navigateToSlider = (sliderId: string, sectionKey: string) => {
    setAppScreen('solar');
    if (sectionKey in sectionsOpen) setSectionsOpen(prev => ({ ...prev, [sectionKey]: true }));
    setTimeout(() => {
      const el = document.getElementById(sliderId) ?? document.getElementById(`section-${sectionKey}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-500/80', 'ring-offset-4', 'ring-offset-slate-900');
      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500/80', 'ring-offset-4', 'ring-offset-slate-900'), 2000);
    }, 100);
  };

  const [sensitivityVar, setSensitivityVar] = useState<SensitivityVariable>('systemSize');
  const [sensitivityMetric, setSensitivityMetric] = useState<'profit' | 'breakeven' | 'both' | 'slope'>('both');

  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [configIsPublic, setConfigIsPublic] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [publicConfigs, setPublicConfigs] = useState<SavedConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refreshPublic = () => import('./lib/firebase').then(fb => fb.getPublicConfigurations()).then(setPublicConfigs).catch(console.error);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchConfigs();
      } else {
        setSavedConfigs([]);
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const sharedConfigId = urlParams.get('configId');
    if (sharedConfigId) {
      getConfiguration(sharedConfigId).then(cfg => {
        if (cfg) {
          setParams({ ...DEFAULT_PARAMS, ...cfg.params });
          setCurrentConfigId(cfg.id);
        }
      }).catch(err => console.error("Could not load shared config", err));
    }

    refreshPublic();
    return unsub;
  }, []);

  const fetchConfigs = async () => {
    try {
      const configs = await getUserConfigurations();
      setSavedConfigs(configs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)));
    } catch (e) {
      console.error(e);
    }
  };

  const ownsCurrent = !!currentConfigId && savedConfigs.some(c => c.id === currentConfigId);

  const handleSaveConfig = async () => {
    if (!configName.trim() || !user) return;
    setIsSaving(true);
    try {
      if (ownsCurrent) {
        await updateConfiguration(currentConfigId!, params, configName, configDescription, configIsPublic);
      } else {
        const id = await saveConfiguration(params, configName, configDescription, configIsPublic);
        setCurrentConfigId(id);
      }
      await fetchConfigs();
      refreshPublic();
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  const loadConfig = (id: string) => {
    const cfg = savedConfigs.find(c => c.id === id) ?? publicConfigs.find(c => c.id === id);
    if (cfg) {
      setParams({ ...DEFAULT_PARAMS, ...cfg.params });
      setCurrentConfigId(cfg.id);
      setConfigName(cfg.title || "");
      setConfigDescription(cfg.description || "");
      setConfigIsPublic(cfg.isPublic || false);
    }
  };

  const copyShareLink = () => {
    if (!currentConfigId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('configId', currentConfigId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateParam = (key: keyof SolarParams, value: any) => {
    setParams(prev => {
      const nextParams = { ...prev, [key]: value };
      const active = getActiveEnergyParams(nextParams);
      if (nextParams.hasLinkedSellBackRate) {
        nextParams.sellBackRate = active.rate;
      }
      return nextParams;
    });
  };

  const enableBattery = () => {
    setParams(prev => ({ ...prev, hasBattery: true, batteryCapacityKwh: prev.batteryCapacityKwh > 0 ? prev.batteryCapacityKwh : 40 }));
    navigateToSlider('slider-batteryCapacityKwh', 'storage');
  };

  const applyQuote = (q: VendorQuote) => {
    setParams(prev => ({ ...prev, inputMode: 'total', totalSystemSizeKw: q.systemSizeKw, totalGrossCost: q.totalCost }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    await exportToPDF('pdf-report-container', 'uuc-solar-projection.pdf');
    setIsExporting(false);
  };

  const effectiveParams = useMemo(() => {
    const newParams = { ...params };
    if (params.useReducedEnergyProfile) {
      newParams.reductionProjects = reductionProjects;
    }
    return newParams;
  }, [params, reductionProjects]);

  const results = useMemo(() => calculateRoi(effectiveParams), [effectiveParams]);

  // Suggestions re-run the model a few dozen times, so they trail slightly behind fast
  // slider drags instead of slowing them down. Slider tracks are worked out in a worker.
  const deferredParams = useDeferredValue(effectiveParams);
  const goalTracks = useGoalTracks(effectiveParams, goal);
  const suggestions = useMemo(() => suggest(deferredParams, goal, DEFAULT_QUOTES), [deferredParams, goal]);
  const goalNow = goal.value(results, effectiveParams);

  const applySuggestion = (sg: Suggestion) => {
    const next = withParams(params, sg.changes);
    setUndo({ title: sg.title, params, applied: next });
    setParams(next);
    if (sg.changes.isFinanced) setSectionsOpen(prev => ({ ...prev, financing: true }));
    if (sg.changes.hasBattery) setSectionsOpen(prev => ({ ...prev, storage: true }));
    if (sg.changes.hasIncentives) setSectionsOpen(prev => ({ ...prev, incentives: true }));
  };
  // Undo only covers the suggestion itself: any later edit retires it.
  React.useEffect(() => { if (undo && params !== undo.applied) setUndo(null); }, [params, undo]);

  const tourSteps: TourStep[] = [
    { title: 'Welcome to the UUC solar calculator', body: 'It estimates what solar panels would cost UUC, what they would save on electric bills, and how much carbon they would cut. This takes about a minute; you can skip it and reopen it from “How it works” at the top.', before: () => setAppScreen('solar') },
    { target: 'goal-picker', title: 'Pick what matters most', body: 'Most money saved, best return, fastest payback, lowest carbon or least cash up front. Every input then shows how raising it moves that goal (green helps, red hurts), and the results suggest the changes that help most.' },
    { target: 'section-quotes', title: 'Start from a real quote', body: 'These are the bids UUC received. Pick one, or set the system size and price yourself in step 2.', before: () => setSectionsOpen(prev => ({ ...prev, quotes: true })) },
    { target: 'section-energy', title: 'Electricity use and rates', body: 'UUC’s own bills are already loaded, month by month. The rate is the all-in price per kWh from those bills.', before: () => setSectionsOpen(prev => ({ ...prev, energy: true })) },
    { target: 'section-incentives', title: 'Switch on what applies', body: 'Tax credits, a loan, a battery, maintenance. Each has its own switch, so you can try it with and without.' },
    { target: 'slider-utilityRate', title: 'Every input explains itself', body: 'Click the (i) next to any input to see what it means, why its default was picked and where the number came from.', before: () => setSectionsOpen(prev => ({ ...prev, energy: true })) },
    { target: 'results-summary', title: 'Results update instantly', body: 'Payback, savings and return change as you adjust anything. Click a number to see exactly how it’s worked out.' },
    { target: 'goal-suggestions', title: 'Suggestions for your goal', body: 'The calculator tries quotes, system sizes, loan options and a battery, and lists the ones that most improve your goal. Apply one with a click, and undo it if you change your mind.' },
    { target: 'scenarios', title: 'Save and compare scenarios', body: 'Save the current settings as a scenario, change something (another quote, a loan, a battery), save again, and tick the ones to compare. The Compare tab lines them up on one chart and spells out the differences.' },
    { target: 'chart-tabs', title: 'Look deeper', body: 'Savings over time, scenario comparison, what-if, month-by-month balance, energy mix, outage backup and every formula.' },
    { target: 'saved-setups', title: 'Save and share', body: 'Sign in with Google to save a setup and share a link to it. That’s the tour; enjoy exploring.' },
  ];

  // Scenarios: colours by position among the ticked ones, results worked out once each.
  const scenarioColors = useMemo(() => {
    const out: Record<string, string> = {};
    scenarios.filter(sc => sc.compare).forEach((sc, i) => { out[sc.id] = SCENARIO_COLORS[i % SCENARIO_COLORS.length]; });
    return out;
  }, [scenarios]);
  const currentCompared: Compared = { name: 'Current setup', color: CURRENT_COLOR, params: effectiveParams, results };
  const comparedScenarios: Compared[] = useMemo(() => scenarios.filter(sc => sc.compare).map(sc => {
    const p = { ...DEFAULT_PARAMS, ...sc.params, reductionProjects: sc.params.useReducedEnergyProfile ? reductionProjects : undefined };
    return { name: sc.name, color: scenarioColors[sc.id], params: p, results: calculateRoi(p) };
  }), [scenarios, scenarioColors, reductionProjects]);

  const saveScenario = () => {
    setScenarios(prev => {
      const used = new Set(prev.map(sc => sc.name));
      let n = prev.length + 1;
      while (used.has(`Scenario ${n}`)) n++;
      const ticked = prev.filter(sc => sc.compare).length;
      return [...prev, { id: `${Date.now()}`, name: vendorName ? `Scenario ${n} (${vendorName})` : `Scenario ${n}`, params, compare: ticked < 4, createdAt: Date.now() }];
    });
  };
  const toggleScenario = (id: string) => {
    setScenarios(prev => {
      const target = prev.find(sc => sc.id === id);
      if (target && !target.compare && prev.filter(sc => sc.compare).length >= 4) return prev;
      return prev.map(sc => sc.id === id ? { ...sc, compare: !sc.compare } : sc);
    });
    setActiveTab('scenarios');
  };

  // Only offer "what if" variables for features that are switched on.
  const sensitivityOptions: { value: SensitivityVariable; label: string }[] = [
    { value: 'systemSize', label: 'System size (kW)' },
    ...(params.hasBattery ? [{ value: 'battery' as const, label: 'Battery size (kWh)' }] : []),
    ...(params.isFinanced ? [
      { value: 'interestRate' as const, label: 'Interest rate (%)' },
      { value: 'downPayment' as const, label: 'Down payment ($)' },
      { value: 'loanTerm' as const, label: 'Loan length (years)' },
    ] : []),
  ];
  const activeSensitivityVar = sensitivityOptions.some(o => o.value === sensitivityVar) ? sensitivityVar : 'systemSize';
  const sensitivityData = useMemo(
    () => activeTab === 'sensitivity' ? generateSensitivityData(effectiveParams, activeSensitivityVar) : [],
    [effectiveParams, activeSensitivityVar, activeTab]
  );

  const applySensitivityValue = (value: number) => {
    if (activeSensitivityVar === 'systemSize') {
      if (params.inputMode === 'detailed') {
        updateParam('numberOfPanels', Math.max(1, Math.round((value * 1000) / params.panelWattage)));
      } else {
        const perKw = params.totalSystemSizeKw > 0 ? params.totalGrossCost / params.totalSystemSizeKw : 0;
        setParams(prev => ({ ...prev, totalSystemSizeKw: Math.round(value * 10) / 10, totalGrossCost: Math.round(value * perKw) }));
      }
    }
    if (activeSensitivityVar === 'battery') updateParam('batteryCapacityKwh', Math.round(value));
    if (activeSensitivityVar === 'interestRate') updateParam('loanInterestRate', Math.round(value * 4) / 4);
    if (activeSensitivityVar === 'downPayment') updateParam('downPayment', Math.round(value / 500) * 500);
    if (activeSensitivityVar === 'loanTerm') updateParam('loanTermYears', Math.round(value));
  };

  const vendorName = useMemo(() => {
    if (params.inputMode === 'total') {
      const match = DEFAULT_QUOTES.find(q => q.systemSizeKw === params.totalSystemSizeKw && q.totalCost === params.totalGrossCost);
      return match?.companyName;
    }
    return undefined;
  }, [params.inputMode, params.totalSystemSizeKw, params.totalGrossCost]);

  const isAdmin = user?.email === 'benczech212@gmail.com';
  const screens = [
    { key: 'solar' as const, label: 'Solar calculator', icon: <Sun className="w-4 h-4" /> },
    { key: 'reduction' as const, label: 'Energy upgrades', icon: <Zap className="w-4 h-4" /> },
    { key: 'progress' as const, label: 'Bills and tracking', icon: <LineChart className="w-4 h-4" /> },
  ];
  const tab = CHART_TABS.find(t => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3 mr-auto">
            <ChaliceIcon className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white leading-tight">UUC Solar Calculator</h1>
              <p className="text-xs text-slate-400">Unitarian Universalists of Clearwater</p>
            </div>
          </div>
          <nav className="flex gap-1 order-3 w-full sm:order-none sm:w-auto overflow-x-auto" aria-label="Screens">
            {screens.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setAppScreen(s.key)}
                aria-current={appScreen === s.key ? 'page' : undefined}
                className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                  appScreen === s.key ? 'bg-amber-500/15 text-amber-300' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60')}
              >{s.icon}{s.label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setTouring(true)} className={cn(btn.base, btn.secondary)} title="Take the tour">
              <HelpCircle className="w-4 h-4" /> <span className="hidden sm:inline">How it works</span>
            </button>
            <button type="button" onClick={() => setShowPdfPreview(true)} className={cn(btn.base, btn.secondary)}>
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">PDF report</span>
            </button>
            {user ? (
              <button type="button" onClick={logout} className={cn(btn.base, btn.secondary)} title={user.email || 'Sign out'}>
                {user.photoURL ? <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" /> : <UserIcon className="w-4 h-4" />}
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <button type="button" onClick={signInWithGoogle} className={cn(btn.base, btn.secondary, 'text-sky-300')}>
                <UserIcon className="w-4 h-4" /> Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
        {appScreen === 'solar' && (
          <>
            <p className="text-sm text-slate-400 mb-5 max-w-3xl">
              Work through the steps and the results update as you go. Click any result to see exactly how it’s calculated.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                <GoalPicker goal={goal} onChange={chooseGoal} />
                <TrackContext.Provider value={goalTracks}>
                <InputsPanel
                  params={params}
                  results={results}
                  quotes={DEFAULT_QUOTES}
                  updateParam={updateParam}
                  applyQuote={applyQuote}
                  sectionsOpen={sectionsOpen}
                  toggleSection={toggleSection}
                  onOpenBills={() => setAppScreen('progress')}
                />
                </TrackContext.Provider>

                <section id="saved-setups" className="border border-slate-800 rounded-xl bg-slate-900/40 p-4 space-y-3 scroll-mt-24">
                  <h2 className="text-sm font-semibold text-slate-100">Saved setups</h2>
                  {publicConfigs.length > 0 && (
                    <label className="block space-y-1">
                      <span className="text-xs text-slate-400">Open a shared setup</span>
                      <select
                        onChange={(e) => loadConfig(e.target.value)}
                        value={currentConfigId && publicConfigs.some(c => c.id === currentConfigId) ? currentConfigId : ""}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="" disabled>Choose…</option>
                        {publicConfigs.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </label>
                  )}
                  {!user ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-400">Sign in with Google to save this setup and get a link to share it.</p>
                      <button type="button" onClick={signInWithGoogle} className={cn(btn.base, btn.secondary, 'text-sky-300')}>
                        <UserIcon className="w-4 h-4" /> Sign in
                      </button>
                    </div>
                  ) : (
                    <>
                      {savedConfigs.length > 0 && (
                        <label className="block space-y-1">
                          <span className="text-xs text-slate-400">Your setups</span>
                          <div className="flex gap-2">
                            <select
                              onChange={(e) => loadConfig(e.target.value)}
                              value={ownsCurrent ? currentConfigId! : ""}
                              className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="" disabled>Choose…</option>
                              {savedConfigs.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                            {ownsCurrent && (
                              <button type="button" onClick={() => setConfigToDelete(currentConfigId)} className={cn(btn.base, btn.secondary, 'text-red-300')} title="Delete this setup">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </label>
                      )}
                      <input
                        type="text"
                        placeholder="Name this setup"
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={configDescription}
                        onChange={(e) => setConfigDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={configIsPublic} onChange={(e) => setConfigIsPublic(e.target.checked)} className="accent-amber-500" />
                        List it under shared setups for everyone
                      </label>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleSaveConfig} disabled={!configName.trim() || isSaving} className={cn(btn.base, btn.primary, 'flex-1')}>
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {ownsCurrent ? 'Save changes' : 'Save'}
                        </button>
                        {currentConfigId && (
                          <button type="button" onClick={copyShareLink} className={cn(btn.base, btn.secondary)}>
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                      <span className="text-xs text-slate-500 w-full">Admin</span>
                      <button type="button" onClick={() => setShowAdminDashboard(true)} className={cn(btn.base, btn.secondary, 'text-xs py-1.5')}><LayoutDashboard className="w-4 h-4" /> All setups</button>
                      <button type="button" onClick={() => setConfirmSave(true)} className={cn(btn.base, btn.secondary, 'text-xs py-1.5')}><Save className="w-4 h-4" /> Make these my defaults</button>
                      <button type="button" onClick={() => setConfirmReset(true)} className={cn(btn.base, btn.secondary, 'text-xs py-1.5')}><RotateCcw className="w-4 h-4" /> Reset defaults</button>
                    </div>
                  )}
                </section>
              </div>

              <div id="results-panel" className="lg:col-span-7 space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm uppercase tracking-wider text-slate-400">Results</h2>
                  <Segmented
                    value={summaryTab}
                    onChange={(v) => setSummaryTab(v as typeof summaryTab)}
                    options={[{ value: 'metrics', label: 'Numbers' }, { value: 'narrative', label: 'In words' }]}
                  />
                </div>
                <div id="results-summary" className="scroll-mt-24">
                {summaryTab === 'narrative' ? (
                  <ExecutiveSummary params={params} results={results} vendorName={vendorName} onNavigateToEquation={(k) => navigateToEquation(k)} />
                ) : (
                  <ResultsSummary
                    results={results}
                    onExplain={(k) => navigateToEquation(k)}
                    sellBackRate={params.sellBackRate}
                    financed={params.isFinanced}
                  />
                )}
                </div>

                <GoalSuggestions
                  goal={goal}
                  current={goalNow}
                  suggestions={suggestions}
                  pending={deferredParams !== effectiveParams}
                  onApply={applySuggestion}
                  lastApplied={undo?.title}
                  onUndo={undo ? () => { setParams(undo.params); setUndo(null); } : undefined}
                />

                <ScenarioManager
                  scenarios={scenarios}
                  colors={scenarioColors}
                  onSave={saveScenario}
                  onToggle={toggleScenario}
                  onRename={(id, name) => setScenarios(prev => prev.map(sc => sc.id === id ? { ...sc, name } : sc))}
                  onLoad={(id) => { const sc = scenarios.find(x => x.id === id); if (sc) setParams({ ...DEFAULT_PARAMS, ...sc.params }); }}
                  onDelete={(id) => setScenarios(prev => prev.filter(sc => sc.id !== id))}
                />

                <div ref={chartRef} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 sm:p-5 scroll-mt-24">
                  <div id="chart-tabs" className="flex flex-wrap gap-1 mb-3 scroll-mt-24" role="tablist">
                    {CHART_TABS.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors',
                          activeTab === t.key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')}
                      >{t.icon}{t.label}</button>
                    ))}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-4">{tab.blurb}</h3>

                  {activeTab === 'sensitivity' && (
                    <div className="flex flex-wrap gap-3 mb-2">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        Vary
                        <select
                          value={activeSensitivityVar}
                          onChange={(e) => setSensitivityVar(e.target.value as SensitivityVariable)}
                          className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        >
                          {sensitivityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        Show
                        <select
                          value={sensitivityMetric}
                          onChange={(e) => setSensitivityMetric(e.target.value as typeof sensitivityMetric)}
                          className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="both">Savings and payback</option>
                          <option value="profit">25-year savings</option>
                          <option value="breakeven">Payback time</option>
                          <option value="slope">Value of going bigger</option>
                        </select>
                      </label>
                      {sensitivityOptions.length === 1 && (
                        <p className="text-xs text-slate-500 self-center">Turn on a battery or a loan to vary those too.</p>
                      )}
                    </div>
                  )}

                  <div className="min-h-[300px]">
                    {activeTab === 'timeline' ? (
                      <RoiChart data={results.chartData} paybackPeriod={results.paybackPeriod} />
                    ) : activeTab === 'sensitivity' ? (
                      <SensitivityChart
                        data={sensitivityData}
                        variable={activeSensitivityVar}
                        metric={sensitivityMetric}
                        currentValue={
                          activeSensitivityVar === 'systemSize' ? results.systemSizeKW :
                          activeSensitivityVar === 'battery' ? params.batteryCapacityKwh :
                          activeSensitivityVar === 'interestRate' ? params.loanInterestRate :
                          activeSensitivityVar === 'downPayment' ? params.downPayment :
                          params.loanTermYears
                        }
                        onApplyExtrema={applySensitivityValue}
                      />
                    ) : activeTab === 'outage' ? (
                      <OutageChart data={results.outageResilience} onEnableBattery={enableBattery} />
                    ) : activeTab === 'compare' ? (
                      <MonthlyBalanceChart data={results.monthlyEnergyData} results={results} />
                    ) : activeTab === 'scenarios' ? (
                      <ScenarioCompare current={currentCompared} others={comparedScenarios} goal={goal} />
                    ) : activeTab === 'renewability' ? (
                      <RenewabilityChart data={results.monthlyEnergyData} gridRenewablePercent={params.gridRenewablePercentage} />
                    ) : (
                      <Equations
                        params={params}
                        results={results}
                        highlightedSection={highlightedEquationSection}
                        onClearHighlight={() => setHighlightedEquationSection(null)}
                        onNavigateToEquation={navigateToEquation}
                        onNavigateToSlider={navigateToSlider}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Phones: keep the headline number in view while editing inputs. */}
            <button
              type="button"
              onClick={() => document.getElementById('results-panel')?.scrollIntoView({ behavior: 'smooth' })}
              className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-sm"
            >
              <span className="text-slate-300 text-left">
                {results.paybackPeriod > 0 && results.paybackPeriod <= 25
                  ? <>Payback <span className="text-white font-semibold">{results.paybackPeriod.toFixed(1)} yrs</span></>
                  : <span className="text-rose-300">No payback in 25 years</span>}
                <span className="text-slate-500"> · </span>
                <span className={results.total25YearSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(results.total25YearSavings)}</span> in 25 yrs
              </span>
              <span className="text-amber-400 shrink-0 ml-3">Results ↓</span>
            </button>
          </>
        )}

        {appScreen === 'reduction' && (
          <EnergyReduction params={params} projects={reductionProjects} setProjects={setReductionProjects} updateParam={updateParam} />
        )}

        {appScreen === 'progress' && (
          <ProgressTracker params={effectiveParams} updateParam={updateParam} savedConfigs={savedConfigs} />
        )}

        <footer className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500">
          Built by Ben Czech for UUC. Estimates only: confirm figures with installers and a tax advisor.
        </footer>
      </main>

      {showPdfPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
          <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-slate-800 bg-slate-900 shrink-0">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" /> PDF report preview
            </h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowPdfPreview(false)} className={cn(btn.base, btn.secondary)}>Close</button>
              <button type="button" onClick={handleExport} disabled={isExporting} className={cn(btn.base, btn.primary)}>
                <Download className="w-4 h-4" /> {isExporting ? 'Creating PDF…' : 'Download PDF'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex justify-center preview-container">
            <PdfReport params={effectiveParams} results={results} vendorName={vendorName} goal={goal} suggestions={suggestions} current={currentCompared} scenarios={comparedScenarios} />
          </div>
        </div>
      )}

      {configToDelete && (
        <Modal
          title="Delete this setup?"
          onClose={() => setConfigToDelete(null)}
          actions={<>
            <button type="button" onClick={() => setConfigToDelete(null)} className={cn(btn.base, btn.ghost)}>Cancel</button>
            <button
              type="button"
              className={cn(btn.base, btn.danger)}
              onClick={async () => {
                try {
                  const { deleteConfiguration } = await import('./lib/firebase');
                  await deleteConfiguration(configToDelete);
                  if (currentConfigId === configToDelete) {
                    setCurrentConfigId(null);
                    setConfigName('');
                    setConfigDescription('');
                    setConfigIsPublic(false);
                  }
                  await fetchConfigs();
                  refreshPublic();
                } catch (e) {
                  console.error("Failed to delete", e);
                }
                setConfigToDelete(null);
              }}
            >Delete</button>
          </>}
        >It will be removed for good, and any shared links to it will stop working.</Modal>
      )}

      {confirmSave && (
        <Modal
          title="Make these your defaults?"
          onClose={() => setConfirmSave(false)}
          actions={<>
            <button type="button" onClick={() => setConfirmSave(false)} className={cn(btn.base, btn.ghost)}>Cancel</button>
            <button type="button" onClick={() => { localStorage.setItem('UUC_SOLAR_DEFAULTS', JSON.stringify(params)); setConfirmSave(false); }} className={cn(btn.base, btn.primary)}>Save</button>
          </>}
        >The calculator will start from these settings in this browser. Other visitors aren’t affected.</Modal>
      )}

      {confirmReset && (
        <Modal
          title="Reset to the built-in defaults?"
          onClose={() => setConfirmReset(false)}
          actions={<>
            <button type="button" onClick={() => setConfirmReset(false)} className={cn(btn.base, btn.ghost)}>Cancel</button>
            <button type="button" onClick={() => { localStorage.removeItem('UUC_SOLAR_DEFAULTS'); setParams(DEFAULT_PARAMS); setConfirmReset(false); }} className={cn(btn.base, btn.danger)}>Reset</button>
          </>}
        >This clears the defaults saved in this browser and reloads the original settings.</Modal>
      )}

      {touring && <Tour steps={tourSteps} onClose={() => setTouring(false)} />}

      {showAdminDashboard && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdminDashboard(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full h-[80vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-indigo-400" /> All saved setups
              </h3>
              <button type="button" onClick={() => setShowAdminDashboard(false)} className={cn(btn.base, btn.secondary)}>Close</button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl border border-slate-800 p-4">
              <AdminConfigsManager />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminConfigsManager() {
  const [allConfigs, setAllConfigs] = useState<SavedConfig[] | null>(null);

  React.useEffect(() => {
    import('./lib/firebase')
      .then(fb => fb.getAllConfigurationsAdmin())
      .then(setAllConfigs)
      .catch((e) => { console.error(e); setAllConfigs([]); });
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this setup from the database? This cannot be undone.')) {
      try {
        const { deleteConfiguration } = await import('./lib/firebase');
        await deleteConfiguration(id);
        setAllConfigs(prev => (prev ?? []).filter(c => c.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (allConfigs === null) return <p className="text-sm text-slate-500">Loading…</p>;
  if (allConfigs.length === 0) return <p className="text-sm text-slate-500">No saved setups yet.</p>;

  return (
    <div className="space-y-3">
      {allConfigs.map(c => (
        <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h5 className="text-white font-medium">{c.title}</h5>
            <p className="text-xs text-slate-500 truncate">{c.description || 'No notes'}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">ID {c.id}</span>
              <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded">User {c.userId}</span>
              {c.isPublic && <span className="text-xs bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded">Shared</span>}
            </div>
          </div>
          <button type="button" onClick={() => handleDelete(c.id)} className={cn(btn.base, btn.secondary, 'text-red-300 text-xs')}>Delete</button>
        </div>
      ))}
    </div>
  );
}
