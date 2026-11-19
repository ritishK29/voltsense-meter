import { useEffect, useState } from 'react';
import { Building2, Gauge, Flame, Zap } from 'lucide-react';
import API from '../utils/api';

export default function AdminGridView() {
  const [gridData, setGridData] = useState(null);

  useEffect(() => {
    API.get('/utility/admin-grid').then((res) => setGridData(res.data));
  }, []);

  if (!gridData) return <div className="text-center py-20 text-slate-500 text-sm">Loading Society Grid Telemetry...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <Building2 size={20} className="text-sky-600" />
          <h3 className="font-extrabold text-slate-900 text-base">Society / Campus Multi-Meter Grid (B2B Admin)</h3>
        </div>
        <p className="text-xs text-slate-500 mb-5">Centralized transformer load & multi-tower PNG gas monitor across {gridData.activeMeters} smart meters.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Zap size={14} className="text-sky-600" /> Total Grid Load</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{gridData.totalGridKw} kW</p>
            <p className="text-[11px] text-slate-500">Transformer Cap: {gridData.transformerCapacityKw} kW</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Gauge size={14} className="text-emerald-600" /> Transformer Utilization</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{gridData.transformerLoadPercent}%</p>
            <p className="text-[11px] text-slate-500">Balanced 3-Phase Load</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Flame size={14} className="text-amber-600" /> Community Gas Flow</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{gridData.totalGasFlowScmHr} SCM/hr</p>
            <p className="text-[11px] text-slate-500">Header Pressure Optimal</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gridData.blocks.map((b) => (
          <div key={b.block} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-900">{b.block}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${b.status === 'Healthy' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {b.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Connected Smart Meters: {b.meters}</p>
            <div className="flex justify-between text-xs pt-3 border-t border-slate-100">
              <span className="text-sky-700 font-extrabold">⚡ {b.electricKw} kW</span>
              <span className="text-amber-700 font-extrabold">🔥 {b.gasScmHr} SCM/hr</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
