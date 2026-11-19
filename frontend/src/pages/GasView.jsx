import { useState } from 'react';
import { Flame, Power, Trash2, ShieldCheck, ShieldOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function GasView() {
  const { user, dashboardData, telemetry, fetchDashboard } = useAuth();
  const [confirmAction, setConfirmAction] = useState(null);

  if (!dashboardData) return null;

  const { gas, devices } = dashboardData.analytics;
  const gasDevices = devices.filter((d) => d.utilityType === 'GAS');
  const valveOpen = user?.gasValveOpen !== false;

  const toggleValve = async () => {
    await API.patch('/utility/gas-valve');
    fetchDashboard();
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'TOGGLE') {
      if (!valveOpen) {
        alert('Main PNG Solenoid Valve is CLOSED. Open the main safety valve first.');
        setConfirmAction(null);
        return;
      }
      await API.patch(`/utility/devices/${confirmAction.dev._id}/toggle`);
    } else {
      await API.delete(`/utility/devices/${confirmAction.dev._id}`);
    }
    setConfirmAction(null);
    fetchDashboard();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              PNG GAS METER ID: {user?.gasMeterId}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">Ultrasonic Smart Gas Meter (SCM)</h3>
          </div>

          <button
            onClick={toggleValve}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition shadow-xs ${
              valveOpen
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                : 'bg-rose-600 text-white animate-pulse'
            }`}
          >
            {valveOpen ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
            {valveOpen ? 'MAIN VALVE: OPEN (Tap to Shutoff)' : 'VALVE CLOSED (Tap to Restore)'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl font-mono">
          <div>
            <p className="text-[10px] text-slate-400">LIVE GAS FLOW</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400">
              {valveOpen ? gas.activeFlowScmHr : '0.000'} <span className="text-xs">SCM/h</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">BILLED SO FAR</p>
            <p className="text-xl sm:text-2xl font-black text-white">Rs {gas.accruedBill}</p>
            <p className="text-[10px] text-slate-400">{gas.accruedScm} SCM used</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">LINE PRESSURE</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">
              {valveOpen ? telemetry.gasPressureMbar : '0.0'} <span className="text-xs">mbar</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">MONTH-END FORECAST</p>
            <p className="text-xl sm:text-2xl font-black text-sky-400">Rs {gas.predictedBill}</p>
            <p className="text-[10px] text-slate-400">{gas.monthlyScm} SCM est.</p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>PNG Efficiency Guide:</strong> Keep monthly gas below <strong>30 SCM</strong> to avoid Tier-2 rate (Rs 56/SCM). Current forecast: <strong>{gas.monthlyScm} SCM</strong>.
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Flame size={16} className="text-amber-600" /> Connected PNG Burners & Heaters ({gasDevices.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {gasDevices.map((dev) => {
            const remainingCycleSavings = Math.round(dev.monthlyCost * 0.4);
            return (
              <div
                key={dev._id}
                className={`p-4 rounded-2xl border bg-white transition shadow-xs ${
                  dev.isActive ? 'border-amber-300' : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{dev.room}</span>
                    <h5 className="font-extrabold text-slate-900 text-sm">{dev.name}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dev.ratingValue} SCM/hr • {dev.hoursPerDay} hrs/day •{' '}
                      <span className="text-amber-700 font-bold">{dev.monthlyUnits} SCM/mo</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setConfirmAction({ type: 'TOGGLE', dev, remainingCycleSavings })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition ${
                        dev.isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Power size={13} /> {dev.isActive ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'DELETE', dev, remainingCycleSavings })}
                      className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{dev.isActive ? 'Burner Active' : 'Valve Closed'}</span>
                  <span className="font-extrabold text-slate-900">~Rs {dev.monthlyCost}/mo ({dev.costSharePercent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700"><AlertCircle size={22} /></div>
              <h4 className="font-extrabold text-slate-900 text-base">
                {confirmAction.type === 'TOGGLE'
                  ? `${confirmAction.dev.isActive ? 'Shut Off' : 'Turn On'} ${confirmAction.dev.name}?`
                  : `Unpair ${confirmAction.dev.name}?`}
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              {confirmAction.type === 'TOGGLE'
                ? 'Solenoid burner valve will toggle immediately without altering your already billed Rs ' + gas.accruedBill + '.'
                : `Past billed gas (Rs ${gas.accruedBill}) stays unchanged, while removing this burner saves ~Rs ${confirmAction.remainingCycleSavings} on your remaining month forecast.`}
            </p>
            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancel
              </button>
              <button onClick={executeConfirmedAction} className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-extrabold text-xs">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
