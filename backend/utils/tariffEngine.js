const { evaluateAiInsights } = require('./aiEngine');

const calculateElectricityTariff = (units) => {
  const safeUnits = Math.max(0, Number(units) || 0);
  let amount = 0;
  let slabLabel = 'Slab 1 (0–100 kWh @ Rs 4.50/unit)';
  if (safeUnits <= 100) amount = safeUnits * 4.5;
  else if (safeUnits <= 300) { amount = 100 * 4.5 + (safeUnits - 100) * 6.5; slabLabel = 'Slab 2 (101–300 kWh @ Rs 6.50/unit)'; }
  else if (safeUnits <= 500) { amount = 100 * 4.5 + 200 * 6.5 + (safeUnits - 300) * 8.0; slabLabel = 'Slab 3 (301–500 kWh @ Rs 8.00/unit)'; }
  else { amount = 100 * 4.5 + 200 * 6.5 + 200 * 8.0 + (safeUnits - 500) * 9.5; slabLabel = 'Slab 4 (500+ kWh @ Rs 9.50/unit)'; }
  return { billAmount: Math.round(amount + 125), slabLabel };
};

const calculateGasTariff = (scm) => {
  const safeScm = Math.max(0, Number(scm) || 0);
  let amount = 0;
  let slabLabel = 'Tier 1 Domestic PNG (0–30 SCM @ Rs 48.50/SCM)';
  if (safeScm <= 30) amount = safeScm * 48.5;
  else { amount = 30 * 48.5 + (safeScm - 30) * 56.0; slabLabel = 'Tier 2 High Usage (30+ SCM @ Rs 56.00/SCM)'; }
  return { billAmount: Math.round(amount + 75), slabLabel };
};

const analyzeDualUtility = (devices, monthlyBudget = 5000, meterReading = {}) => {
  let activeElecWatts = 0, remainingElecUnits = 0, peakElecUnits = 0, activeGasScmHr = 0, remainingGasScm = 0;
  const remainingDays = Math.max(1, 30 - new Date().getDate());

  const breakdown = devices.map((dev) => {
    const isElec = dev.utilityType === 'ELECTRICITY';
    const rating = Number(dev.ratingValue) || 0;
    const hrs = Number(dev.hoursPerDay) || 0;
    if (dev.isActive) { if (isElec) activeElecWatts += rating; else activeGasScmHr += rating; }

    // Monthly projected units for breakdown & future days
    const monthlyUnits = isElec ? (rating * hrs * 30) / 1000 : rating * hrs * 30;
    const futureUnits = isElec ? (rating * hrs * remainingDays) / 1000 : rating * hrs * remainingDays;

    if (isElec) {
      remainingElecUnits += futureUnits;
      if (dev.isPeakHeavy) peakElecUnits += monthlyUnits * 0.65;
    } else {
      remainingGasScm += futureUnits;
    }

    const estCost = isElec ? monthlyUnits * 7.2 : monthlyUnits * 49.5;
    return { ...dev, monthlyUnits: Number(monthlyUnits.toFixed(1)), monthlyCost: Math.round(estCost) };
  });

  // Persistent real consumption (never drops or jumps when adding/deleting devices)
  const accruedKwh = Number((Number(meterReading.accruedKwh) || 0).toFixed(2));
  const accruedScm = Number((Number(meterReading.accruedScm) || 0).toFixed(2));

  // Month-end forecast = Already consumed + Future remaining days with current active devices
  const predictedElecUnits = accruedKwh + remainingElecUnits;
  const predictedGasScm = accruedScm + remainingGasScm;

  const elecCalc = calculateElectricityTariff(predictedElecUnits);
  const gasCalc = calculateGasTariff(predictedGasScm);
  const elecAccruedBill = calculateElectricityTariff(accruedKwh).billAmount;
  const gasAccruedBill = calculateGasTariff(accruedScm).billAmount;

  const totalPredicted = elecCalc.billAmount + gasCalc.billAmount;
  const totalAccruedBill = elecAccruedBill + gasAccruedBill;
  const savedVsPast = Math.max(240, 6890 - totalPredicted);

  const totalCostSum = breakdown.reduce((acc, d) => acc + d.monthlyCost, 0) || 1;
  const rankedBreakdown = breakdown
    .map((d) => ({ ...d, costSharePercent: Math.round((d.monthlyCost / totalCostSum) * 100) }))
    .sort((a, b) => b.monthlyCost - a.monthlyCost);

  let status = 'GREEN';
  if (totalPredicted > monthlyBudget) status = 'RED';
  else if (totalPredicted > monthlyBudget * 0.85) status = 'YELLOW';

  const history = [
    { month: 'Jun', electricBill: 4820, gasBill: 1950 },
    { month: 'Jul', electricBill: 5140, gasBill: 1890 },
    { month: 'Aug', electricBill: 4960, gasBill: 2010 },
    { month: 'Sep', electricBill: 4510, gasBill: 1820 },
    { month: 'Oct', electricBill: 4190, gasBill: 1760 },
    { month: 'Nov (Est)', electricBill: elecCalc.billAmount, gasBill: gasCalc.billAmount }
  ];

  const electricity = {
    activeLoadWatts: Math.round(activeElecWatts),
    accruedKwh,
    accruedBill: elecAccruedBill,
    monthlyUnits: Number(predictedElecUnits.toFixed(1)),
    predictedBill: elecCalc.billAmount,
    currentSlab: elecCalc.slabLabel,
    potentialToDSavings: Math.round(peakElecUnits * 1.8)
  };

  const gas = {
    activeFlowScmHr: Number(activeGasScmHr.toFixed(3)),
    accruedScm,
    accruedBill: gasAccruedBill,
    monthlyScm: Number(predictedGasScm.toFixed(1)),
    predictedBill: gasCalc.billAmount,
    currentSlab: gasCalc.slabLabel
  };

  const aiInsights = evaluateAiInsights({ history, devices: rankedBreakdown, electricity, gas });

  return {
    status,
    electricity,
    gas,
    combined: { totalAccruedBill, totalPredictedBill: totalPredicted, monthlyBudget, budgetRemaining: monthlyBudget - totalPredicted, savedVsPast },
    aiInsights,
    history,
    devices: rankedBreakdown
  };
};

module.exports = { analyzeDualUtility };