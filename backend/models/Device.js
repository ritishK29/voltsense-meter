const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    utilityType: { type: String, enum: ['ELECTRICITY', 'GAS'], default: 'ELECTRICITY' },
    name: { type: String, required: true },
    room: { type: String, default: 'Living Area' },
    ratingValue: { type: Number, required: true },
    hoursPerDay: { type: Number, required: true },
    isPeakHeavy: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
