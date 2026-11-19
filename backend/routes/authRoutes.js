const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UtilityDevice = require('../models/UtilityDevice');
const router = express.Router();

async function seedInitialDevices(userId) {
  const defaults = [
    { userId, utilityType: 'ELECTRICITY', name: '1.5 Ton Split Inverter AC', room: 'Master Bedroom', ratingValue: 1450, hoursPerDay: 6, isActive: true, isPeakHeavy: true },
    { userId, utilityType: 'ELECTRICITY', name: 'Double Door Refrigerator', room: 'Kitchen', ratingValue: 220, hoursPerDay: 24, isActive: true, isPeakHeavy: false },
    { userId, utilityType: 'ELECTRICITY', name: 'Storage Water Geyser (25L)', room: 'Bathroom', ratingValue: 2000, hoursPerDay: 1.5, isActive: false, isPeakHeavy: true },
    { userId, utilityType: 'ELECTRICITY', name: 'BLDC Ceiling Fans & LEDs', room: 'Living Room', ratingValue: 180, hoursPerDay: 12, isActive: true, isPeakHeavy: false },
    { userId, utilityType: 'GAS', name: '4-Burner PNG Kitchen Hob', room: 'Kitchen', ratingValue: 0.38, hoursPerDay: 2.5, isActive: true, isPeakHeavy: true },
    { userId, utilityType: 'GAS', name: 'Instant Gas Water Heater', room: 'Utility Area', ratingValue: 0.55, hoursPerDay: 0.8, isActive: false, isPeakHeavy: false }
  ];
  await UtilityDevice.insertMany(defaults);
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, monthlyBudget, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'consumer',
      monthlyBudget: monthlyBudget || 4500
    });

    await seedInitialDevices(user._id);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, meterId: user.meterId, gasMeterId: user.gasMeterId, monthlyBudget: user.monthlyBudget, gasValveOpen: user.gasValveOpen }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, meterId: user.meterId, gasMeterId: user.gasMeterId, monthlyBudget: user.monthlyBudget, gasValveOpen: user.gasValveOpen }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
