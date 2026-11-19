import { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AppShell from './components/AppShell';
import OverviewDashboard from './pages/OverviewDashboard';
import ElectricView from './pages/ElectricView';
import GasView from './pages/GasView';
import AnalyticsReport from './pages/AnalyticsReport';
import AdminGridView from './pages/AdminGridView';
import AddDeviceModal from './components/AddDeviceModal';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'UI Render Error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
          <div className="max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-md text-center space-y-3">
            <h2 className="font-extrabold text-rose-600 text-base">App Reset Required</h2>
            <p className="text-xs text-slate-600">{this.state.errorMsg}</p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
            >
              Reset Cache & Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function VoltSenseApp() {
  const { token, role, fetchDashboard } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (!token) return <Login />;

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenAddModal={() => setIsAddOpen(true)}
    >
      {activeTab === 'overview' && <OverviewDashboard onNavigate={setActiveTab} />}
      {activeTab === 'electric' && <ElectricView />}
      {activeTab === 'gas' && <GasView />}
      {activeTab === 'analytics' && <AnalyticsReport />}
      {activeTab === 'admin' && role === 'ADMIN' && <AdminGridView />}

      <AddDeviceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdded={fetchDashboard}
        defaultType={activeTab === 'gas' ? 'GAS' : 'ELECTRICITY'}
      />
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <VoltSenseApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
