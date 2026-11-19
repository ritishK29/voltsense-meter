import { useState } from 'react';
import { Zap, Power, Trash2, Clock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function ElectricView() {
  const { user, dashboardData, telemetry, fetchDashboard } = useAuth();
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'TOGGLE' | 'DELETE', dev }

  if (!dashboardData) return null;

  const { electricity, devices } = dashboardData.analytics;
  const electricDevices = devices.filter((d) => d.utilityType === 'ELECTRICITY');
  const liveWatts = Math.round(electricity.activeLoadWatts * telemetry.fluctuationFactor);
  const liveAmps = Number((liveWatts / (telemetry.voltage * telemetry.powerFactor)).toFixed(2));
  const dailySafeBudget = Math.round(((user?.monthlyBudget || 5000) * 0.7) / 30);

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'TOGGLE') {
      await API.patch(`/utility/devices/${confirmAction.dev._id}/toggle`);
    } else {
      await API.delete(`/utility/devices/${confirmAction.dev._id}`);
    }
    setConfirmAction(null);
    fetchDashboard();
  };

  return (
    <div className="space-y-6">
      {/* Digital Smart Electric Meter Display */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
              AMI METER ID: {user?.meterId}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">Single-Phase Digital Smart Meter</h3>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            {electricity.currentSlab}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl font-mono">
          <div>
            <p className="text-[10px] text-slate-400">LIVE POWER DRAW</p>
            <p className="text-xl sm:text-2xl font-black text-sky-400">{liveWatts} W</p>
            <p className="text-[10px] text-slate-400">{liveAmps} A @ {telemetry.voltage}V</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">BILLED SO FAR</p>
            <p className="text-xl sm:text-2xl font-black text-white">Rs {electricity.accruedBill}</p>
            <p className="text-[10px] text-slate-400">{electricity.accruedKwh} kWh used</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">SAFE DAILY LIMIT</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">Rs {dailySafeBudget}/day</p>
            <p className="text-[10px] text-slate-400">Target allowance</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">MONTH-END FORECAST</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400">Rs {electricity.predictedBill}</p>
            <p className="text-[10px] text-slate-400">{electricity.monthlyUnits} kWh est.</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-sky-50 border border-sky-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-sky-900">
            <Sparkles size={16} className="text-sky-600" /> AI ENERGY COACH — HOW TO SAVE ON THIS BILL:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium">
            <p className="flex items-start gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>Set AC to <strong>24°C instead of 18°C</strong> to reduce compressor runtime by 22% (Saves ~Rs 420/mo).</span>
            </p>
            <p className="flex items-start gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>Avoid heavy loads during <strong>6 PM – 10 PM Peak Hours</strong> (Saves Rs {electricity.potentialToDSavings}/mo).</span>
            </p>
          </div>
        </div>
      </div>

      {/* Paired Smart Plugs */}
      <div>
        <h4 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Zap size={16} className="text-sky-600" /> Paired Smart Plugs & Appliances ({electricDevices.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {electricDevices.map((dev) => {
            const remainingCycleSavings = Math.round(dev.monthlyCost * 0.4);
            return (
              <div
                key={dev._id}
                className={`p-4 rounded-2xl border bg-white transition shadow-xs ${
                  dev.isActive ? 'border-sky-300' : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{dev.room}</span>
                    <h5 className="font-extrabold text-slate-900 text-sm">{dev.name}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dev.ratingValue}W • {dev.hoursPerDay} hrs/day •{' '}
                      <span className="text-sky-700 font-bold">{dev.monthlyUnits} kWh/mo</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setConfirmAction({ type: 'TOGGLE', dev, remainingCycleSavings })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition ${
                        dev.isActive ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Power size={13} /> {dev.isActive ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'DELETE', dev, remainingCycleSavings })}
                      title="Unpair Smart Plug"
                      className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Clock size={12} /> {dev.isActive ? `Drawing ${dev.ratingValue}W live` : 'Relay OFF (0W)'}
                  </span>
                  <span className="font-extrabold text-slate-900">~Rs {dev.monthlyCost}/mo ({dev.costSharePercent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Interactive Confirmation Modal for Power OFF & Unpair Savings */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-2xl ${confirmAction.type === 'DELETE' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>
                <AlertCircle size={22} />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">
                {confirmAction.type === 'TOGGLE'
                  ? `${confirmAction.dev.isActive ? 'Turn OFF' : 'Turn ON'} ${confirmAction.dev.name}?`
                  : `Unpair ${confirmAction.dev.name}?`}
              </h4>
            </div>

            {confirmAction.type === 'TOGGLE' ? (
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmAction.dev.isActive
                  ? `Smart relay will cut ${confirmAction.dev.ratingValue}W live power immediately. Your already billed Rs ${electricity.accruedBill} stays unchanged, and you save ~Rs ${Math.round((confirmAction.dev.ratingValue / 1000) * 8)}/hr.`
                  : `Smart relay will restore power (+${confirmAction.dev.ratingValue}W) to ${confirmAction.dev.name}.`}
              </p>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <p>• Past billed usage (<strong>Rs {electricity.accruedBill}</strong>) will <strong>NOT</strong> decrease because that electricity was already consumed.</p>
                <p className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                  ✓ Disconnecting this load will cut ~Rs {confirmAction.remainingCycleSavings} from your remaining month-end forecast!
                </p>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className={`flex-1 py-2.5 rounded-xl text-white font-extrabold text-xs ${
                  confirmAction.type === 'DELETE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {confirmAction.type === 'TOGGLE' ? 'Confirm Switch' : 'Confirm Unpair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
