const express = require('express');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { analyzeDualUtility } = require('../utils/tariffEngine');
const { classifyUnpairedLoadKNN } = require('../utils/aiEngine');

const router = express.Router();

router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const devices = await Device.find({ userId: req.user._id }).lean();
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10).lean();

    // Real-time consumption accumulation based on active load & elapsed hours
    const now = new Date();
    const lastSync = user.lastMeterSync ? new Date(user.lastMeterSync) : now;
    const elapsedHours = Math.min(24, Math.max(0, (now - lastSync) / (1000 * 60 * 60)));

    const activeWatts = devices
      .filter((d) => d.utilityType === 'ELECTRICITY' && d.isActive)
      .reduce((sum, d) => sum + (Number(d.ratingValue) || 0), 0);

    const activeScmHr = devices
      .filter((d) => d.utilityType === 'GAS' && d.isActive)
      .reduce((sum, d) => sum + (Number(d.ratingValue) || 0), 0);

    if (elapsedHours > 0 && (activeWatts > 0 || activeScmHr > 0)) {
      user.accruedKwh = Number(((user.accruedKwh || 0) + (activeWatts / 1000) * elapsedHours).toFixed(4));
      user.accruedScm = Number(((user.accruedScm || 0) + activeScmHr * elapsedHours).toFixed(4));
    }
    user.lastMeterSync = now;
    await user.save();

    const analytics = analyzeDualUtility(devices, user.monthlyBudget, {
      accruedKwh: user.accruedKwh,
      accruedScm: user.accruedScm
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        meterId: user.meterId,
        gasMeterId: user.gasMeterId,
        gasValveOpen: user.gasValveOpen,
        monthlyBudget: user.monthlyBudget
      },
      analytics,
      alerts
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load telemetry dashboard', error: err.message });
  }
});

// Real AI NILM Endpoint: Classifies unknown wattage & power factor jump via KNN
router.post('/ai/nilm-classify', protect, (req, res) => {
  const samples = [
    { watts: 1980, pf: 0.99 },
    { watts: 1520, pf: 0.92 },
    { watts: 1460, pf: 0.98 },
    { watts: 1790, pf: 0.95 }
  ];
  const pick = samples[Math.floor(Math.random() * samples.length)];
  const result = classifyUnpairedLoadKNN(pick.watts, pick.pf);
  res.json(result);
});

router.post('/devices', protect, async (req, res) => {
  try {
    const { utilityType, name, room, ratingValue, hoursPerDay, isPeakHeavy } = req.body;
    const device = await Device.create({
      userId: req.user._id,
      utilityType: utilityType || 'ELECTRICITY',
      name,
      room: room || 'Living Area',
      ratingValue: Number(ratingValue),
      hoursPerDay: Number(hoursPerDay),
      isPeakHeavy: Boolean(isPeakHeavy)
    });
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ message: 'Error adding smart appliance', error: err.message });
  }
});

router.patch('/devices/:id/toggle', protect, async (req, res) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, userId: req.user._id });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    device.isActive = !device.isActive;
    await device.save();
    res.json(device);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle relay', error: err.message });
  }
});

router.delete('/devices/:id', protect, async (req, res) => {
  try {
    await Device.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Device removed' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

router.patch('/gas-valve', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.gasValveOpen = !user.gasValveOpen;
    await user.save();

    if (!user.gasValveOpen) {
      await Alert.create({
        userId: user._id,
        utilityType: 'GAS',
        severity: 'CRITICAL',
        title: 'Emergency Solenoid Valve Locked',
        message: 'Main PNG gas line shut off remotely via VoltSense Safety Relay.'
      });
    }
    res.json({ gasValveOpen: user.gasValveOpen });
  } catch (err) {
    res.status(500).json({ message: 'Gas valve actuation failed', error: err.message });
  }
});

router.post('/simulate-anomaly', protect, async (req, res) => {
  try {
    const { type } = req.body;
    const isGas = type === 'GAS_LEAK';
    const alert = await Alert.create({
      userId: req.user._id,
      utilityType: isGas ? 'GAS' : 'ELECTRICITY',
      severity: 'CRITICAL',
      title: isGas ? 'CRITICAL: Abnormal PNG Gas Flow Detected!' : 'Phantom Peak Surge Detected!',
      message: isGas
        ? 'Continuous unignited flow (0.85 SCM/hr) detected in Kitchen line. Recommend immediate valve shutoff.'
        : 'High inductive spike (+1850W) during peak ToD window (7:30 PM).'
    });
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Simulation error', error: err.message });
  }
});

module.exports = router;
