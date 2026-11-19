const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  utilityType: { type: String, enum: ['ELECTRICITY', 'GAS', 'SYSTEM'], required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'WARNING' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  resolved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AlertLog', alertLogSchema);
