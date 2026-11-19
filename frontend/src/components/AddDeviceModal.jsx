import { useState } from 'react';
import { X, Zap, Flame, PlugZap } from 'lucide-react';
import API from '../utils/api';

const PRESETS = {
  ELECTRICITY: [
    { label: '1.5 Ton Split Inverter AC (1450W)', name: '1.5T Split Inverter AC', watts: 1450, hrs: 5, peak: true },
    { label: '25L Storage Water Geyser (2000W)', name: '25L Water Geyser', watts: 2000, hrs: 1, peak: true },
    { label: 'Desert Air Cooler (200W)', name: 'Desert Air Cooler', watts: 200, hrs: 6, peak: false },
    { label: 'Front-Load Washing Machine (500W)', name: 'Washing Machine', watts: 500, hrs: 1, peak: false },
    { label: 'Double Door Refrigerator (220W)', name: 'Smart Refrigerator', watts: 220, hrs: 24, peak: false },
    { label: 'Microwave Oven / Air Fryer (1200W)', name: 'Microwave / Air Fryer', watts: 1200, hrs: 0.5, peak: true },
    { label: 'Custom Appliance (Enter Watts)', name: '', watts: '', hrs: 2, peak: false }
  ],
  GAS: [
    { label: '4-Burner PNG Kitchen Hob (0.38 SCM/hr)', name: '4-Burner Kitchen Hob', watts: 0.38, hrs: 2, peak: true },
    { label: 'Instant PNG Gas Geyser (0.55 SCM/hr)', name: 'Instant Gas Geyser', watts: 0.55, hrs: 0.8, peak: false },
    { label: 'Heavy PNG Burner (0.85 SCM/hr)', name: 'Heavy PNG Burner', watts: 0.85, hrs: 1.5, peak: true },
    { label: 'Custom Gas Burner (Enter SCM/hr)', name: '', watts: '', hrs: 1, peak: false }
  ]
};

export default function AddDeviceModal({ isOpen, onClose, onAdded, defaultType = 'ELECTRICITY' }) {
  const [utilityType, setUtilityType] = useState(defaultType);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [name, setName] = useState(PRESETS.ELECTRICITY[0].name);
  const [room, setRoom] = useState('Living Room');
  const [ratingValue, setRatingValue] = useState(PRESETS.ELECTRICITY[0].watts);
  const [hoursPerDay, setHoursPerDay] = useState(PRESETS.ELECTRICITY[0].hrs);
  const [isPeakHeavy, setIsPeakHeavy] = useState(PRESETS.ELECTRICITY[0].peak);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUtilityChange = (type) => {
    setUtilityType(type);
    setSelectedPreset(0);
    const first = PRESETS[type][0];
    setName(first.name);
    setRatingValue(first.watts);
    setHoursPerDay(first.hrs);
    setIsPeakHeavy(first.peak);
  };

  const handlePresetSelect = (idx) => {
    setSelectedPreset(idx);
    const item = PRESETS[utilityType][idx];
    setName(item.name);
    setRatingValue(item.watts);
    setHoursPerDay(item.hrs);
    setIsPeakHeavy(item.peak);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await API.post('/utility/devices', {
        utilityType,
        name,
        room,
        ratingValue: Number(ratingValue),
        hoursPerDay: Number(hoursPerDay),
        isPeakHeavy
      });
      onAdded();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error pairing smart plug');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PlugZap size={20} className="text-sky-600" />
            <h3 className="text-base font-extrabold text-slate-900">Pair Smart Plug / Gas Sensor</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        <p className="text-[11px] text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          Pick your appliance below—power rating auto-fills! Pairing tracks live usage from now onward without changing past billed usage.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => handleUtilityChange('ELECTRICITY')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
                utilityType === 'ELECTRICITY' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Zap size={15} /> Smart Electric Plug
            </button>
            <button
              type="button"
              onClick={() => handleUtilityChange('GAS')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
                utilityType === 'GAS' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Flame size={15} /> PNG Gas Sensor
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Choose Appliance Preset (Auto-Fills Specs)</label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetSelect(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-sky-500 outline-none"
            >
              {PRESETS[utilityType].map((p, idx) => (
                <option key={idx} value={idx}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Appliance Label</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Room / Location</label>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {utilityType === 'ELECTRICITY' ? 'Auto Rating (Watts)' : 'Auto Flow (SCM/hr)'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={ratingValue}
                onChange={(e) => setRatingValue(e.target.value)}
                className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-sky-800 font-extrabold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Daily Usage (Hrs/Day)</label>
              <input
                type="number"
                step="0.1"
                max="24"
                required
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          <button
            disabled={submitting}
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs sm:text-sm transition shadow-md shadow-sky-600/20"
          >
            {submitting ? 'Pairing...' : 'Pair Smart Plug & Add to Meter'}
          </button>
        </form>
      </div>
    </div>
  );
}
