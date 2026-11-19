const mongoose = require('mongoose');

const utilityDeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  utilityType: { type: String, enum: ['ELECTRICITY', 'GAS'], required: true },
  name: { type: String, required: true },
  room: { type: String, default: 'Living Area' },
  ratingValue: { type: Number, required: true },
  hoursPerDay: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  isPeakHeavy: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('UtilityDevice', utilityDeviceSchema);
