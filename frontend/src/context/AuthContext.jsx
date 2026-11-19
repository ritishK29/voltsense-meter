import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vs_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vs_token'));
  const [role, setRole] = useState(() => localStorage.getItem('vs_role') || 'USER');
  const [dashboardData, setDashboardData] = useState(null);
  const [liveTickCost, setLiveTickCost] = useState(0);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [billPaid, setBillPaid] = useState(false);
  const [walletBalance, setWalletBalance] = useState(650);
  const [telemetry, setTelemetry] = useState({
    timestamp: '--:--:--',
    voltage: 231.4,
    powerFactor: 0.98,
    frequency: 50.01,
    gasPressureMbar: 21.0,
    fluctuationFactor: 1.0
  });

  const logout = () => {
    localStorage.removeItem('vs_token');
    localStorage.removeItem('vs_user');
    localStorage.removeItem('vs_role');
    setToken(null);
    setUser(null);
    setDashboardData(null);
  };

  const fetchDashboard = async () => {
    if (!localStorage.getItem('vs_token')) return;
    try {
      const { data } = await API.get('/utility/dashboard');
      if (data?.user) {
        setDashboardData(data);
        setUser(data.user);
        localStorage.setItem('vs_user', JSON.stringify(data.user));
      }
    } catch (err) {
      // Only logout if server explicitly says 401 Unauthorized (Invalid User)
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchDashboard();

    const socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000'), { reconnection: true });
    socket.on('live_telemetry', (packet) => {
      setTelemetry(packet);
      setLiveTickCost((prev) => Number((prev + 0.003).toFixed(3)));
      setTelemetryHistory((prev) => [...prev.slice(-14), packet]);
    });

    return () => socket.disconnect();
  }, [token]);

  const loginSuccess = (newToken, userData, selectedRole = 'USER') => {
    localStorage.setItem('vs_token', newToken);
    localStorage.setItem('vs_user', JSON.stringify(userData));
    localStorage.setItem('vs_role', selectedRole);
    setToken(newToken);
    setUser(userData);
    setRole(selectedRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        dashboardData,
        telemetry,
        telemetryHistory,
        liveTickCost,
        billPaid,
        setBillPaid,
        walletBalance,
        setWalletBalance,
        fetchDashboard,
        loginSuccess,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
