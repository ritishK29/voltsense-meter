import { LayoutDashboard, Zap, Flame, PieChart, Building2, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppShell({ activeTab, setActiveTab, onOpenAddModal, children }) {
  const { user, role, dashboardData, logout } = useAuth();
  const status = dashboardData?.analytics?.status || 'GREEN';

  const statusBadge = {
    GREEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    YELLOW: 'bg-amber-50 text-amber-700 border-amber-200',
    RED: 'bg-rose-50 text-rose-700 border-rose-200'
  }[status];

  const navItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'electric', label: 'Electric', icon: Zap },
    { id: 'gas', label: 'PNG Gas', icon: Flame },
    { id: 'analytics', label: 'Usage & PDF', icon: PieChart },
    ...(role === 'ADMIN' ? [{ id: 'admin', label: 'Grid Admin', icon: Building2 }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-600 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-md">
            VS
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900">VoltSense</h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {role === 'ADMIN' ? 'Society Grid Portal' : 'Smart Home Energy App'}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition ${
                  active
                    ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">Meter: {user?.meterId}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:pl-64 pb-24 md:pb-8">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="md:hidden w-8 h-8 rounded-xl bg-gradient-to-br from-sky-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm">
              VS
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {navItems.find((n) => n.id === activeTab)?.label || 'Home'} Dashboard
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Smart Electric ({user?.meterId}) • PNG Gas ({user?.gasMeterId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge}`}>
              ● {status} ZONE
            </span>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition shadow-xs"
            >
              <Plus size={15} /> <span>Pair Plug</span>
            </button>
            <button onClick={logout} className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-2 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                active ? 'text-sky-600 bg-sky-50' : 'text-slate-400'
              }`}
            >
              <Icon size={19} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
