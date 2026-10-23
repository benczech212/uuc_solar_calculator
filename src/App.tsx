import React, { useState, useMemo } from 'react';
import { Sun, Download, TrendingUp, Zap, PiggyBank, Receipt, Leaf, Battery, Wrench, BarChart2, Activity, Calculator, ShieldAlert, ChevronDown, ChevronUp, Save, GitCompare, RotateCcw, LayoutDashboard, LineChart, Home, FileText, User as UserIcon, LogOut, Loader2, Copy, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { Slider } from './components/Slider';
import { RoiChart } from './components/Chart';
import { SensitivityChart } from './components/SensitivityChart';
import { Equations } from './components/Equations';
import { OutageChart } from './components/OutageChart';
import { MonthlyBalanceChart } from './components/MonthlyBalanceChart';
import { ChaliceIcon } from './components/ChaliceIcon';
import { ComposedChart, BarChart, AreaChart } from 'recharts';
import { RenewabilityChart } from './components/RenewabilityChart';
import { calculateRoi, formatCurrency, generateSensitivityData, calculateReductionKwh, getActiveEnergyParams } from './utils';
import { SolarParams, SensitivityVariable, EnergyReductionProject, ProgressEntry } from './types';
import { EnergyReduction } from './components/EnergyReduction';
import { ProgressTracker } from './components/ProgressTracker';
import { PdfReport } from './components/PdfReport';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { exportToPDF } from './pdfExport';
import { auth, signInWithGoogle, logout, saveConfiguration, updateConfiguration, getConfiguration, getUserConfigurations, SavedConfig } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';


interface VendorQuote {
  id: string;
  companyName: string;
  systemSizeKw: number;
  totalCost: number;
}

const DEFAULT_QUOTES: VendorQuote[] = [
  { id: '1', companyName: 'EPC', systemSizeKw: 76.7, totalCost: 183693 },
  { id: '2', companyName: 'New Era', systemSizeKw: 75.9, totalCost: 193232 },
  { id: '3', companyName: 'Bay Area', systemSizeKw: 75.5, totalCost: 218976 },
];

const DEFAULT_PARAMS: SolarParams = {
  inputMode: 'detailed',
  panelWattage: 400,
  numberOfPanels: 110,
  costPerWatt: 2.27,
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
  
  utilityRate: 0.16,
  annualBillIncrease: 3,
  
  hasBattery: false,
  batteryCapacityKwh: 0,
  batteryCostPerKwh: 400,
  sellBackRate: 0.16,
  hasLinkedSellBackRate: true,

  hasMaintenance: false,
  annualMaintenanceCost: 150,
  
  isFinanced: false,
  loanTermYears: 10,
  loanInterestRate: 7,
  downPayment: 0,
  lumpSumPayments: [],

  gridRenewablePercentage: 80,
};

const getInitialDefaults = (): SolarParams => {
  try {
    const saved = localStorage.getItem('UUC_SOLAR_DEFAULTS');
    if (saved) return { ...DEFAULT_PARAMS, ...JSON.parse(saved) };
  } catch (e) {}
  return DEFAULT_PARAMS;
};

const EQUATION_LABELS: Record<string, string> = {
  cost: "Gross System Cost",
  net: "Net Investment",
  yr1without: "Year 1 Bill Without Solar",
  yr1with: "Year 1 Bill With Solar",
  yr1savings: "Year 1 Savings",
  projection: "25-Year Projection Loop",
  payback: "Break-even / Payback Period",
  co2: "CO2 Impact",
  co2homes: "Equivalent Homes Offset",
  yearlygen: "Yearly Generation",
  exported_sold: "Exported & Sold",
  battery_utilization: "Battery Utilization",
  grid_purchase: "Grid Purchase Needed",
  gridsales: "Grid Sales (Surplus Export)",
  "25yr_roi": "25-Year ROI",
  cum_savings: "Cumulative Savings"
};

export default function App() {
  const [params, setParams] = useState<SolarParams>(getInitialDefaults());
  const [appScreen, setAppScreen] = useState<'solar' | 'reduction' | 'progress'>('solar');
  const [reductionProjects, setReductionProjects] = useState<EnergyReductionProject[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [activeTab, setActiveTab] = useState<'timeline' | 'sensitivity' | 'equations' | 'outage' | 'compare' | 'renewability'>('timeline');
  const [summaryTab, setSummaryTab] = useState<'metrics' | 'narrative'>('metrics');
  const [highlightedEquationSection, setHighlightedEquationSection] = useState<string | null>(null);

  const [pendingEquationPopup, setPendingEquationPopup] = useState<string | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null);

  const navigateToEquation = (sectionKey: string, e?: React.MouseEvent) => {
    setPendingEquationPopup(sectionKey);
    if (e) {
      setPopupCoords({ x: e.clientX, y: e.clientY });
    } else {
      setPopupCoords(null);
    }
  };

  const navigateToSlider = (sliderId: string, sectionKey: string) => {
    // 1. Ensure we are on the solar screen
    setAppScreen('solar');
    
    // 2. Dynamically enable conditional parameters if needed
    setParams(prev => {
      const next = { ...prev };
      
      if (sliderId === 'slider-batteryCapacityKwh' || sliderId === 'slider-batteryCostPerKwh') {
        next.hasBattery = true;
      }
      else if (sliderId === 'slider-annualMaintenanceCost') {
        next.hasMaintenance = true;
      }
      else if (sliderId === 'slider-solarEfficiency') {
        next.hasSolarEfficiency = true;
        next.efficiencyMode = 'flat';
      }
      else if (sliderId === 'slider-federalTaxCreditPercent' || sliderId === 'slider-stateRebateAmount') {
        next.hasIncentives = true;
      }
      else if (sliderId === 'slider-downPayment' || sliderId === 'slider-loanTermYears' || sliderId === 'slider-loanInterestRate') {
        next.isFinanced = true;
      }
      else if (sliderId === 'slider-panelWattage' || sliderId === 'slider-numberOfPanels' || sliderId === 'slider-costPerWatt') {
        next.inputMode = 'detailed';
      }
      else if (sliderId === 'slider-totalSystemSizeKw' || sliderId === 'slider-totalGrossCost') {
        next.inputMode = 'total';
      }
      else if (sliderId === 'slider-monthlyUsageKwh') {
        next.usageMode = 'flat';
      }
      
      return next;
    });

    // 3. Open the accordion section where the slider is located
    setSectionsActive(prev => ({
      ...prev,
      [sectionKey]: true
    }));

    // 4. Wait a little bit for the DOM to render/expand, then scroll to it and flash it
    setTimeout(() => {
      const element = document.getElementById(sliderId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash animation by adding standard ring/background highlight styles temporarily
        element.classList.add('ring-4', 'ring-amber-500/80', 'bg-amber-950/20', 'p-3', 'rounded-2xl', 'shadow-lg', 'shadow-amber-500/20');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-amber-500/80', 'bg-amber-950/20', 'p-3', 'rounded-2xl', 'shadow-lg', 'shadow-amber-500/20');
        }, 2500);
      }
    }, 250);
  };

  const handleProceedToEquations = (sectionKey: string) => {
    setAppScreen('solar');
    setActiveTab('equations');
    setHighlightedEquationSection(sectionKey);
    setPendingEquationPopup(null);
  };

  const [sensitivityVar, setSensitivityVar] = useState<SensitivityVariable>('systemSize');
  const [sensitivityMetric, setSensitivityMetric] = useState<'profit' | 'breakeven' | 'both' | 'slope'>('both');
  
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [configIsPublic, setConfigIsPublic] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [publicConfigs, setPublicConfigs] = useState<SavedConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

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
          setParams(cfg.params);
          setCurrentConfigId(cfg.id);
        }
      }).catch(err => console.error("Could not load shared config", err));
    }

    // load public configs
    import('./lib/firebase').then(fb => fb.getPublicConfigurations()).then(setPublicConfigs).catch(console.error);

    return unsub;
  }, []);

  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const configs = await getUserConfigurations();
      setSavedConfigs(configs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (e) {
      console.error(e);
    }
    setLoadingConfigs(false);
  };

  const [lockedParams, setLockedParams] = useState<string[]>([]);
  
  const [sectionsActive, setSectionsActive] = useState({
    quotes: true,
    system: true,
    efficiency: false,
    energy: true,
    maintenance: false,
    storage: false,
    incentives: false,
    financing: false,
  });

  const toggleSection = (section: keyof typeof sectionsActive) => {
    setSectionsActive(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleLock = (key: string) => {
    setLockedParams(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSaveConfig = async () => {
    if (!configName.trim() || !user) return;
    setIsSaving(true);
    try {
      if (currentConfigId && savedConfigs.find(c => c.id === currentConfigId)) {
        await updateConfiguration(currentConfigId, params, configName, configDescription, configIsPublic);
      } else {
        const id = await saveConfiguration(params, configName, configDescription, configIsPublic);
        setCurrentConfigId(id);
      }
      await fetchConfigs();
      import('./lib/firebase').then(fb => fb.getPublicConfigurations()).then(setPublicConfigs).catch(console.error);
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
    setConfigName("");
    setConfigDescription("");
    setConfigIsPublic(false);
  };

  const loadConfig = (id: string) => {
    let cfg = savedConfigs.find(c => c.id === id);
    if (!cfg) cfg = publicConfigs.find(c => c.id === id);
    if (cfg) {
      setParams(cfg.params);
      setCurrentConfigId(cfg.id);
      setConfigName(cfg.title || "");
      setConfigDescription(cfg.description || "");
      setConfigIsPublic(cfg.isPublic || false);
    }
  };

  const saveDefaultParam = (key: keyof SolarParams) => {
    const currentDefaults = getInitialDefaults();
    const newDefaults = { ...currentDefaults, [key]: params[key] };
    localStorage.setItem('UUC_SOLAR_DEFAULTS', JSON.stringify(newDefaults));
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

  const compareResults = useMemo(() => {
    if (!comparisonMode) return null;
    const compParams = { ...effectiveParams };
    if (comparisonMode === 'efficiency') compParams.hasSolarEfficiency = !compParams.hasSolarEfficiency;
    if (comparisonMode === 'maintenance') compParams.hasMaintenance = !compParams.hasMaintenance;
    if (comparisonMode === 'storage') compParams.hasBattery = !compParams.hasBattery;
    if (comparisonMode === 'incentives') compParams.hasIncentives = !compParams.hasIncentives;
    if (comparisonMode === 'financing') compParams.isFinanced = !compParams.isFinanced;
    return calculateRoi(compParams);
  }, [effectiveParams, comparisonMode]);
  const sensitivityData = useMemo(() => generateSensitivityData(effectiveParams, sensitivityVar), [effectiveParams, sensitivityVar]);

  const vendorName = useMemo(() => {
    if (params.inputMode === 'total') {
      const match = DEFAULT_QUOTES.find(q => q.systemSizeKw === params.totalSystemSizeKw && q.totalCost === params.totalGrossCost);
      return match?.companyName;
    }
    return undefined;
  }, [params.inputMode, params.totalSystemSizeKw, params.totalGrossCost]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 sm:p-6 lg:p-8 relative overflow-hidden flex flex-col">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 flex-1 relative z-10 w-full flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800 pb-6 mb-4 relative z-10 flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl shadow-sm">
              <ChaliceIcon className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400">By Ben Czech</span>
              </div>
              <h1 className="text-4xl font-light tracking-tight text-white">UUC Solar ROI <span className="text-slate-500 italic font-serif">Calculator</span></h1>
            </div>
          </div>
            <div className="flex items-center gap-2">
              {!user ? (
                <button 
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700 hover:border-slate-600"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In to Save</span>
                </button>
              ) : (
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600 mr-2"
                  title={user.email || 'Sign Out'}
                >
                  <img src={user.photoURL || ''} alt="User" className="w-4 h-4 rounded-full" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
              {user?.email === 'benczech212@gmail.com' && (
                <>
                  <button 
                    onClick={() => setShowAdminDashboard(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-indigo-900 border-indigo-700 hover:bg-indigo-800 text-indigo-300"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                  <button 
                    onClick={() => setConfirmSave(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-900/30 hover:border-amber-700/50"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save as Defaults</span>
                  </button>
                  <button 
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Factory Reset</span>
                  </button>
                </>
              )}
            <button 
                onClick={() => setShowPdfPreview(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </div>
        </header>

        <div className="flex gap-2 mb-4 border-b border-slate-800 pb-4 overflow-x-auto">
          <button 
            onClick={() => setAppScreen('solar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${appScreen === 'solar' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            <Sun className="w-4 h-4" /> Solar Projection
          </button>
          <button 
            onClick={() => setAppScreen('reduction')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${appScreen === 'reduction' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            <Zap className="w-4 h-4" /> Energy Reduction
          </button>
          <button 
            onClick={() => setAppScreen('progress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${appScreen === 'progress' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            <LineChart className="w-4 h-4" /> Manage Bills
          </button>
        </div>

        {appScreen === 'solar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 lg:self-start space-y-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col justify-between lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            
            <div className="space-y-6 flex-1">
              {/* Config Manager */}
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3 relative">
                {!user ? (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl border border-slate-800">
                    <p className="text-sm text-slate-400 mb-3 text-center px-4">Sign in to save configurations to the cloud and get shareable links.</p>
                    <button 
                      onClick={signInWithGoogle}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700 hover:border-slate-600"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In to Save</span>
                    </button>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    placeholder="Configuration title..." 
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Description (optional)..." 
                    value={configDescription}
                    onChange={(e) => setConfigDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="checkbox" 
                      id="configIsPublic"
                      checked={configIsPublic}
                      onChange={(e) => setConfigIsPublic(e.target.checked)}
                      className="w-3 h-3 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900" 
                    />
                    <label htmlFor="configIsPublic" className="text-xs text-slate-400">Make Public</label>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={handleSaveConfig}
                      disabled={!configName.trim() || isSaving}
                      className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1 hover:bg-amber-400 transition-colors flex-1 justify-center"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />} 
                      {currentConfigId && savedConfigs.find(c => c.id === currentConfigId) ? 'Update config' : 'Save as new'}
                    </button>
                    {currentConfigId && (
                      <button 
                        onClick={() => {
                          const url = new URL(window.location.href);
                          url.searchParams.set('configId', currentConfigId);
                          navigator.clipboard.writeText(url.toString());
                          alert("Shareable link copied to clipboard!");
                        }}
                        className="bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-sky-500/30 hover:bg-sky-500/30 transition-colors flex items-center gap-1"
                        title="Copy Shareable Link"
                      >
                        <Copy className="w-3 h-3" /> Share
                      </button>
                    )}
                  </div>
                </div>
                
                {(savedConfigs.length > 0 || currentConfigId) && (
                  <div className="flex items-center gap-2 border-t border-slate-800 pt-3 mt-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest border-slate-800 whitespace-nowrap">Your Cloud</span>
                    <select 
                      onChange={(e) => loadConfig(e.target.value)}
                      value={currentConfigId && savedConfigs.find(c => c.id === currentConfigId) ? currentConfigId : ""}
                      className="flex-1 w-full truncate bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="" disabled>Select configuration...</option>
                      {savedConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    {currentConfigId && savedConfigs.find(c => c.id === currentConfigId) && (
                      <button 
                        onClick={() => setConfigToDelete(currentConfigId)}
                        className="bg-red-500/20 text-red-400 px-2 py-1.5 rounded-lg text-xs border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        title="Delete Config"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}

                {publicConfigs.length > 0 && (
                  <div className="flex items-center gap-2 border-t border-slate-800 pt-3 mt-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest border-slate-800 whitespace-nowrap">Public</span>
                    <select 
                      onChange={(e) => loadConfig(e.target.value)}
                      value={currentConfigId && publicConfigs.find(c => c.id === currentConfigId) ? currentConfigId : ""}
                      className="flex-1 w-full truncate bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="" disabled>Select public configuration...</option>
                      {publicConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              
              <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('quotes')}>
                  <div className="flex items-center">
                    <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                      {sectionsActive.quotes ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Vendor Quotes</span>
                    </h2>
                  </div>
                </div>

                <div className={`space-y-4 transition-all duration-300 ` + (sectionsActive.quotes ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden')}>
                  <div className="grid grid-cols-1 gap-2">
                    {DEFAULT_QUOTES.map(q => (
                      <button 
                        key={q.id}
                        onClick={() => {
                          updateParam('inputMode', 'total');
                          updateParam('totalSystemSizeKw', q.systemSizeKw);
                          updateParam('totalGrossCost', q.totalCost);
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${params.inputMode === 'total' && params.totalSystemSizeKw === q.systemSizeKw && params.totalGrossCost === q.totalCost ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                      >
                        <div>
                          <div className="font-bold">{q.companyName}</div>
                          <div className="text-xs text-slate-500 mt-1">{q.systemSizeKw.toFixed(1)} kW • {formatCurrency(q.totalCost)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">{(q.totalCost / (q.systemSizeKw * 1000)).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}/W</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('system')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.system ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>System Specs</span>
                  </h2>
                </div>
                <div className="flex bg-slate-800/80 p-1 rounded-lg" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => updateParam('inputMode', 'detailed')}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${params.inputMode === 'detailed' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >Detailed</button>
                  <button 
                    onClick={() => updateParam('inputMode', 'total')}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${params.inputMode === 'total' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >Total</button>
                </div>
              </div>

              <div className={`space-y-6 transition-all duration-300 ${sectionsActive.system ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden'}`}>
                {params.inputMode === 'detailed' ? (
                <>
                  <Slider 
                    id="slider-panelWattage"
                    label="Panel Wattage"
                    valueDisplay={`${params.panelWattage} W`}
                    min={100}
                    max={1000}
                    step={5}
                    value={params.panelWattage}
                    onSetDefault={() => saveDefaultParam('panelWattage')}
                    onChange={(e) => updateParam('panelWattage', Number(e.target.value))}
                    isLocked={lockedParams.includes('panelWattage')}
                    onToggleLock={() => toggleLock('panelWattage')}
                  />

                  <Slider 
                    id="slider-numberOfPanels"
                    label="Number of Panels"
                    valueDisplay={`${params.numberOfPanels} Panels`}
                    min={1}
                    max={500}
                    step={1}
                    value={params.numberOfPanels}
                    onSetDefault={() => saveDefaultParam('numberOfPanels')}
                    onChange={(e) => updateParam('numberOfPanels', Number(e.target.value))}
                    isLocked={lockedParams.includes('numberOfPanels')}
                    onToggleLock={() => toggleLock('numberOfPanels')}
                  />

                  <Slider 
                    id="slider-costPerWatt"
                    label="Cost Per Watt (Gross)"
                    valueDisplay={`$${params.costPerWatt.toFixed(2)}/W`}
                    min={0.50}
                    max={15.00}
                    step={0.10}
                    value={params.costPerWatt}
                    onSetDefault={() => saveDefaultParam('costPerWatt')}
                    onChange={(e) => updateParam('costPerWatt', Number(e.target.value))}
                    isLocked={lockedParams.includes('costPerWatt')}
                    onToggleLock={() => toggleLock('costPerWatt')}
                  />
                </>
              ) : (
                <>
                  <Slider 
                    id="slider-totalSystemSizeKw"
                    label="System Size (kW)"
                    valueDisplay={`${params.totalSystemSizeKw.toFixed(1)} kW`}
                    min={1.0}
                    max={100.0}
                    step={0.5}
                    value={params.totalSystemSizeKw}
                    onSetDefault={() => saveDefaultParam('totalSystemSizeKw')}
                    onChange={(e) => updateParam('totalSystemSizeKw', Number(e.target.value))}
                    isLocked={lockedParams.includes('totalSystemSizeKw')}
                    onToggleLock={() => toggleLock('totalSystemSizeKw')}
                  />

                  <Slider 
                    id="slider-totalGrossCost"
                    label="Total Gross Cost"
                    valueDisplay={formatCurrency(params.totalGrossCost)}
                    min={1000}
                    max={300000}
                    step={1000}
                    value={params.totalGrossCost}
                    onSetDefault={() => saveDefaultParam('totalGrossCost')}
                    onChange={(e) => updateParam('totalGrossCost', Number(e.target.value))}
                    isLocked={lockedParams.includes('totalGrossCost')}
                    onToggleLock={() => toggleLock('totalGrossCost')}
                  />
                </>
              )}
            </div>

                        <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('energy')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.energy ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <span>Energy Profile</span>
                  </h2>
                </div>
                <div className="flex bg-slate-800/80 p-1 rounded-lg" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => updateParam('usageMode', 'flat')}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${params.usageMode === 'flat' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
                  >Flat</button>
                  <button 
                    onClick={() => updateParam('usageMode', 'monthly')}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${params.usageMode === 'monthly' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
                  >Monthly</button>
                  <button 
                    onClick={() => updateParam('usageMode', 'historical')}
                    className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${params.usageMode === 'historical' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
                  >Historical</button>
                </div>
              </div>

              <div className={`space-y-6 transition-all duration-300 ${sectionsActive.energy ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden'}`}>
                {params.usageMode === 'historical' ? (
                  <div className="space-y-4 pt-1" onClick={e => e.stopPropagation()}>
                    {/* Computed Stats Card */}
                    <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">Historical Computed Baseline</span>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex bg-slate-900 p-0.5 rounded border border-slate-850">
                            <button
                              type="button"
                              onClick={() => updateParam('historicalCompMode', 'average')}
                              className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${params.historicalCompMode === 'average' || !params.historicalCompMode ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-450'}`}
                            >Average</button>
                            <button
                              type="button"
                              onClick={() => updateParam('historicalCompMode', 'recent')}
                              className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${params.historicalCompMode === 'recent' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-450'}`}
                            >Most Recent</button>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[9px] uppercase tracking-wider text-slate-400">
                            <input 
                              type="checkbox" 
                              checked={!!params.historicalByMonth}
                              onChange={(e) => updateParam('historicalByMonth', e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 w-3 h-3"
                            />
                            By Month
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Effective Utility Rate</p>
                          <p className="text-base font-mono text-amber-400 font-semibold">${results.effectiveUtilityRate.toFixed(4)} <span className="text-[10px] text-slate-500 font-sans">/kWh</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Computed Monthly Usage</p>
                          <p className="text-base font-mono text-white font-semibold">{Math.round(results.effectiveMonthlyUsageKwh).toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">kWh</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Bill Manager Section is now in Manage Bills */}
                    <div className="pt-2">
                       <button
                          type="button"
                          onClick={() => setAppScreen('progress')}
                          className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-lg text-sm text-slate-300 transition-colors flex items-center justify-center gap-2"
                       >
                         Manage Historical Bills
                       </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {params.usageMode === 'flat' ? (
                      <Slider 
                        id="slider-monthlyUsageKwh"
                        label="Monthly Power Usage"
                        valueDisplay={`${params.monthlyUsageKwh} kWh`}
                        min={50}
                        max={10000}
                        step={50}
                        value={params.monthlyUsageKwh}
                        onSetDefault={() => saveDefaultParam('monthlyUsageKwh')}
                        onChange={(e) => updateParam('monthlyUsageKwh', Number(e.target.value))}
                        isLocked={lockedParams.includes('monthlyUsageKwh')}
                        onToggleLock={() => toggleLock('monthlyUsageKwh')}
                      />
                    ) : (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-400">Monthly Usage (kWh)</label>
                          <button
                            onClick={() => saveDefaultParam('monthlyUsageProfile')}
                            className="p-1 rounded bg-slate-800/50 text-slate-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
                            title="Set as default"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((mo, i) => (
                          <div key={mo} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 flex flex-col items-center">
                            <label className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{mo}</label>
                            <input 
                              type="number"
                              className="w-full bg-slate-950 border border-slate-700 rounded text-xs text-white text-center font-mono py-1 focus:outline-none focus:border-amber-500"
                              value={params.monthlyUsageProfile[i]}
                              onChange={(e) => {
                                const newProfile = [...params.monthlyUsageProfile];
                                newProfile[i] = Number(e.target.value);
                                updateParam('monthlyUsageProfile', newProfile);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      </div>
                    )}

                    <Slider 
                      id="slider-utilityRate"
                      label="Utility Rate ($/kWh)"
                      valueDisplay={`$${params.utilityRate.toFixed(2)}`}
                      min={0.01}
                      max={2.00}
                      step={0.01}
                      value={params.utilityRate}
                      onSetDefault={() => saveDefaultParam('utilityRate')}
                      onChange={(e) => updateParam('utilityRate', Number(e.target.value))}
                      isLocked={lockedParams.includes('utilityRate')}
                      onToggleLock={() => toggleLock('utilityRate')}
                    />
                  </>
                )}
                
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">Sell-back Rate ($/kWh)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="linkSellBack"
                        checked={params.hasLinkedSellBackRate}
                        onChange={(e) => updateParam('hasLinkedSellBackRate', e.target.checked)}
                        className="w-3 h-3 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900" 
                      />
                      <label htmlFor="linkSellBack" className="text-[10px] uppercase tracking-widest text-slate-500 cursor-pointer">Link to Utility Rate</label>
                    </div>
                  </div>
                  
                  <Slider 
                    id="slider-sellBackRate"
                    label="Rate"
                    valueDisplay={`$${params.sellBackRate.toFixed(2)}`}
                    min={0.00}
                    max={2.00}
                    step={0.01}
                    value={params.sellBackRate}
                    onSetDefault={() => saveDefaultParam('sellBackRate')}
                      onChange={(e) => updateParam('sellBackRate', Number(e.target.value))}
                    isLocked={lockedParams.includes('sellBackRate') || params.hasLinkedSellBackRate}
                    onToggleLock={() => toggleLock('sellBackRate')}
                  />
                </div>

                <Slider 
                  id="slider-annualBillIncrease"
                  label="Annual Bill Increase"
                  valueDisplay={`${params.annualBillIncrease}%`}
                  min={0}
                  max={25}
                  step={0.5}
                  value={params.annualBillIncrease}
                  onSetDefault={() => saveDefaultParam('annualBillIncrease')}
                    onChange={(e) => updateParam('annualBillIncrease', Number(e.target.value))}
                  isLocked={lockedParams.includes('annualBillIncrease')}
                  onToggleLock={() => toggleLock('annualBillIncrease')}
                />

                <Slider 
                  id="slider-gridRenewablePercentage"
                  label="Grid Renewable %"
                  valueDisplay={`${params.gridRenewablePercentage}%`}
                  min={0}
                  max={100}
                  step={1}
                  value={params.gridRenewablePercentage}
                  onSetDefault={() => saveDefaultParam('gridRenewablePercentage')}
                    onChange={(e) => updateParam('gridRenewablePercentage', Number(e.target.value))}
                  isLocked={lockedParams.includes('gridRenewablePercentage')}
                  onToggleLock={() => toggleLock('gridRenewablePercentage')}
                />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('efficiency')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.efficiency ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Solar Production Profile</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setComparisonMode(comparisonMode === 'efficiency' ? null : 'efficiency'); setActiveTab('timeline'); }}
                  className={`p-1 rounded transition-colors ${comparisonMode === 'efficiency' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                  title="Compare impact"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
              </div>
              </div>

              <div className={`space-y-6 transition-all duration-300 ${sectionsActive.efficiency ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden'}`}>
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/40">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 font-medium">Seasonal Generation Curve</span>
                    <span className="text-[10px] text-slate-500">Applies a typical mid-latitude seasonal generation curve (summer high, winter low).</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={params.useSeasonalGenerationCurve}
                      onChange={(e) => updateParam('useSeasonalGenerationCurve', e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/40">
                  <span className="text-xs text-slate-300 font-medium">Apply System Degradation / Efficiency Loss</span>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={params.hasSolarEfficiency}
                      onChange={(e) => updateParam('hasSolarEfficiency', e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className={`space-y-6 transition-all duration-300 ${!params.hasSolarEfficiency ? 'opacity-40 pointer-events-none select-none filter grayscale' : ''}`}>
                  <div className="flex bg-slate-800/80 p-1 rounded-lg">
                    <button 
                      onClick={() => updateParam('efficiencyMode', 'flat')}
                      className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${params.efficiencyMode === 'flat' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                      style={{ flex: 1 }}
                    >
                      Flat
                    </button>
                    <button 
                      onClick={() => updateParam('efficiencyMode', 'monthly')}
                      className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${params.efficiencyMode === 'monthly' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                      style={{ flex: 1 }}
                    >
                      Monthly
                    </button>
                  </div>

                  {params.efficiencyMode === 'flat' ? (
                    <Slider 
                      id="slider-solarEfficiency"
                      label="Solar Efficiency (%)"
                      valueDisplay={`${params.solarEfficiency}%`}
                      min={50}
                      max={150}
                      step={1}
                      value={params.solarEfficiency}
                      onSetDefault={() => saveDefaultParam('solarEfficiency')}
                    onChange={(e) => updateParam('solarEfficiency', Number(e.target.value))}
                      isLocked={lockedParams.includes('solarEfficiency')}
                      onToggleLock={() => toggleLock('solarEfficiency')}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400">Monthly Efficiency (%)</label>
                        <button
                          onClick={() => saveDefaultParam('monthlyEfficiencyProfile')}
                          className="p-1 rounded bg-slate-800/50 text-slate-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
                          title="Set as default"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((mo, i) => (
                          <div key={mo} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 flex flex-col items-center">
                            <label className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{mo}</label>
                            <input 
                              type="number"
                              className="w-full bg-slate-950 border border-slate-700 rounded text-xs text-white text-center font-mono py-1 focus:outline-none focus:border-amber-500"
                              value={params.monthlyEfficiencyProfile[i]}
                              onChange={(e) => {
                                const newProfile = [...params.monthlyEfficiencyProfile];
                                newProfile[i] = Number(e.target.value);
                                updateParam('monthlyEfficiencyProfile', newProfile);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {!params.hasSolarEfficiency && (
                  <div className="text-[10px] text-amber-500/70 font-mono italic px-1 pt-1">
                    * Solar efficiency is currently disabled. Toggle the switch above to include this section.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('maintenance')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.maintenance ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    <span>Maint & O&M</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setComparisonMode(comparisonMode === 'maintenance' ? null : 'maintenance'); setActiveTab('timeline'); }}
                  className={`p-1 rounded transition-colors ${comparisonMode === 'maintenance' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                  title="Compare impact"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateParam('hasMaintenance', !params.hasMaintenance); }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${params.hasMaintenance ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${params.hasMaintenance ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              </div>

              <div className={`space-y-6 transition-all duration-300 ${sectionsActive.maintenance ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden'}`}>
                <div className={`space-y-6 transition-all duration-300 ${!params.hasMaintenance ? 'opacity-40 pointer-events-none select-none filter grayscale' : ''}`}>
                  <Slider 
                    id="slider-annualMaintenanceCost"
                    label="Annual Maintenance Cost"
                    valueDisplay={`$${params.annualMaintenanceCost}/yr`}
                    min={0}
                    max={5000}
                    step={25}
                    value={params.annualMaintenanceCost}
                    onSetDefault={() => saveDefaultParam('annualMaintenanceCost')}
                    onChange={(e) => updateParam('annualMaintenanceCost', Number(e.target.value))}
                    isLocked={lockedParams.includes('annualMaintenanceCost')}
                    onToggleLock={() => toggleLock('annualMaintenanceCost')}
                  />
                </div>
                {!params.hasMaintenance && (
                  <div className="text-[10px] text-amber-500/70 font-mono italic px-1 pt-1">
                    * Maintenance costs are currently disabled. Toggle the switch above to include this section.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('storage')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.storage ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <Battery className="w-4 h-4 text-emerald-500" />
                    <span>Storage & Grid Export</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setComparisonMode(comparisonMode === 'storage' ? null : 'storage'); setActiveTab('timeline'); }}
                  className={`p-1 rounded transition-colors ${comparisonMode === 'storage' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                  title="Compare impact"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateParam('hasBattery', !params.hasBattery); }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${params.hasBattery ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${params.hasBattery ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              </div>               <div className={`space-y-6 transition-all duration-300 ${sectionsActive.storage ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden'}`}>
                <div className={`space-y-6 transition-all duration-300 ${!params.hasBattery ? 'opacity-40 pointer-events-none select-none filter grayscale' : ''}`}>
                  <Slider 
                    id="slider-batteryCapacityKwh"
                    label="Battery Capacity"
                    valueDisplay={`${params.batteryCapacityKwh} kWh`}
                    min={0}
                    max={200}
                    step={1}
                    value={params.batteryCapacityKwh}
                    onSetDefault={() => saveDefaultParam('batteryCapacityKwh')}
                    onChange={(e) => updateParam('batteryCapacityKwh', Number(e.target.value))}
                    isLocked={lockedParams.includes('batteryCapacityKwh')}
                    onToggleLock={() => toggleLock('batteryCapacityKwh')}
                  />

                  <Slider 
                    id="slider-batteryCostPerKwh"
                    label="Battery Cost ($/kWh)"
                    valueDisplay={`$${params.batteryCostPerKwh.toFixed(0)}`}
                    min={100}
                    max={3000}
                    step={25}
                    value={params.batteryCostPerKwh}
                    onSetDefault={() => saveDefaultParam('batteryCostPerKwh')}
                    onChange={(e) => updateParam('batteryCostPerKwh', Number(e.target.value))}
                    isLocked={lockedParams.includes('batteryCostPerKwh')}
                    onToggleLock={() => toggleLock('batteryCostPerKwh')}
                  />
                </div>
                {!params.hasBattery && (
                  <div className="text-[10px] text-amber-500/70 font-mono italic px-1 pt-1">
                    * Battery storage is currently disabled. Toggle the switch above to include this section.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('incentives')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.incentives ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-rose-400" />
                    <span>Taxes & Credits</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setComparisonMode(comparisonMode === 'incentives' ? null : 'incentives'); setActiveTab('timeline'); }}
                  className={`p-1 rounded transition-colors ${comparisonMode === 'incentives' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                  title="Compare impact"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateParam('hasIncentives', !params.hasIncentives); }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${params.hasIncentives ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${params.hasIncentives ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              </div>

              <div className={`space-y-6 transition-all duration-300 ${sectionsActive.incentives ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden'}`}>
                <div className={`space-y-6 transition-all duration-300 ${!params.hasIncentives ? 'opacity-40 pointer-events-none select-none filter grayscale' : ''}`}>
                  <Slider 
                    id="slider-federalTaxCreditPercent"
                    label="Federal Tax Credit (%)"
                    valueDisplay={`${params.federalTaxCreditPercent}%`}
                    min={0}
                    max={100}
                    step={1}
                    value={params.federalTaxCreditPercent}
                    onSetDefault={() => saveDefaultParam('federalTaxCreditPercent')}
                    onChange={(e) => updateParam('federalTaxCreditPercent', Number(e.target.value))}
                    isLocked={lockedParams.includes('federalTaxCreditPercent')}
                    onToggleLock={() => toggleLock('federalTaxCreditPercent')}
                  />

                  <Slider 
                    id="slider-stateRebateAmount"
                    label="State Rebate Amount ($)"
                    valueDisplay={`$${params.stateRebateAmount.toLocaleString()}`}
                    min={0}
                    max={10000}
                    step={100}
                    value={params.stateRebateAmount}
                    onSetDefault={() => saveDefaultParam('stateRebateAmount')}
                    onChange={(e) => updateParam('stateRebateAmount', Number(e.target.value))}
                    isLocked={lockedParams.includes('stateRebateAmount')}
                    onToggleLock={() => toggleLock('stateRebateAmount')}
                  />
                </div>
                {!params.hasIncentives && (
                  <div className="text-[10px] text-amber-500/70 font-mono italic px-1 pt-1">
                    * Incentives and tax credits are currently disabled. Toggle the switch above to include this section.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-800/50 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50 cursor-pointer group" onClick={() => toggleSection('financing')}>
                <div className="flex items-center">
                  <button className="mr-2 text-slate-600 group-hover:text-amber-500 transition-colors">
                    {sectionsActive.financing ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <h2 className="text-sm uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                    <PiggyBank className="w-4 h-4 text-purple-400" />
                    <span>Financing</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setComparisonMode(comparisonMode === 'financing' ? null : 'financing'); setActiveTab('timeline'); }}
                  className={`p-1 rounded transition-colors ${comparisonMode === 'financing' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'}`}
                  title="Compare impact"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateParam('isFinanced', !params.isFinanced); }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${params.isFinanced ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${params.isFinanced ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              </div>

              <div className={`space-y-6 transition-all duration-300 ${sectionsActive.financing ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden hidden'}`}>
                <div className={`space-y-6 transition-all duration-300 ${!params.isFinanced ? 'opacity-40 pointer-events-none select-none filter grayscale' : ''}`}>
                  <Slider 
                    id="slider-downPayment"
                    label="Down Payment ($)"
                    valueDisplay={`$${params.downPayment.toLocaleString()}`}
                    min={0}
                    max={results.systemCost}
                    step={500}
                    value={params.downPayment}
                    onSetDefault={() => saveDefaultParam('downPayment')}
                    onChange={(e) => updateParam('downPayment', Number(e.target.value))}
                    isLocked={lockedParams.includes('downPayment')}
                    onToggleLock={() => toggleLock('downPayment')}
                  />

                  <Slider 
                    id="slider-loanTermYears"
                    label="Loan Term (Years)"
                    valueDisplay={`${params.loanTermYears} yrs`}
                    min={1}
                    max={30}
                    step={1}
                    value={params.loanTermYears}
                    onSetDefault={() => saveDefaultParam('loanTermYears')}
                    onChange={(e) => updateParam('loanTermYears', Number(e.target.value))}
                    isLocked={lockedParams.includes('loanTermYears')}
                    onToggleLock={() => toggleLock('loanTermYears')}
                  />

                  <Slider 
                    id="slider-loanInterestRate"
                    label="Interest Rate (%)"
                    valueDisplay={`${params.loanInterestRate.toFixed(2)}%`}
                    min={0}
                    max={20}
                    step={0.25}
                    value={params.loanInterestRate}
                    onSetDefault={() => saveDefaultParam('loanInterestRate')}
                    onChange={(e) => updateParam('loanInterestRate', Number(e.target.value))}
                    isLocked={lockedParams.includes('loanInterestRate')}
                    onToggleLock={() => toggleLock('loanInterestRate')}
                  />

                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 space-y-3">
                    <label className="text-xs font-medium text-slate-400">Lump Sum Payments</label>
                    <div className="flex gap-2">
                      <select 
                        id="lumpSumYear" 
                        className="bg-slate-950 border border-slate-700 rounded text-xs text-white p-1.5 focus:outline-none focus:border-amber-500 w-24"
                      >
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="5">Year 5</option>
                        <option value="10">Year 10</option>
                        <option value="15">Year 15</option>
                      </select>
                      <input 
                        type="number" 
                        id="lumpSumAmt" 
                        placeholder="Amount ($)" 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded text-xs text-white p-1.5 focus:outline-none focus:border-amber-500"
                      />
                      <button 
                        onClick={() => {
                          const y = parseInt((document.getElementById('lumpSumYear') as HTMLSelectElement).value);
                          const amt = parseFloat((document.getElementById('lumpSumAmt') as HTMLInputElement).value);
                          if (y && amt > 0) {
                            updateParam('lumpSumPayments', [...(params.lumpSumPayments || []), { year: y, amount: amt, enabled: true }]);
                            (document.getElementById('lumpSumAmt') as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-slate-800 text-sky-400 px-3 rounded border border-slate-700 hover:bg-slate-700 text-xs font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    
                    {(params.lumpSumPayments || []).length > 0 && (
                      <div className="space-y-2 mt-2">
                        {(params.lumpSumPayments || []).map((p, i) => (
                          <div key={i} className={`flex justify-between items-center text-xs bg-slate-950 p-2 rounded border transition-colors ${p.enabled !== false ? 'border-slate-800' : 'border-slate-800/50 opacity-50'}`}>
                            <span className="text-slate-300">Year {p.year}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">${p.amount.toLocaleString()}</span>
                              <button 
                                onClick={() => {
                                  const newPayments = [...params.lumpSumPayments];
                                  newPayments[i].enabled = newPayments[i].enabled === false ? true : false;
                                  updateParam('lumpSumPayments', newPayments);
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                                title={p.enabled !== false ? "Disable Payment" : "Enable Payment"}
                              >
                                {p.enabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={() => {
                                  const newPayments = [...params.lumpSumPayments];
                                  newPayments.splice(i, 1);
                                  updateParam('lumpSumPayments', newPayments);
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {!params.isFinanced && (
                  <div className="text-[10px] text-amber-500/70 font-mono italic px-1 pt-1">
                    * Financing options are currently disabled. Toggle the switch above to include this section.
                  </div>
                )}
              </div>
            </div>

            </div>

          </div>

          {/* Results Panel */}
          <div 
            id="results-panel" 
            className="lg:col-span-7 lg:sticky lg:top-4 lg:self-start flex flex-col gap-4 relative z-10 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
          >
            
            {/* Unified Summary & Metrics Block */}
            <div id="summary-metrics-container" className="flex flex-col gap-4">
              {/* Tab Selector Buttons */}
              <div id="summary-tab-header" className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800/80">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSummaryTab('metrics')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      summaryTab === 'metrics'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Performance Cards</span>
                  </button>
                  <button
                    onClick={() => setSummaryTab('narrative')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                      summaryTab === 'narrative'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Executive Narrative</span>
                  </button>
                </div>
                
                <span className="text-[10px] uppercase font-mono text-slate-500 mr-2 border border-slate-800/60 px-2 py-1 rounded bg-slate-950 select-none hidden sm:inline-block">Summary Panel</span>
              </div>

              {summaryTab === 'narrative' ? (
                <ExecutiveSummary params={params} results={results} vendorName={vendorName} onNavigateToEquation={navigateToEquation} />
              ) : (
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/20 backdrop-blur-xl border border-white/5 rounded-2xl p-5 md:p-6 pb-4 sm:pb-5 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-5 opacity-20">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="0.5" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 4" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold">Break-even Velocity</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mt-1 gap-4">
                    {(results.paybackPeriod > 0 && results.paybackPeriod <= 25) ? (
                      <div 
                        onClick={(e) => navigateToEquation('payback', e)}
                        className="cursor-pointer group/metric hover:opacity-80 transition-opacity"
                        title="Click to view payback formula"
                      >
                        <div className="flex items-baseline gap-3">
                          <h2 className="text-6xl md:text-5xl lg:text-5xl xl:text-6xl font-light text-white tracking-tighter group-hover/metric:text-amber-400 transition-colors">
                            {results.paybackPeriod.toFixed(1)}
                          </h2>
                          <span className="text-xl text-slate-400 font-serif italic">Years</span>
                        </div>
                        {compareResults && compareResults.paybackPeriod > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-mono ${results.paybackPeriod < compareResults.paybackPeriod ? 'text-emerald-400' : results.paybackPeriod > compareResults.paybackPeriod ? 'text-rose-400' : 'text-slate-500'}`}>
                              {results.paybackPeriod < compareResults.paybackPeriod ? '-' : '+'}{Math.abs(results.paybackPeriod - compareResults.paybackPeriod).toFixed(1)} yrs vs compare
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div 
                        onClick={(e) => navigateToEquation('projection', e)}
                        className="cursor-pointer group/metric hover:opacity-80 transition-opacity flex flex-col gap-1 mt-1"
                        title="Click to view net profit formula"
                      >
                        <h2 className="text-4xl md:text-3xl lg:text-3xl xl:text-4xl font-light text-rose-400 tracking-tight">
                          {formatCurrency(results.total25YearSavings)}
                        </h2>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] bg-rose-500/10 text-rose-400 uppercase tracking-widest px-1.5 py-0.5 rounded border border-rose-500/20">Loss at 25-Yr End-of-Life</span>
                           <span className="text-[9px] text-slate-400 uppercase tracking-widest">
                             {results.paybackPeriod > 25 ? `Ext. Break-even: ${results.paybackPeriod.toFixed(1)} Yrs` : 'Never breaks even'}
                           </span>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      onClick={(e) => navigateToEquation('cost', e)}
                      className="text-left sm:text-right cursor-pointer group/metric hover:opacity-80 transition-opacity"
                      title="Click to view system size formula"
                    >
                      <div className="flex items-center sm:justify-end gap-2 mb-1">
                        <Sun className="w-4 h-4 text-amber-500/80" />
                        <p className="text-[10px] uppercase tracking-widest text-amber-500/80 group-hover/metric:text-amber-400 transition-colors">System Size</p>
                      </div>
                      <p className="text-3xl text-amber-400 font-mono font-light tracking-tight group-hover/metric:text-amber-300 transition-colors">
                        {results.systemSizeKW.toFixed(1)} <span className="text-lg text-amber-500/50">kW</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 relative z-10 border-t border-slate-800/50 pt-3">
                    <div 
                      onClick={(e) => navigateToEquation('net', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view net system cost formula"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <PiggyBank className="w-3 h-3 text-slate-500" />
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 group-hover/card:text-amber-500 transition-colors">Net Cost</p>
                      </div>
                      <p className="text-base sm:text-lg font-mono text-white group-hover/card:text-amber-400 transition-colors">{formatCurrency(results.netCost)}</p>
                      {compareResults && (
                        <p className={`text-[9px] font-mono mt-0.5 ${results.netCost < compareResults.netCost ? 'text-emerald-400' : results.netCost > compareResults.netCost ? 'text-rose-400' : 'text-slate-500'}`}>
                          {results.netCost < compareResults.netCost ? '-' : '+'}{formatCurrency(Math.abs(results.netCost - compareResults.netCost))} vs compare
                        </p>
                      )}
                    </div>
                    <div 
                      onClick={(e) => navigateToEquation('yearlygen', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view yearly generation formula"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="w-3 h-3 text-amber-500/80" />
                        <p className="text-[9px] uppercase tracking-wider text-amber-500/80 group-hover/card:text-amber-500 transition-colors">Yearly Gen</p>
                      </div>
                      <p className="text-base sm:text-lg font-mono text-amber-400 group-hover/card:text-amber-300 transition-colors">
                        {results.annualGeneration.toLocaleString('en-US', {maximumFractionDigits: 0})} <span className="text-[10px] text-amber-500/50 font-sans">kWh</span>
                      </p>
                      {compareResults && (
                        <p className={`text-[9px] font-mono mt-0.5 ${results.annualGeneration > compareResults.annualGeneration ? 'text-emerald-400' : results.annualGeneration < compareResults.annualGeneration ? 'text-rose-400' : 'text-slate-500'}`}>
                          {results.annualGeneration > compareResults.annualGeneration ? '+' : '-'}{Math.abs(results.annualGeneration - compareResults.annualGeneration).toLocaleString('en-US', {maximumFractionDigits: 0})} kWh vs compare
                        </p>
                      )}
                    </div>
                    <div 
                      onClick={(e) => navigateToEquation('projection', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view cumulative savings formula"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Leaf className={`w-3 h-3 ${results.total25YearSavings >= 0 ? "text-emerald-400/80" : "text-rose-400/80"}`} />
                        <p className={`text-[9px] uppercase tracking-wider group-hover/card:text-amber-500 transition-colors ${results.total25YearSavings >= 0 ? "text-emerald-400/80" : "text-rose-400/80"}`}>25-Yr Value</p>
                      </div>
                      <p className={`text-base sm:text-lg font-mono group-hover/card:text-amber-400 transition-colors ${results.total25YearSavings >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatCurrency(results.total25YearSavings)}
                      </p>
                      {compareResults && (
                        <p className={`text-[9px] font-mono mt-0.5 ${results.total25YearSavings > compareResults.total25YearSavings ? 'text-emerald-400' : results.total25YearSavings < compareResults.total25YearSavings ? 'text-rose-400' : 'text-slate-500'}`}>
                          {results.total25YearSavings > compareResults.total25YearSavings ? '+' : '-'}{formatCurrency(Math.abs(results.total25YearSavings - compareResults.total25YearSavings))} vs compare
                        </p>
                      )}
                    </div>
                    <div 
                      onClick={(e) => navigateToEquation('25yr_roi', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view ROI formula"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className={`w-3 h-3 ${results.roiPercentage >= 0 ? "text-emerald-400/80" : "text-rose-400/80"}`} />
                        <p className={`text-[9px] uppercase tracking-wider group-hover/card:text-amber-500 transition-colors ${results.roiPercentage >= 0 ? "text-emerald-400/80" : "text-rose-400/80"}`}>25-Yr ROI</p>
                      </div>
                      <p className={`text-base sm:text-lg font-mono group-hover/card:text-emerald-400 transition-colors ${results.roiPercentage >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {results.roiPercentage > 0 ? '+' : ''}{results.roiPercentage.toFixed(1)}<span className="text-[10px] text-emerald-500/50">%</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 relative z-10 border-t border-slate-800/50 pt-3">
                    <div
                      onClick={(e) => navigateToEquation('exported_sold', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view exported energy sales formula"
                    >
                      <p className="text-[9px] uppercase tracking-wider text-emerald-500 mb-1 group-hover/card:text-amber-500 transition-colors">Exported & Sold</p>
                      <p className="text-sm sm:text-base text-emerald-400 font-mono group-hover/card:text-amber-400 transition-colors">
                        {results.annualGridSales.toLocaleString('en-US', {maximumFractionDigits: 0})} <span className="text-[10px] text-emerald-500/50">kWh/yr</span>
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase">≈ {formatCurrency(results.annualGridSales * params.sellBackRate)} earned</p>
                    </div>
                    <div
                      onClick={(e) => navigateToEquation('battery_utilization', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view battery calculations"
                    >
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1 group-hover/card:text-amber-500 transition-colors">Battery Used</p>
                      <p className="text-sm sm:text-base text-white font-mono group-hover/card:text-amber-400 transition-colors">
                        {results.annualBatteryDraw.toLocaleString('en-US', {maximumFractionDigits: 0})} <span className="text-[10px] text-slate-500">kWh/yr</span>
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase">Stored power</p>
                    </div>
                    <div
                      onClick={(e) => navigateToEquation('grid_purchase', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view grid purchase formula"
                    >
                      <p className="text-[9px] uppercase tracking-wider text-rose-500 mb-1 group-hover/card:text-amber-500 transition-colors">Grid Purchase</p>
                      <p className="text-sm sm:text-base text-rose-400 font-mono group-hover/card:text-amber-400 transition-colors">
                        {results.annualGridPurchase.toLocaleString('en-US', {maximumFractionDigits: 0})} <span className="text-[10px] text-rose-500/50">kWh/yr</span>
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase">≈ {formatCurrency(results.annualGridPurchase * params.utilityRate)} spent</p>
                    </div>
                  </div>

                  {/* CO2 Section */}
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 relative z-10 border-t border-slate-800/50 pt-3">
                    <div
                      onClick={(e) => navigateToEquation('co2', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view carbon emission reduction details"
                    >
                      <p className="text-[9px] uppercase tracking-wider text-emerald-400/80 mb-1 group-hover/card:text-amber-400 transition-colors">Renewable Mix</p>
                      <p className="text-sm sm:text-base text-emerald-400 font-mono group-hover/card:text-amber-400 transition-colors">
                        {results.co2Impact.newRenewablePercent.toFixed(1)}%
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase">Was {results.co2Impact.currentRenewablePercent.toFixed(1)}%</p>
                    </div>
                    <div
                      onClick={(e) => navigateToEquation('co2', e)}
                      className="cursor-pointer group/card hover:bg-slate-800/20 p-1.5 rounded-lg transition-all"
                      title="Click to view CO2 avoid savings calculations"
                    >
                      <p className="text-[9px] uppercase tracking-wider text-sky-400 mb-1 group-hover/card:text-amber-400 transition-colors">Annual Impact</p>
                      <p className="text-sm sm:text-base text-sky-400 font-mono group-hover/card:text-amber-400 transition-colors">
                        {results.co2Impact.co2SavedTonsPerYear.toFixed(2)} <span className="text-[10px] font-sans">Tons</span>
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase">CO₂e Avoided</p>
                    </div>
                    <div 
                      onClick={(e) => navigateToEquation('co2homes', e)}
                      className="bg-sky-950/20 p-1.5 rounded-lg border border-sky-900/40 flex flex-col justify-between cursor-pointer hover:bg-sky-900/20 transition-all hover:border-amber-500/30"
                      title="Click to view equivalent homes formula"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Home className="w-3 h-3 text-sky-400/80" />
                        <p className="text-[9px] uppercase tracking-wider text-sky-400/80">Homes Offset</p>
                      </div>
                      <p className="text-sm sm:text-base text-sky-400 font-mono">
                        {(results.co2Impact.co2SavedTonsPerYear / 4.515).toFixed(1)} <span className="text-[10px] text-sky-500/50 font-sans">homes</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chart Area */}
            <div className="flex-1 bg-slate-950/40 rounded-2xl border border-slate-800 p-6 flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-slate-800/50 pb-4">
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${activeTab === 'timeline' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Time Series</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('sensitivity')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${activeTab === 'sensitivity' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Parameter Space</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('equations')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${activeTab === 'equations' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span className="hidden sm:inline">Equations</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('outage')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${activeTab === 'outage' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">Resilience</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('compare')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${activeTab === 'compare' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <GitCompare className="w-4 h-4" />
                    <span className="hidden sm:inline">Balance</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('renewability')}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${activeTab === 'renewability' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Leaf className="w-4 h-4" />
                    <span className="hidden sm:inline">Mix</span>
                  </button>
                </div>



                {activeTab === 'sensitivity' && (
                  <div className="flex items-center gap-4">
                    <select 
                      value={sensitivityMetric}
                      onChange={(e) => setSensitivityMetric(e.target.value as 'profit' | 'breakeven' | 'both' | 'slope')}
                      className="bg-slate-900 border border-slate-800 text-xs text-amber-500 uppercase tracking-widest rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    >
                      <option value="both">All Metrics</option>
                      <option value="profit">25-Yr Return</option>
                      <option value="breakeven">Break-even</option>
                      <option value="slope">Profit Slope</option>
                    </select>
                    <select 
                      value={sensitivityVar}
                      onChange={(e) => setSensitivityVar(e.target.value as SensitivityVariable)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-300 uppercase tracking-widest rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    >
                      <option value="systemSize">System Size (kW)</option>
                      <option value="battery">Battery Capacity (kWh)</option>
                      <option value="interestRate">Interest Rate (%)</option>
                      <option value="downPayment">Down Payment ($)</option>
                      <option value="loanTerm">Loan Term (Yrs)</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-h-[300px]">
                {activeTab === 'timeline' ? (
                  <RoiChart data={results.chartData} paybackPeriod={results.paybackPeriod} compareData={compareResults?.chartData} comparePaybackPeriod={compareResults?.paybackPeriod} />
                ) : activeTab === 'sensitivity' ? (
                  <SensitivityChart 
                    data={sensitivityData} 
                    variable={sensitivityVar} 
                    metric={sensitivityMetric} 
                    currentValue={
                      sensitivityVar === 'systemSize' ? params.totalSystemSizeKw :
                      sensitivityVar === 'battery' ? params.batteryCapacityKwh :
                      sensitivityVar === 'interestRate' ? params.loanInterestRate :
                      sensitivityVar === 'downPayment' ? params.downPayment :
                      params.loanTermYears
                    }
                    onApplyExtrema={(value) => {
                      if (sensitivityVar === 'systemSize') updateParam('totalSystemSizeKw', value);
                      if (sensitivityVar === 'battery') updateParam('batteryCapacityKwh', value);
                      if (sensitivityVar === 'interestRate') updateParam('loanInterestRate', value);
                      if (sensitivityVar === 'downPayment') updateParam('downPayment', value);
                      if (sensitivityVar === 'loanTerm') updateParam('loanTermYears', value);
                    }}
                  />
                ) : activeTab === 'outage' ? (
                  <OutageChart data={results.outageResilience} />
                ) : activeTab === 'compare' ? (
                  <MonthlyBalanceChart data={results.monthlyEnergyData} results={results} />
                ) : activeTab === 'renewability' ? (
                  <RenewabilityChart data={results.monthlyEnergyData} />
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
        )}

        {appScreen === 'reduction' && (
          <EnergyReduction params={params} projects={reductionProjects} setProjects={setReductionProjects} updateParam={updateParam} />
        )}

        {appScreen === 'progress' && (
          <ProgressTracker params={effectiveParams} updateParam={updateParam} savedConfigs={savedConfigs} />
        )}

      </div>
      <PdfReport params={effectiveParams} results={results} vendorName={vendorName} isHidden={true} />
      {showPdfPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 shrink-0">
            <h2 className="text-xl font-light text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              PDF Export Preview
            </h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowPdfPreview(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
              >
                Close Preview
              </button>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-sky-600 hover:bg-sky-500 text-white border-sky-500 hover:border-sky-400 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generating PDF...' : 'Save as PDF'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-950 p-8 flex justify-center preview-container">
               <PdfReport params={effectiveParams} results={results} vendorName={vendorName} isHidden={false} />
          </div>
        </div>
      )}

      {/* Delete Config Modal */}
      {configToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light text-white mb-2">Delete Configuration?</h3>
            <p className="text-slate-400 mb-6 text-sm">Are you sure you want to delete this saved configuration? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfigToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
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
                    const fb = await import('./lib/firebase');
                    const pub = await fb.getPublicConfigurations();
                    setPublicConfigs(pub);
                  } catch (e) {
                    console.error("Failed to delete", e);
                  }
                  setConfigToDelete(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Save Defaults Modal */}
      {confirmSave && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light text-white mb-2">Save Defaults?</h3>
            <p className="text-slate-400 mb-6 text-sm">This will overwrite the global initial defaults for all future uses of the calculator from your device.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmSave(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('UUC_SOLAR_DEFAULTS', JSON.stringify(params));
                  setConfirmSave(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Factory Reset Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light text-white mb-2">Factory Reset?</h3>
            <p className="text-slate-400 mb-6 text-sm">This will clear your local cached defaults and return to the hardcoded system defaults. Continue?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('UUC_SOLAR_DEFAULTS'); 
                  setParams(DEFAULT_PARAMS);
                  setConfirmReset(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-3xl w-full h-[80vh] shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-light text-white flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-indigo-400" />
                Admin Dashboard
              </h3>
              <button 
                onClick={() => setShowAdminDashboard(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl border border-slate-800 p-4">
              <h4 className="text-slate-400 uppercase tracking-widest text-xs mb-4">All Saved Configs (Admin)</h4>
              <div className="space-y-2">
                <AdminConfigsManager />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Math Equation Popup (Sleek Context Menu style) */}
      {pendingEquationPopup && (
        <>
          {/* Transparent backdrop to detect clicking away */}
          <div 
            className="fixed inset-0 z-[240] cursor-default bg-black/15 backdrop-blur-[0.5px]" 
            onClick={() => {
              setPendingEquationPopup(null);
              setPopupCoords(null);
            }} 
          />
          
          <div 
            style={
              popupCoords ? {
                position: 'fixed',
                zIndex: 250,
                left: `${Math.min(popupCoords.x, window.innerWidth - 225)}px`,
                top: `${Math.min(popupCoords.y, window.innerHeight - 130)}px`,
              } : {
                position: 'fixed',
                zIndex: 250,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }
            }
            className="bg-slate-900 border border-slate-700/60 rounded-2xl p-1.5 w-[210px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-lg font-mono text-xs text-slate-300"
          >
            <div className="px-3 py-2 border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase tracking-wider select-none truncate">
              {EQUATION_LABELS[pendingEquationPopup] || 'Equation Details'}
            </div>
            
            <div className="flex flex-col gap-0.5 mt-1">
              <button 
                onClick={() => {
                  handleProceedToEquations(pendingEquationPopup);
                  setPendingEquationPopup(null);
                  setPopupCoords(null);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors group w-full"
              >
                <Eye className="w-4 h-4 text-slate-550 group-hover:text-amber-400 transition-colors" />
                <span>View Formula Steps</span>
              </button>
              
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AdminConfigsManager() {
  const [allConfigs, setAllConfigs] = useState<SavedConfig[]>([]);
  
  React.useEffect(() => {
    import('./lib/firebase')
      .then(fb => fb.getAllConfigurationsAdmin())
      .then(setAllConfigs)
      .catch(console.error);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this config from the database?')) {
      try {
        const { deleteConfiguration } = await import('./lib/firebase');
        await deleteConfiguration(id);
        setAllConfigs(prev => prev.filter(c => c.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (allConfigs.length === 0) return <p className="text-sm text-slate-500">Loading or no configs found...</p>;

  return (
    <div className="space-y-4">
      {allConfigs.map(c => (
        <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex justify-between items-center">
          <div>
            <h5 className="text-white font-medium">{c.title}</h5>
            <p className="text-xs text-slate-500 max-w-lg truncate">{c.description || 'No description'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">ID: {c.id}</span>
              <span className="text-[10px] bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded border border-indigo-700/50">User: {c.userId}</span>
              {c.isPublic && <span className="text-[10px] bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700/50">Public</span>}
            </div>
          </div>
          <button 
            onClick={() => handleDelete(c.id)}
            className="px-3 py-1.5 bg-red-900/30 text-red-500 hover:bg-red-800/50 border border-red-900/50 rounded-lg text-xs"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

