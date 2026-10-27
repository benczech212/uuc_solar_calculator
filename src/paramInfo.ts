// What each input means and why its default was picked. Shown in the (i) tooltips
// next to each input. Researched October 2026 for a Clearwater, FL congregation on
// Duke Energy Florida. Update the text here when a default changes.

export interface ParamInfo {
  what: string;
  why: string;
  sources?: { label: string; url: string }[];
}

const S = {
  uucBills: { label: "UUC's own bills, Mar 2024 to Feb 2026 (Bills screen)", url: '' },
  quotes: { label: 'Vendor quotes in step 1', url: '' },
  energySage: { label: 'EnergySage: solar cost in Florida', url: 'https://www.energysage.com/local-data/solar-panel-cost/fl/' },
  solarReviews: { label: 'SolarReviews: solar cost in Florida', url: 'https://www.solarreviews.com/solar-panel-cost/florida' },
  pvwatts: { label: 'NREL PVWatts calculator', url: 'https://pvwatts.nrel.gov/' },
  nrelLifetime: { label: 'NREL PV lifetime and degradation', url: 'https://www.nrel.gov/pv/lifetime.html' },
  irsElective: { label: 'IRS: elective pay for tax-exempt organizations', url: 'https://www.irs.gov/credits-deductions/elective-pay-and-transferability' },
  claItc: { label: 'CLA: nonprofit energy credits and deadlines', url: 'https://www.claconnect.com/en/resources/articles/26/nonprofit-energy-tax-credits' },
  dukeRates: { label: 'WUSF: Duke Energy Florida rate settlement (2025-2027)', url: 'https://wusf.org/economy-business/2024-08-22/florida-commission-approves-duke-energy-settlement-increase-base-electric-rates' },
  netMetering: { label: 'EnergyBot: net metering in Florida', url: 'https://www.energybot.com/incentives/florida/net-metering-2880.html' },
  eia: { label: 'EIA: Florida state energy profile', url: 'https://www.eia.gov/state/?sid=FL' },
  flPhoenix: { label: 'Florida Phoenix: 8% of Florida power is renewable (2026)', url: 'https://floridaphoenix.com/2026/09/30/byron-donalds-says-solar-power-is-a-fad-but-florida-utilities-are-expanding-its-use/' },
  egrid: { label: 'EPA eGRID summary data', url: 'https://www.epa.gov/egrid/summary-data' },
  epaEquiv: { label: 'EPA Greenhouse Gas Equivalencies Calculator', url: 'https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator' },
  omCost: { label: 'PV Tech: NREL O&M cost trend ($17/kW/yr in 2019)', url: 'https://www.pv-tech.org/guest-blog/quality-time-for-solar-pv-part-i' },
  self: { label: 'Solar and Energy Loan Fund (SELF)', url: 'https://www.stpete.org/SELF' },
};

export const PARAM_INFO: Record<string, ParamInfo> = {
  quotes: {
    what: 'Real proposals UUC received. Picking one fills in the system size and total price.',
    why: 'These are the actual bids, so they are the best starting point. Each shows its price per watt for comparison.',
  },
  panelWattage: {
    what: 'The rated power of one solar panel, in watts.',
    why: '400 W is a conservative figure for a roof-mounted panel. Home-size panels sold in 2026 run about 420 to 480 W and commercial ones 500 W or more. It only matters together with the panel count: size = wattage × panels.',
  },
  numberOfPanels: {
    what: 'How many panels go on the roof.',
    why: '110 panels × 400 W = 44 kW, a system that covers a large share of UUC’s use. The vendor quotes are larger (about 76 kW); pick one in step 1 to model it.',
    sources: [S.quotes],
  },
  costPerWatt: {
    what: 'The total installed price divided by the system’s watts, before any tax credit. It includes panels, inverters, wiring, labor and permits.',
    why: '$2.39/W is the lowest of the three quotes UUC received ($2.39 to $2.90). Florida averages in 2026 run about $2.10 to $2.70/W, mostly for homes.',
    sources: [S.quotes, S.energySage, S.solarReviews],
  },
  totalSystemSizeKw: {
    what: 'The system’s total panel capacity in kilowatts (DC).',
    why: 'Filled in from a vendor quote, or set your own.',
  },
  totalGrossCost: {
    what: 'The full installed price before tax credits or rebates.',
    why: 'Filled in from a vendor quote, or set your own.',
  },
  usageMode: {
    what: 'How electricity use is entered: one number for every month, a value for each month, or worked out from uploaded bills.',
    why: '"Month by month" is the default because UUC’s use swings a lot with air conditioning, from about 5,000 kWh in winter to over 12,000 kWh in summer.',
    sources: [S.uucBills],
  },
  monthlyUsageKwh: {
    what: 'Average electricity use per month, in kWh.',
    why: 'Used only when "Same every month" is picked. UUC’s bills average about 8,300 kWh a month.',
    sources: [S.uucBills],
  },
  monthlyUsageProfile: {
    what: 'Electricity use for each month of the year, in kWh.',
    why: 'Pre-filled with a 12-month profile in line with UUC’s bill history (about 5,000 to 14,000 kWh), so summer and winter are modelled separately. Edit any month, or switch to "From bills" to use the bills directly.',
    sources: [S.uucBills],
  },
  utilityRate: {
    what: 'The all-in price per kWh: total bill ÷ kWh used, including fuel, fees and taxes, not just the base energy charge.',
    why: '$0.20/kWh is the average of UUC’s 24 Duke Energy bills (range $0.18 to $0.27). The old default of $0.16 understated savings.',
    sources: [S.uucBills],
  },
  linkSellBack: {
    what: 'When on, extra solar sent to the grid is credited at the same rate you pay.',
    why: 'Duke Energy Florida uses 1-to-1 net metering: monthly excess is credited at the retail rate and carried forward. Credits left over at the end of the year are paid out at a much lower "as-available" rate (a few cents per kWh). So a system that makes more than UUC uses in a year earns less than this shows for that surplus.',
    sources: [S.netMetering],
  },
  sellBackRate: {
    what: 'What each kWh sent back to the grid is worth.',
    why: 'Matches the retail rate under net metering. Turn the link off and lower it to model year-end surplus paid at the as-available rate.',
    sources: [S.netMetering],
  },
  annualBillIncrease: {
    what: 'How much electricity prices rise each year, on average.',
    why: '3% a year. Duke’s approved base-rate increases for 2025 to 2027 work out to about 2% a year, but fuel and storm charges move bills up and down. Over 25 years, 2% to 3% is a common planning range. Higher values make solar look better.',
    sources: [S.dukeRates],
  },
  gridRenewablePercentage: {
    what: 'The share of grid electricity from renewable sources. Used for the energy-mix and carbon numbers only, not the money.',
    why: '10%. Florida’s grid is mostly natural gas (about 73%). Renewables, almost all solar, were about 8% to 9% of generation in 2025, or about 12% counting rooftop solar. The old default of 80% overstated how clean the grid is.',
    sources: [S.eia, S.flPhoenix],
  },
  federalTaxCreditPercent: {
    what: 'The federal clean-energy credit (Section 48E) as a share of the system cost. Nonprofits receive it as a direct payment from the IRS ("elective pay").',
    why: '30% is the base rate. Under the 2025 federal law, a project that started construction after July 4, 2026 must be in service by December 31, 2027 to qualify. Confirm the timeline with the installer and a tax advisor; if it slips, set this to 0%.',
    sources: [S.irsElective, S.claItc],
  },
  stateRebateAmount: {
    what: 'Any one-time state, county or utility rebate, in dollars.',
    why: 'Florida has no statewide solar rebate program, so the default is $0. Add any grant UUC wins here.',
  },
  downPayment: {
    what: 'Cash paid up front; the rest is borrowed.',
    why: 'Starts at $0 to show a fully financed system. Raise it to reflect money UUC can put in from reserves or a capital campaign.',
  },
  loanTermYears: {
    what: 'How many years the loan runs.',
    why: '10 years is a typical term for nonprofit and green-bank solar loans.',
    sources: [S.self],
  },
  loanInterestRate: {
    what: 'The loan’s yearly interest rate.',
    why: '7%. Florida green lenders such as SELF have quoted about 5% to 9.5%. Get a real quote before deciding.',
    sources: [S.self],
  },
  lumpSums: {
    what: 'Extra one-time payments toward the loan, such as the tax-credit payment or a fundraising drive.',
    why: 'None by default. A common plan is to put the tax-credit payment toward the loan in year 1 or 2.',
  },
  batteryCapacityKwh: {
    what: 'How much energy the battery can store, in kWh.',
    why: 'Off by default. Under 1-to-1 net metering a battery rarely saves money; its value is backup power during outages.',
  },
  batteryCostPerKwh: {
    what: 'Installed battery price per kWh of storage.',
    why: '$400/kWh. Vendor estimates for small commercial batteries in 2026 run about $280 to $580/kWh installed. Treat this as a placeholder until there is a quote.',
  },
  annualMaintenanceCost: {
    what: 'Yearly upkeep: inspections, cleaning, monitoring, plus saving up for an inverter replacement around year 10 to 15.',
    why: '$750 a year, about $17 per kW for a 44 kW system, matching NREL’s estimate of typical solar upkeep. The old default of $150 was too low. Off by default because many installers include early-year service in the price.',
    sources: [S.omCost],
  },
  solarEfficiency: {
    what: 'Scales expected output up or down. 100% is a typical well-placed system.',
    why: 'Use it for shade from trees or nearby buildings, a roof that does not face south, or aging. Panels lose about 0.5% to 0.75% of output a year, so about 90% is a fair 25-year average.',
    sources: [S.nrelLifetime],
  },
  seasonal: {
    what: 'Spreads production across the year: more in spring and summer, less in winter.',
    why: 'On by default because Florida output really does vary by season, which matters when it is matched against UUC’s monthly use.',
    sources: [S.pvwatts],
  },
  solarYield: {
    what: 'Fixed in the model: each kW of panels makes 1,500 kWh a year before adjustments.',
    why: 'NREL’s PVWatts gives about 1,400 to 1,500 kWh per kW for a south-facing roof array around Tampa Bay. Run PVWatts with UUC’s address and roof angle for a site-specific figure.',
    sources: [S.pvwatts],
  },
  co2: {
    what: 'Fixed in the model: each kWh of grid power avoided saves 0.000366 metric tons of CO₂.',
    why: 'EPA’s eGRID2023 rate for Florida is 805.8 lb of CO₂ per MWh.',
    sources: [S.egrid],
  },
  homes: {
    what: 'The "homes" comparison divides CO₂ saved by 4.8 tons, the CO₂ from one average US home’s electricity in a year.',
    why: 'EPA Greenhouse Gas Equivalencies figure (2025 revision).',
    sources: [S.epaEquiv],
  },
};
