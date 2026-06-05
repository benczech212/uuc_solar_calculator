import { SolarParams, RoiResults, YearlyData, SensitivityData, SensitivityVariable, MonthEnergyData } from './types';

export function getActiveEnergyParams(params: SolarParams) {
  let rate = params.utilityRate;
  let flatUsage = params.monthlyUsageKwh;
  let profile = [...params.monthlyUsageProfile];
  let rateProfile = Array(12).fill(rate);

  if (params.usageMode === 'historical' && params.historicalBills && params.historicalBills.length > 0) {
    const bills = params.historicalBills.filter(b => b.actualUsageKwh > 0 || b.billAmount > 0);
    
    if (bills.length > 0) {
      const sortedBills = [...bills].sort((a, b) => b.monthString.localeCompare(a.monthString));
      const mostRecent = sortedBills[0];
      
      if (params.historicalCompMode === 'recent') {
      rate = mostRecent.actualUsageKwh > 0 ? mostRecent.billAmount / mostRecent.actualUsageKwh : params.utilityRate;
      flatUsage = mostRecent.actualUsageKwh;
      
      if (params.historicalByMonth) {
        const mostRecentUsages = Array(12).fill(flatUsage);
        const mostRecentRates = Array(12).fill(rate);
        const found = Array(12).fill(false);
        
        for (const bill of sortedBills) {
          const match = bill.monthString.match(/-(\d{2})$/);
          if (match) {
            const mIdx = parseInt(match[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12 && !found[mIdx]) {
              mostRecentUsages[mIdx] = bill.actualUsageKwh;
              mostRecentRates[mIdx] = bill.actualUsageKwh > 0 ? bill.billAmount / bill.actualUsageKwh : rate;
              found[mIdx] = true;
            }
          }
        }
        profile = mostRecentUsages;
        rateProfile = mostRecentRates;
        flatUsage = profile.reduce((a, b) => a + b, 0) / 12;
      } else {
        profile = Array(12).fill(mostRecent.actualUsageKwh);
        rateProfile = Array(12).fill(rate);
      }
    } else {
      const totalUsage = bills.reduce((sum, b) => sum + b.actualUsageKwh, 0);
      const totalBill = bills.reduce((sum, b) => sum + b.billAmount, 0);
      
      if (totalUsage > 0) {
        let yearlyRate = totalBill / totalUsage;
        rate = yearlyRate;
        flatUsage = totalUsage / bills.length;
        
        const monthlyUsageSum = Array(12).fill(0);
        const monthlyBillSum = Array(12).fill(0);
        const monthlyCount = Array(12).fill(0);
        
        for (const bill of bills) {
          const match = bill.monthString.match(/-(\d{2})$/);
          if (match) {
            const mIdx = parseInt(match[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) {
              monthlyUsageSum[mIdx] += bill.actualUsageKwh;
              monthlyBillSum[mIdx] += bill.billAmount;
              monthlyCount[mIdx] += 1;
            }
          }
        }
        
        if (params.historicalByMonth) {
          profile = monthlyUsageSum.map((sum, idx) => {
            return monthlyCount[idx] > 0 ? sum / monthlyCount[idx] : flatUsage;
          });
          rateProfile = monthlyBillSum.map((bSum, idx) => {
             return monthlyUsageSum[idx] > 0 ? bSum / monthlyUsageSum[idx] : yearlyRate;
          });
          rate = yearlyRate;
          flatUsage = profile.reduce((a, b) => a + b, 0) / 12;
        } else {
          // Average Yearly
          profile = Array(12).fill(flatUsage);
          rateProfile = Array(12).fill(yearlyRate);
        }
      }
    }
    }
  }

  return { rate, flatUsage, profile, rateProfile };
}

export function calculateRoi(params: SolarParams): RoiResults {
  const active = getActiveEnergyParams(params);
  const useProfile = params.usageMode === 'monthly' || params.usageMode === 'historical';

  // 1. Calculate System Attributes based on inputMode
  let systemSizeKW = 0;
  let solarCost = 0;
  if (params.inputMode === 'detailed') {
    const totalWatts = params.panelWattage * params.numberOfPanels;
    systemSizeKW = totalWatts / 1000;
    solarCost = totalWatts * params.costPerWatt;
  } else {
    systemSizeKW = params.totalSystemSizeKw;
    solarCost = params.totalGrossCost;
  }

  // 2. Gross & Net Costs
  const batteryCost = params.hasBattery ? params.batteryCapacityKwh * params.batteryCostPerKwh : 0;
  const grossCost = solarCost + batteryCost;
  
  let totalIncentives = 0;
  if (params.hasIncentives) {
    totalIncentives = (grossCost * ((params.federalTaxCreditPercent || 0) / 100)) + (params.stateRebateAmount || 0);
  }
  
  const netCost = Math.max(0, grossCost - totalIncentives);

  // 3. Yearly Generation & Monthly Profiles
  const baseAnnualGeneration = systemSizeKW * 1500; // Assuming 1500 kWh per kW per year
  const monthlyGenProfile = params.useSeasonalGenerationCurve ? 
    [0.06, 0.07, 0.09, 0.10, 0.11, 0.11, 0.11, 0.10, 0.09, 0.07, 0.05, 0.04] :
    Array(12).fill(1/12);
  
  let actualMonthlyGen = monthlyGenProfile.map(p => p * baseAnnualGeneration);
  
  if (params.hasSolarEfficiency) {
    if (params.efficiencyMode === 'monthly') {
      actualMonthlyGen = actualMonthlyGen.map((gen, idx) => gen * (params.monthlyEfficiencyProfile[idx] / 100));
    } else {
      actualMonthlyGen = actualMonthlyGen.map(gen => gen * (params.solarEfficiency / 100));
    }
  }

  const annualGeneration = actualMonthlyGen.reduce((sum, val) => sum + val, 0);

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const simulateYear = (yearIndex: number) => {
    let yrGridSales = 0;
    let yrGridPurchase = 0;
    let yrBatteryDraw = 0;
    let yrUsage = 0;
    let yrBillWithoutSolar = 0;
    let yrBillWithSolar = 0;
    
    // Evaluate reduction projects for this year
    let reductionFactor = 1;
    let totalReducedKwh = 0;
    const baseAnnualKwh = useProfile ? active.profile.reduce((a,b)=>a+b,0) : active.flatUsage * 12;

    if (params.reductionProjects?.length && baseAnnualKwh > 0) {
      for (const p of params.reductionProjects.filter(p => p.enabled)) {
        const startMonth = p.startMonthOut || 0;
        const endMonth = startMonth + ((p.lifespanYears || 10) * 12);
        
        const yearStartMonth = (yearIndex - 1) * 12;
        const yearEndMonth = yearIndex * 12;
        
        const activeStart = Math.max(yearStartMonth, startMonth);
        const activeEnd = Math.min(yearEndMonth, endMonth);
        const activeMonths = Math.max(0, activeEnd - activeStart);
        
        if (activeMonths > 0) {
          const fullYearReduction = calculateReductionKwh(p, baseAnnualKwh);
          totalReducedKwh += fullYearReduction * (activeMonths / 12);
        }
      }
      reductionFactor = Math.max(0, baseAnnualKwh - totalReducedKwh) / baseAnnualKwh;
    }

    const monthlyEnergy: MonthEnergyData[] = [];

    const rateFactor = Math.pow(1 + params.annualBillIncrease / 100, yearIndex - 1);

    for (let m = 0; m < 12; m++) {
      const baseMonthUsage = useProfile ? active.profile[m] : active.flatUsage;
      const monthRate = (useProfile && active.rateProfile) ? active.rateProfile[m] * rateFactor : active.rate * rateFactor;
      const monthUsage = baseMonthUsage * reductionFactor;
      yrUsage += monthUsage;

      const monthlyGen = actualMonthlyGen[m];
      const dailyGen = monthlyGen / daysInMonth[m];
      const dailyUsage = monthUsage / daysInMonth[m];

      const directSolarUsage = Math.min(dailyUsage * 0.4, dailyGen); 
      const dailySurplus = Math.max(0, dailyGen - directSolarUsage);
      const dailyNightUsage = Math.max(0, dailyUsage - directSolarUsage);

      const batteryCharge = params.hasBattery ? Math.min(dailySurplus, params.batteryCapacityKwh) : 0;
      const gridSelling = dailySurplus - batteryCharge;
      const batteryDischarge = Math.min(batteryCharge, dailyNightUsage);
      const gridBuying = dailyNightUsage - batteryDischarge;
      
      const monthSolarConsumed = (directSolarUsage + batteryDischarge) * daysInMonth[m];
      const gridRenewablePct = params.gridRenewablePercentage || 0;
      const monthGridPurchased = gridBuying * daysInMonth[m];
      const monthGridRenewable = monthGridPurchased * (gridRenewablePct / 100);
      const monthGridNonRenewable = monthGridPurchased - monthGridRenewable;

      if (yearIndex === 1) {
        const gridRenewablePct = params.gridRenewablePercentage || 0;
        const mixSolar = Math.min(monthlyGen || 0, monthUsage || 0);
        const mixGrid = Math.max(0, (monthUsage || 0) - mixSolar);
        const mixGridRenewable = mixGrid * (gridRenewablePct / 100);
        const mixGridNonRenewable = mixGrid - mixGridRenewable;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthlyEnergy.push({
          monthName: monthNames[m],
          solarConsumed: mixSolar,
          gridRenewable: mixGridRenewable,
          gridNonRenewable: mixGridNonRenewable,
          generation: monthlyGen,
          usage: monthUsage
        });
      }

      yrGridSales += gridSelling * daysInMonth[m];
      yrGridPurchase += monthGridPurchased;
      yrBatteryDraw += batteryDischarge * daysInMonth[m];

      yrBillWithoutSolar += monthUsage * monthRate;
      yrBillWithSolar += (monthGridPurchased * monthRate) - (gridSelling * daysInMonth[m] * params.sellBackRate);
    }
    
    return { yrUsage, yrGridSales, yrGridPurchase, yrBatteryDraw, yrBillWithoutSolar, yrBillWithSolar, monthlyEnergy };
  };

  const yr1 = simulateYear(1);
  const annualUsage = yr1.yrUsage;
  const yr1GridSales = yr1.yrGridSales;
  const yr1GridPurchase = yr1.yrGridPurchase;
  const yr1BatteryDraw = yr1.yrBatteryDraw;
  const yr1BillWithoutSolar = yr1.yrBillWithoutSolar;
  const yr1BillWithSolar = yr1.yrBillWithSolar;

  const systemOffset = annualUsage > 0 ? (annualGeneration / annualUsage) * 100 : 0;
  let currentUtilityRate = active.rate;

  let initialCostBasis = grossCost;
  let totalUpfrontCost = 0;
  
  if (params.reductionProjects?.length) {
    for (const p of params.reductionProjects.filter(p => p.enabled)) {
      initialCostBasis += p.upfrontCost || 0;
    }
  }

  let loanPrincipal = 0;
  let annualLoanPayment = 0;
  
  if (params.isFinanced) {
    loanPrincipal = Math.max(0, initialCostBasis - params.downPayment);
    totalUpfrontCost = Math.min(initialCostBasis, params.downPayment);
    const monthlyInterestRate = (params.loanInterestRate / 100) / 12;
    const numPayments = params.loanTermYears * 12;
    
    if (params.loanTermYears > 0) {
      if (monthlyInterestRate > 0) {
        const mPayment = loanPrincipal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numPayments)) / (Math.pow(1 + monthlyInterestRate, numPayments) - 1);
        annualLoanPayment = mPayment * 12;
      } else {
        annualLoanPayment = loanPrincipal / params.loanTermYears;
      }
    }
  } else {
    totalUpfrontCost = initialCostBasis;
  }

  let currentCumulativeCost = totalUpfrontCost;
  let currentLoanBalance = loanPrincipal;

  let totalSavings = 0;
  const chartData: YearlyData[] = [];
  let paybackPeriod = -1;
  let breakevenFound = false;
  let initialAnnualSavings = 0;
  let year25NetProfit = 0;
  let totalCostAtYear25 = totalUpfrontCost;

  // 5. Extended Projection Loop (up to 200 years to find break-even)
  for (let year = 1; year <= 200; year++) {
    const yr = simulateYear(year);
    // Financials for this year
    const billWithoutSolar = yr.yrBillWithoutSolar;
    const billWithSolar = yr.yrBillWithSolar;
    
    const annualBenefit = billWithoutSolar - billWithSolar;
    if (params.hasMaintenance) {
      currentCumulativeCost += params.annualMaintenanceCost;
    }
    
    let loanPaymentThisYear = 0;
    if (params.isFinanced && currentLoanBalance > 0) {
      const monthlyInterestRate = (params.loanInterestRate / 100) / 12;
      for (let m = 0; m < 12; m++) {
        if (currentLoanBalance <= 0) break;
        let interest = currentLoanBalance * monthlyInterestRate;
        let pmt = annualLoanPayment / 12;
        let principalPaid = pmt - interest;
        if (principalPaid > currentLoanBalance) {
           pmt = currentLoanBalance + interest;
           principalPaid = currentLoanBalance;
        }
        currentLoanBalance -= principalPaid;
        loanPaymentThisYear += pmt;
      }
      
      if (params.lumpSumPayments) {
        for (const lump of params.lumpSumPayments) {
          if (lump.enabled !== false && lump.year === year && currentLoanBalance > 0) {
             let paymentAmt = lump.amount;
             if (paymentAmt > currentLoanBalance) paymentAmt = currentLoanBalance;
             currentLoanBalance -= paymentAmt;
             loanPaymentThisYear += paymentAmt;
          }
        }
      }
    }
    
    currentCumulativeCost += loanPaymentThisYear;
    
    if (year === 2 && params.hasIncentives) {
       currentCumulativeCost -= totalIncentives;
    }
    
    if (year === 1) {
       initialAnnualSavings = annualBenefit;
    }

    totalSavings += annualBenefit;

    if (year <= 25) {
      chartData.push({
        year,
        cumulativeSavings: totalSavings,
        netCost: currentCumulativeCost,
        annualSavings: annualBenefit,
      });
    }

    if (year === 25) {
      year25NetProfit = totalSavings - currentCumulativeCost;
      totalCostAtYear25 = currentCumulativeCost;
    }

    if (totalSavings >= currentCumulativeCost) {
      if (!breakevenFound) {
        const M = params.hasMaintenance ? params.annualMaintenanceCost : 0;
        const L = loanPaymentThisYear;
        const previousTotal = totalSavings - annualBenefit;
        let previousCost = currentCumulativeCost - M - L;
        if (year === 2 && params.hasIncentives) {
           previousCost += totalIncentives;
        }
        const shortfall = previousCost - previousTotal;
        const netAnnualGain = annualBenefit - M - L; // The rate at which savings catch up to cost
        
        let fractionOfYear = 0;
        if (netAnnualGain > 0) {
          fractionOfYear = shortfall / netAnnualGain;
        }
        if (netAnnualGain <= 0 || fractionOfYear < 0) {
           fractionOfYear = 0;
        }
        paybackPeriod = (year - 1) + fractionOfYear;
        breakevenFound = true;
      }
    } else {
      // It dipped back below costs, so reset break-even search
      breakevenFound = false;
      paybackPeriod = -1;
    }

    // Rate increases for next year
    currentUtilityRate = currentUtilityRate * (1 + params.annualBillIncrease / 100);

    // Stop if we found breakeven and have simulated a minimum lifetime (e.g., 30 years)
    if (year >= 30 && breakevenFound) {
      break;
    }
    
    // Stop if there is a hopeless loss (e.g. annual benefit is less than maintenance) and we are past year 30
    if (year > 30 && annualBenefit < (params.hasMaintenance ? params.annualMaintenanceCost : 0)) {
        break; // Never breaks even
    }
  }

  // Cap the percentage realistically avoiding infinity
  const roiPercentage = totalCostAtYear25 > 0 ? (year25NetProfit / totalCostAtYear25) * 100 : (year25NetProfit / 1) * 100;

  const B = params.hasBattery ? params.batteryCapacityKwh : 0;
  const G = annualGeneration / 365;
  const normalUsage = annualUsage / 365;

  const scenarios = [
    { name: 'Normal Ops', usageKwH: normalUsage, description: 'Business as usual', hoursPerDay: 0 },
    { name: 'Half Capacity', usageKwH: Math.max(10, normalUsage * 0.5), description: 'Conscious usage reduction', hoursPerDay: 0 },
    { name: 'Quarter Capacity', usageKwH: Math.max(5, normalUsage * 0.25), description: 'Aggressive usage reduction', hoursPerDay: 0 },
    { name: 'Essentials Only', usageKwH: 6.0, description: 'Doors, Cameras, Basics', hoursPerDay: 0 },
  ];

  const outageScenarios = scenarios.map(s => {
    let hoursPerDay = 0;
    let surplusKwHPerDay = 0;
    if (B > 0) {
      const maxHoursGen = (G / s.usageKwH) * 24;
      const maxHoursBatt = B / (s.usageKwH * 0.6) * 24;
      
      hoursPerDay = Math.min(24, maxHoursGen, maxHoursBatt);

      if (hoursPerDay === 24) {
        surplusKwHPerDay = Math.max(0, G - s.usageKwH);
      } else if (maxHoursBatt < maxHoursGen) {
        // Limited by battery, but extra sun is available during day
        surplusKwHPerDay = Math.max(0, G - (s.usageKwH * (hoursPerDay / 24)));
      }
    }
    return {
      name: s.name,
      usageKwH: s.usageKwH,
      description: s.description,
      hoursPerDay,
      surplusKwHPerDay
    };
  });

  const cellPhoneCharges = B > 0 ? Math.floor(B / 0.015) : 0; // 1 phone = 15Wh

  const currentRenewableKwh = annualUsage * ((params.gridRenewablePercentage || 0) / 100);
  
  let totalNetSolarConsumed = 0;
  let totalNetGridRenewable = 0;
  for (const m of yr1.monthlyEnergy) {
    totalNetSolarConsumed += m.solarConsumed;
    totalNetGridRenewable += m.gridRenewable;
  }
  
  const newRenewableKwh = totalNetSolarConsumed + totalNetGridRenewable;
  const newRenewablePercent = annualUsage > 0 ? (newRenewableKwh / annualUsage) * 100 : (params.gridRenewablePercentage || 0);
  
  const oldNonRenewableKwh = annualUsage - currentRenewableKwh;
  const newNonRenewableKwh = annualUsage - newRenewableKwh;
  const kwhSaved = Math.max(0, oldNonRenewableKwh - newNonRenewableKwh);
  const co2SavedTonsPerYear = kwhSaved * 0.00043; // ~0.43 metric tons per MWh

  return {
    systemCost: grossCost,
    systemSizeKW,
    annualGeneration,
    annualUsage,
    annualGridSales: yr1GridSales,
    annualGridPurchase: yr1GridPurchase,
    annualBatteryDraw: yr1BatteryDraw,
    systemOffset,
    netCost: netCost,
    yearOneSavings: initialAnnualSavings,
    total25YearSavings: year25NetProfit,
    roiPercentage,
    paybackPeriod: breakevenFound ? paybackPeriod : -1,
    chartData,
    monthlyEnergyData: yr1.monthlyEnergy,
    outageResilience: {
      scenarios: outageScenarios,
      cellPhoneCharges
    },
    co2Impact: {
      currentRenewablePercent: params.gridRenewablePercentage || 0,
      newRenewablePercent,
      co2SavedTonsPerYear
    },
    effectiveUtilityRate: active.rate,
    effectiveUtilityRateProfile: active.rateProfile,
    effectiveMonthlyUsageKwh: active.flatUsage,
    effectiveMonthlyUsageProfile: active.profile
  };
}

export function generateSensitivityData(params: SolarParams, variable: SensitivityVariable): SensitivityData[] {
  const results: SensitivityData[] = [];
  
  let effectiveCostPerWatt = 3.0; // default fallback
  if (params.inputMode === 'detailed') {
    effectiveCostPerWatt = params.costPerWatt;
  } else {
    if (params.totalSystemSizeKw > 0) {
      effectiveCostPerWatt = params.totalGrossCost / (params.totalSystemSizeKw * 1000);
    }
  }

  const generateStep = (
    min: number, 
    max: number, 
    steps: number, 
    updater: (val: number, modifiedParams: SolarParams) => void
  ) => {
    const stepSize = (max - min) / steps;
    for (let i = 0; i <= steps; i++) {
        const val = min + i * stepSize;
        const modifiedParams = { ...params };
        
        updater(val, modifiedParams);
        const res = calculateRoi(modifiedParams);
        
        results.push({
          xValue: val,
          netCost: res.netCost,
          netProfit: res.total25YearSavings,
          paybackPeriod: res.paybackPeriod > 0 ? res.paybackPeriod : 30 // Cap at 30 for visualization
        });
    }
  };

  if (variable === 'systemSize') {
    const v = params.totalSystemSizeKw;
    generateStep(Math.min(2, v * 0.5), Math.max(30, v * 1.5), 28, (val, p) => {
        p.inputMode = 'total';
        p.totalSystemSizeKw = val;
        p.totalGrossCost = val * 1000 * effectiveCostPerWatt;
    });
  } else if (variable === 'battery') {
    const v = params.batteryCapacityKwh;
    generateStep(0, Math.max(40, v * 1.5), 20, (val, p) => {
        p.batteryCapacityKwh = val;
    });
  } else if (variable === 'interestRate') {
    generateStep(0, 20, 40, (val, p) => {
        p.isFinanced = true;
        p.loanInterestRate = val;
    });
  } else if (variable === 'downPayment') {
    // Generate up to typical system cost
    const maxDown = params.totalSystemSizeKw * 1000 * effectiveCostPerWatt;
    generateStep(0, maxDown, 20, (val, p) => {
        p.isFinanced = true;
        p.downPayment = val;
    });
  } else if (variable === 'loanTerm') {
    generateStep(1, 30, 29, (val, p) => {
        p.isFinanced = true;
        p.loanTermYears = Math.round(val);
    });
  }

  // Calculate profit slope (derivative)
  for (let i = 0; i < results.length; i++) {
    if (i === 0) {
      const dx = results[i + 1].xValue - results[i].xValue;
      const dy = results[i + 1].netProfit - results[i].netProfit;
      results[i].profitSlope = dy / dx;
    } else if (i === results.length - 1) {
      const dx = results[i].xValue - results[i - 1].xValue;
      const dy = results[i].netProfit - results[i - 1].netProfit;
      results[i].profitSlope = dy / dx;
    } else {
      // Central difference for interior points
      const dx = results[i + 1].xValue - results[i - 1].xValue;
      const dy = results[i + 1].netProfit - results[i - 1].netProfit;
      results[i].profitSlope = dy / dx;
    }
  }
  
  return results;
}

export function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function calculateReductionKwh(project: any, baseAnnualKwh: number): number {
  if (project.calculationMethod === 'fixtures') {
    const wBefore = project.wattsBefore || 0;
    const wAfter = project.wattsAfter || 0;
    const qty = project.quantity || 0;
    const hours = project.hoursPerDay || 0;
    return Math.max(0, (wBefore - wAfter) * qty * hours * 365 / 1000);
  }
  if (project.calculationMethod === 'kwh_reduction') {
    return Math.max(0, (project.kwhReductionPerMonth || 0) * 12);
  }
  if (project.calculationMethod === 'usage_before_after') {
    return Math.max(0, ((project.kwhBefore || 0) - (project.kwhAfter || 0)) * 12);
  }
  if (project.calculationMethod === 'thermostat') {
    return Math.max(0, (project.degreeDecrease || 0) * (project.kwhSavingsPerDegree || 0) * 12);
  }
  return baseAnnualKwh * (Math.max(0, Math.min(100, project.percentageReduction || 0)) / 100);
}
