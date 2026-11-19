import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Download, PieChart } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AnalyticsReport() {
  const { user, dashboardData } = useAuth();
  if (!dashboardData) return null;

  const { analytics } = dashboardData;
  const { devices, electricity, gas, combined } = analytics;

  const chartData = {
    labels: devices.map((d) => d.name),
    datasets: [
      {
        data: devices.map((d) => d.monthlyCost),
        backgroundColor: ['#0284c7', '#f59e0b', '#10b981', '#e11d48', '#7c3aed', '#ea580c', '#0d9488'],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const downloadPdfAudit = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('VoltSense - Monthly Dual-Utility Energy Audit Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Consumer: ${user?.name} | Electric ID: ${user?.meterId} | Gas ID: ${user?.gasMeterId}`, 14, 28);
    doc.text(`Billed So Far: Rs. ${combined.totalAccruedBill} | Month-End Forecast: Rs. ${combined.totalPredictedBill}`, 14, 34);
    doc.text(`Electricity: ${electricity.monthlyUnits} kWh (Rs. ${electricity.predictedBill}) | PNG Gas: ${gas.monthlyScm} SCM (Rs. ${gas.predictedBill})`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [['Appliance / Burner', 'Utility', 'Room', 'Usage/Day', 'Monthly Units', 'Est. Cost (INR)', 'Share']],
      body: devices.map((d) => [
        d.name,
        d.utilityType,
        d.room,
        `${d.hoursPerDay} hrs`,
        `${d.monthlyUnits} ${d.utilityType === 'ELECTRICITY' ? 'kWh' : 'SCM'}`,
        `Rs. ${d.monthlyCost}`,
        `${d.costSharePercent}%`
      ])
    });
    doc.save(`VoltSense_Audit_${user?.meterId}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <PieChart size={18} className="text-sky-600" /> Appliance & Burner Cost Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Exact share of every appliance & gas burner in your bill.</p>
        </div>
        <button onClick={downloadPdfAudit} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition shadow-xs">
          <Download size={15} /> Download PDF Audit Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center shadow-xs">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Spend Distribution</h4>
          <div className="w-64 h-64">
            <Doughnut data={chartData} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#334155', font: { size: 10 } } } }, cutout: '65%' }} />
          </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Ranked Cost Breakdown</h4>
          {devices.map((dev, idx) => (
            <div key={dev._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                  <span className="font-extrabold text-sm text-slate-900">{dev.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${dev.utilityType === 'ELECTRICITY' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'}`}>
                    {dev.utilityType === 'ELECTRICITY' ? 'ELEC' : 'GAS'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{dev.room} • {dev.hoursPerDay} hrs/day • {dev.monthlyUnits} {dev.utilityType === 'ELECTRICITY' ? 'kWh' : 'SCM'}/mo</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm text-slate-900">Rs {dev.monthlyCost}</p>
                <p className="text-xs font-bold text-emerald-600">{dev.costSharePercent}% share</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
