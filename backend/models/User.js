const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  accruedKwh: { type: Number, default: 28.5 },
accruedScm: { type: Number, default: 4.2 },
lastMeterSync: { type: Date, default: Date.now },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['consumer', 'admin'], default: 'consumer' },
  meterId: { type: String, default: () => 'VS-' + Math.floor(100000 + Math.random() * 900000) },
  gasMeterId: { type: String, default: () => 'GS-' + Math.floor(100000 + Math.random() * 900000) },
  monthlyBudget: { type: Number, default: 4500 },
  gasValveOpen: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
