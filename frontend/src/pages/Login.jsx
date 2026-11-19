import { useState } from 'react';
import { Zap, Flame, ShieldCheck, ArrowRight, Sparkles, Home, Building2 } from 'lucide-react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginSuccess } = useAuth();
  const [selectedRole, setSelectedRole] = useState('USER'); // USER | ADMIN
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password, monthlyBudget } : { email, password };
      const { data } = await API.post(endpoint, payload);
      loginSuccess(data.token, data.user, selectedRole);
    } catch (err) {
      setError(err.response?.data?.message || 'Backend server is starting up. Wait 3 seconds and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError('');
    try {
      setLoading(true);
      const demoEmail = selectedRole === 'ADMIN' ? 'admin_grid@voltsense.in' : 'ritish_home@voltsense.in';
      try {
        // First try logging into existing persistent demo account
        const { data } = await API.post('/auth/login', { email: demoEmail, password: 'password123' });
        loginSuccess(data.token, data.user, selectedRole);
      } catch {
        // Create persistent demo account if first time
        const { data } = await API.post('/auth/register', {
          name: selectedRole === 'ADMIN' ? 'Society Grid Admin (RWA)' : 'Ritish Kumar (Smart Home)',
          email: demoEmail,
          password: 'password123',
          monthlyBudget: 5000
        });
        loginSuccess(data.token, data.user, selectedRole);
      }
    } catch (err) {
      setError('Backend server is starting up on port 5000. Try again in 3 seconds.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md">
            VS
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">VoltSense</h1>
            <p className="text-xs text-slate-500 font-medium">Smart Electric & PNG Gas Manager</p>
          </div>
        </div>

        {/* Role Selector: Home Consumer vs Society Admin */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setSelectedRole('USER')}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              selectedRole === 'USER' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Home size={14} /> Home User
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              selectedRole === 'ADMIN' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Building2 size={14} /> Society Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Home / Flat Name</label>
              <input
                required
                placeholder="e.g., Ritish Kumar - Flat 402"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:bg-white outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:bg-white outline-none"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Monthly Budget (INR)</label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:bg-white outline-none"
              />
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md shadow-sky-600/20"
          >
            {loading ? 'Connecting...' : isRegister ? 'Create Account' : `Sign In as ${selectedRole === 'ADMIN' ? 'Grid Admin' : 'Home User'}`}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">OR PERSISTENT DEMO</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          disabled={loading}
          onClick={handleQuickDemo}
          className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition"
        >
          <Sparkles size={16} className="text-emerald-600" />
          Open Saved {selectedRole === 'ADMIN' ? 'Society Grid' : 'Smart Home'} Demo
        </button>

        <p className="mt-5 text-center text-xs text-slate-500">
          {isRegister ? 'Already registered?' : 'New user?'}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="ml-1.5 text-sky-600 font-bold hover:underline"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
}
