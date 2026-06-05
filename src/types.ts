export interface SolarParams {
  inputMode: 'detailed' | 'total';
  panelWattage: number;
  numberOfPanels: number;
  costPerWatt: number;
  totalSystemSizeKw: number;
  totalGrossCost: number;
  
  hasSolarEfficiency: boolean;
  useSeasonalGenerationCurve: boolean;
  efficiencyMode: 'flat' | 'monthly';
  solarEfficiency: number;
  monthlyEfficiencyProfile: number[];
  
  hasIncentives: boolean;
  federalTaxCreditPercent: number;
  stateRebateAmount: number;
  
  usageMode: 'flat' | 'monthly' | 'historical';
  monthlyUsageKwh: number;
  monthlyUsageProfile: number[];
  
  historicalBills?: { 
    id: string; 
    monthString: string; 
    billAmount: number; 
    actualUsageKwh: number;
    solarGeneratedKwh?: number;
    gridExportedKwh?: number;
  }[];
  historicalCompMode?: 'average' | 'recent';
  historicalByMonth?: boolean;
  solarSwitchDate?: string;
  
  useReducedEnergyProfile: boolean;
  
  utilityRate: number;
  annualBillIncrease: number;
  
  hasBattery: boolean;
  batteryCapacityKwh: number;
  batteryCostPerKwh: number;
  sellBackRate: number;
  hasLinkedSellBackRate: boolean;

  hasMaintenance: boolean;
  annualMaintenanceCost: number;
  
  isFinanced: boolean;
  loanTermYears: number;
  loanInterestRate: number;
  downPayment: number;
  lumpSumPayments: { year: number, amount: number, enabled: boolean }[];

  gridRenewablePercentage: number;
  
  reductionProjects?: EnergyReductionProject[];
}

export interface EnergyReductionProject {
  id: string;
  name: string;
  type: string;
  percentageReduction: number;
  upfrontCost: number;
  enabled: boolean;
  calculationMethod?: 'percentage' | 'fixtures' | 'kwh_reduction' | 'usage_before_after' | 'thermostat';
  wattsBefore?: number;
  wattsAfter?: number;
  quantity?: number;
  hoursPerDay?: number;
  lifespanYears?: number;
  startMonthOut?: number;
  kwhReductionPerMonth?: number;
  kwhBefore?: number;
  kwhAfter?: number;
  degreeDecrease?: number;
  kwhSavingsPerDegree?: number;
}

export interface ProgressEntry {
  id: string;
  monthString: string;
  actualBill: number;
  actualUsageKwh: number;
}

export interface YearlyData {
  year: number;
  cumulativeSavings: number;
  netCost: number;
  annualSavings: number;
}

export interface SensitivityData {
  xValue: number;
  netCost: number;
  netProfit: number;
  paybackPeriod: number;
  profitSlope?: number;
}

export type SensitivityVariable = 'systemSize' | 'battery' | 'interestRate' | 'downPayment' | 'loanTerm';

export interface OutageScenario {
  name: string;
  usageKwH: number;
  hoursPerDay: number;
  description: string;
  surplusKwHPerDay: number;
}

export interface OutageResilience {
  scenarios: OutageScenario[];
  cellPhoneCharges: number;
}

export interface CO2Impact {
  currentRenewablePercent: number;
  newRenewablePercent: number;
  co2SavedTonsPerYear: number;
}

export interface MonthEnergyData {
  monthName: string;
  solarConsumed: number;
  gridRenewable: number;
  gridNonRenewable: number;
  generation?: number;
  usage?: number;
}

export interface RoiResults {
  systemCost: number;
  systemSizeKW: number;
  annualGeneration: number;
  annualUsage: number;
  annualGridSales: number;
  annualGridPurchase: number;
  annualBatteryDraw: number;
  systemOffset: number;
  netCost: number;
  yearOneSavings: number;
  total25YearSavings: number;
  roiPercentage: number;
  paybackPeriod: number;
  chartData: YearlyData[];
  monthlyEnergyData: MonthEnergyData[];
  outageResilience: OutageResilience;
  co2Impact: CO2Impact;
  effectiveUtilityRate: number;
  effectiveUtilityRateProfile: number[];
  effectiveMonthlyUsageKwh: number;
  effectiveMonthlyUsageProfile: number[];
}

