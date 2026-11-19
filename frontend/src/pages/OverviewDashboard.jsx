import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Zap, Flame, AlertTriangle, ArrowUpRight, Activity, Lock, TrendingDown, CalendarClock, CreditCard, CheckCircle2, Cpu, ShieldOff, BrainCircuit, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import API from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export default function OverviewDashboard({ onNavigate }) {
  const { user, dashboardData, telemetry, telemetryHistory, liveTickCost, walletBalance, setWalletBalance, fetchDashboard } = useAuth();
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState('BOTH');
  const [paidStatus, setPaidStatus] = useState({ elec: false, gas: false });
  const [nilmResult, setNilmResult] = useState(null);
  const [leakBanner, setLeakBanner] = useState(false);

  if (!dashboardData) {
    return <div className="text-center py-20 text-slate-500 text-sm font-medium">Syncing live smart meters & AI engine...</div>;
  }

  const { analytics } = dashboardData;
  const { electricity, gas, combined, aiInsights, history = [] } = analytics;

  const elecUsedBill = Number(((Number(electricity.accruedBill) || 2740) + liveTickCost).toFixed(2));
  const gasUsedBill = Number(gas.accruedBill) || 1345;
  const currentUsedBill = Number((elecUsedBill + gasUsedBill).toFixed(2));

  const prevMonthEntry = history.find((h) => h.month === 'Oct') || { electricBill: 4190, gasBill: 1760 };
  const lastMonthTotal = prevMonthEntry.electricBill + prevMonthEntry.gasBill;
  const budgetPercent = Math.min(100, Math.round((combined.totalPredictedBill / combined.monthlyBudget) * 100));

  const openPayModal = (target) => { setPayTarget(target); setIsPayOpen(true); };
  const handlePaySuccess = (target) => {
    if (target === 'ELEC') setPaidStatus((p) => ({ ...p, elec: true }));
    else if (target === 'GAS') setPaidStatus((p) => ({ ...p, gas: true }));
    else setPaidStatus({ elec: true, gas: true });
  };

  const triggerTestAlert = async () => {
    setLeakBanner(true);
    await API.post('/utility/simulate-anomaly', { type: 'GAS_LEAK' });
    fetchDashboard();
  };

  const emergencyShutoffValve = async () => {
    if (user?.gasValveOpen !== false) {
      await API.patch('/utility/gas-valve');
      fetchDashboard();
    }
    setLeakBanner(false);
  };

  const simulateNilmDetect = async () => {
    const { data } = await API.post('/utility/ai/nilm-classify');
    setNilmResult(data);
  };

  const acceptNilmDevice = async () => {
    const match = nilmResult.topMatch;
    await API.post('/utility/devices', {
      utilityType: 'ELECTRICITY',
      name: match.name,
      room: match.room,
      ratingValue: match.watts,
      hoursPerDay: 1.5,
      isPeakHeavy: match.isPeakHeavy
    });
    setNilmResult(null);
    fetchDashboard();
  };

  const liveWaveData = {
    labels: telemetryHistory.map((t) => t.timestamp),
    datasets: [{
      label: 'Live Active Load (Watts)',
      data: telemetryHistory.map((t) => Math.round(electricity.activeLoadWatts * t.fluctuationFactor)),
      borderColor: '#0284c7',
      backgroundColor: 'rgba(2, 132, 199, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2
    }]
  };

  const historyChartData = {
    labels: history.map((h) => h.month),
    datasets: [
      { label: 'Electricity (Rs)', data: history.map((h) => h.electricBill), backgroundColor: '#0284c7', borderRadius: 6 },
      { label: 'PNG Gas (Rs)', data: history.map((h) => h.gasBill), backgroundColor: '#f59e0b', borderRadius: 6 }
    ]
  };

  return (
    <div className="space-y-6">
      {leakBanner && (
        <div className="bg-rose-600 text-white rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm">CRITICAL: Abnormal PNG Gas Flow Detected (0.85 SCM/hr)!</h4>
              <p className="text-xs text-rose-100">Continuous unignited gas detected in Kitchen line. Shut off main solenoid valve immediately.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLeakBanner(false)} className="px-3 py-2 rounded-xl bg-rose-700 text-xs font-bold">Dismiss</button>
            <button onClick={emergencyShutoffValve} className="px-4 py-2 rounded-xl bg-white text-rose-700 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
              <ShieldOff size={15} /> Shutoff Gas Valve Now
            </button>
          </div>
        </div>
      )}

      {/* Real KNN AI NILM Classifier Prompt */}
      {nilmResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white"><Cpu size={20} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  {nilmResult.algorithm}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {nilmResult.topMatch.matchConfidence}% AI Match
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                Detected Spike: +{nilmResult.observedWatts}W (PF {nilmResult.observedPf}) → Likely "{nilmResult.topMatch.name}"
              </h4>
              <p className="text-xs text-slate-600">
                2nd Candidate: {nilmResult.runnerUp.name} ({nilmResult.runnerUp.matchConfidence}% match). Add to smart tracker?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setNilmResult(null)} className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600">
              Ignore
            </button>
            <button onClick={acceptNilmDevice} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">
              Track "{nilmResult.topMatch.name.split(' ')[0]}"
            </button>
          </div>
        </div>
      )}

      {/* Combined Summary Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
              <Activity size={13} className="animate-pulse" /> LIVE • {telemetry.timestamp}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              <CalendarClock size={13} /> Due Date: 28 Nov 2026
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={simulateNilmDetect} className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100">
              🤖 Run AI NILM Scan
            </button>
            <button onClick={triggerTestAlert} className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100">
              🔥 Test Gas Leak
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>THIS MONTH USED SO FAR</span>
              <span className="flex items-center gap-1 text-slate-700"><Lock size={12} /> Locked (Used)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">Rs {currentUsedBill}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Last Month (Oct) Total was <strong>Rs {lastMonthTotal}</strong>
            </p>
          </div>

          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-sky-800 mb-1">
              <span>THIS MONTH END ESTIMATE</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <TrendingDown size={13} /> Saving Rs {combined.savedVsPast || 440}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-sky-700">Rs {combined.totalPredictedBill.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-600 mt-1">Combined Electric + Gas projected bill</p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>WALLET: Rs {walletBalance}</span>
              {paidStatus.elec && paidStatus.gas && (
                <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 size={13} /> ALL PAID</span>
              )}
            </div>
            <button
              onClick={() => openPayModal('BOTH')}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <CreditCard size={15} /> Pay Combined / Recharge
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600">Monthly Budget Limit: Rs {combined.monthlyBudget} ({budgetPercent}%)</span>
            <span className={combined.budgetRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
              {combined.budgetRemaining >= 0 ? `Rs ${combined.budgetRemaining} Safe Margin` : `Rs ${Math.abs(combined.budgetRemaining)} Over Budget!`}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 95 ? 'bg-rose-500' : budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* LIVE AI ENGINE INSIGHTS CARD (Regression Forecast + Slab-Jump + Smart Optimizer) */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-indigo-50 via-white to-sky-50 border border-indigo-200 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white"><BrainCircuit size={18} /></div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">VoltSense AI Predictive Engine</h4>
                <p className="text-[11px] text-slate-500">{aiInsights.regression.algorithm}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold">
              Model Accuracy: {aiInsights.regression.confidencePercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/90 border border-indigo-100 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">6-MONTH REGRESSION TREND</p>
              <p className="text-base font-black text-indigo-700 mt-0.5">
                {aiInsights.regression.slopePerMonth <= 0
                  ? `-${Math.abs(aiInsights.regression.slopePerMonth)} Rs / month`
                  : `+${aiInsights.regression.slopePerMonth} Rs / month`}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">AI Blended Forecast: Rs {aiInsights.regression.blendedAiForecast}</p>
            </div>

            <div className="bg-white/90 border border-indigo-100 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">TARIFF SLAB-JUMP PREDICTION</p>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {aiInsights.slabJumpDay ? `Day ${aiInsights.slabJumpDay} of Cycle` : 'Safe in Slab 2'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Anomaly Risk Score: {aiInsights.anomalyRiskScore}/100</p>
            </div>

            <div className="bg-white/90 border border-emerald-200 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                <Sparkles size={12} /> AI OPTIMIZER ACTION
              </p>
              <p className="text-[11px] font-semibold text-slate-700 mt-1 leading-relaxed">{aiInsights.aiTip}</p>
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE ELECTRICITY & PNG GAS BILL CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-sky-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div onClick={() => onNavigate('electric')} className="cursor-pointer flex items-center gap-2.5 group">
              <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700"><Zap size={20} /></div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1 group-hover:text-sky-700">
                  Electricity Bill (PSPCL Smart Meter) <ArrowUpRight size={15} />
                </h4>
                <p className="text-[11px] text-slate-500">Live Load: {electricity.activeLoadWatts}W • {telemetry.voltage}V</p>
              </div>
            </div>
            <button
              onClick={() => openPayModal('ELEC')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                paidStatus.elec ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {paidStatus.elec ? '✓ Paid' : `Pay Rs ${elecUsedBill}`}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-sky-50/60 p-3 rounded-2xl border border-sky-100">
            <div>
              <p className="text-[10px] font-bold text-slate-500">LAST MONTH (OCT)</p>
              <p className="text-sm font-black text-slate-700">Rs {prevMonthEntry.electricBill}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-sky-700">THIS MONTH USED</p>
              <p className="text-sm font-black text-sky-900">Rs {elecUsedBill}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700">NOV END EST.</p>
              <p className="text-sm font-black text-emerald-700">Rs {electricity.predictedBill}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div onClick={() => onNavigate('gas')} className="cursor-pointer flex items-center gap-2.5 group">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700"><Flame size={20} /></div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1 group-hover:text-amber-700">
                  PNG Gas Bill (Smart Gas Meter) <ArrowUpRight size={15} />
                </h4>
                <p className="text-[11px] text-slate-500">Live Flow: {gas.activeFlowScmHr} SCM/h • {telemetry.gasPressureMbar} mbar</p>
              </div>
            </div>
            <button
              onClick={() => openPayModal('GAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                paidStatus.gas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {paidStatus.gas ? '✓ Paid' : `Pay Rs ${gasUsedBill}`}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
            <div>
              <p className="text-[10px] font-bold text-slate-500">LAST MONTH (OCT)</p>
              <p className="text-sm font-black text-slate-700">Rs {prevMonthEntry.gasBill}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-800">THIS MONTH USED</p>
              <p className="text-sm font-black text-amber-950">Rs {gasUsedBill}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700">NOV END EST.</p>
              <p className="text-sm font-black text-emerald-700">Rs {gas.predictedBill}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Power Waveform + 6-Month Past History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Real-Time Electric Meter Stream</h4>
              <p className="text-[11px] text-slate-500">Live sensor feed updating every 2 seconds</p>
            </div>
            <span className="text-xs font-mono font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">{electricity.activeLoadWatts} W Now</span>
          </div>
          <div className="h-44">
            <Line
              data={liveWaveData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { display: false } },
                  y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' }, min: 0 }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="mb-3">
            <h4 className="font-extrabold text-sm text-slate-900">6-Month Electric vs PNG Gas Comparison</h4>
            <p className="text-[11px] text-slate-500">Blue = Electricity Bill • Yellow = PNG Gas Bill</p>
          </div>
          <div className="h-44">
            <Bar
              data={historyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#334155', font: { size: 10, weight: 'bold' } } } },
                scales: {
                  x: { ticks: { color: '#475569', font: { size: 9 } }, grid: { display: false } },
                  y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } }
                }
              }}
            />
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        elecDue={elecUsedBill}
        gasDue={gasUsedBill}
        defaultTarget={payTarget}
        paidStatus={paidStatus}
        onPaySuccess={handlePaySuccess}
        walletBalance={walletBalance}
        onRechargeSuccess={(amt) => setWalletBalance((prev) => prev + amt)}
      />
    </div>
  );
}
