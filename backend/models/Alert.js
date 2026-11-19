const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    utilityType: { type: String, enum: ['ELECTRICITY', 'GAS'], default: 'ELECTRICITY' },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'WARNING' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isResolved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
