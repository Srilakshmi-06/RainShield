import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, CheckSquare, Activity, ShieldCheck, LogOut } from 'lucide-react';
import { io } from 'socket.io-client';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css'; // Reusing dashboard styles
import BACKEND_URL from '../config.js';

const socket = io(BACKEND_URL);

const AdminDash = ({ onLogout }) => {
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentClaims(data.recentActivity);
        setForecast(data.forecast || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);
  const [monitorData, setMonitorData] = useState(null);
  const [activeTriggers, setActiveTriggers] = useState([]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    window.location.href = '/';
  };

  useEffect(() => {
    socket.on('weatherUpdate', (update) => {
      setMonitorData(update);
      // Simulate tracking multiple city triggers for admin view
      if (update.conditions.riskLevel === 'High') {
        setActiveTriggers(prev => {
          const exists = prev.find(t => t.city === update.city);
          if (exists) return prev;
          return [...prev, { city: update.city, reason: update.conditions.desc || 'Heavy Rainfall', amount: '₹14,500', time: 'Just Now' }];
        });
      }
    });

    return () => {
      socket.off('weatherUpdate');
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="dashboard-container container"
      style={{ padding: '2rem' }}
    >
      <header className="dashboard-header mb-6 flex-between">
        <div>
          <h2 className="text-2xl font-black">RainShield Command Center</h2>
          <p className="text-xs text-muted uppercase tracking-widest font-bold">InsurTech Risk Management Platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="status-badge safe" style={{ border: '1px solid #3b82f6', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
            <Activity size={16} />
            <span>System Healthy</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-white hover:text-red-400 border border-white/10 hover:border-red-500/20 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel flex-row">
          <Users className="text-blue-400" size={24} />
          <div>
            <p className="text-xs text-muted uppercase font-bold">Total Workers</p>
            <h2 className="text-2xl font-black">{loading ? '...' : stats?.totalWorkers || 0}</h2>
          </div>
        </div>
        <div className="metric-card glass-panel flex-row">
          <AlertTriangle className="text-orange-400" size={24} />
          <div>
            <p className="text-xs text-muted uppercase font-bold">Total Claims</p>
            <h2 className="text-2xl font-black">{loading ? '...' : stats?.totalClaims || 0}</h2>
          </div>
        </div>
        <div className="metric-card glass-panel flex-row highlight border-emerald-500/30">
          <ShieldCheck className="text-emerald-400" size={24} />
          <div>
            <p className="text-xs text-muted uppercase font-bold">Loss Ratio</p>
            <h2 className="text-2xl font-black text-emerald-400">{loading ? '...' : (stats?.lossRatio || 0).toFixed(1)}%</h2>
          </div>
        </div>
        <div className="metric-card glass-panel flex-row">
          <Activity className="text-purple-400" size={24} />
          <div>
            <p className="text-xs text-muted uppercase font-bold">Total Payouts</p>
            <h2 className="text-2xl font-black">₹{loading ? '...' : stats?.totalPayoutAmount?.toLocaleString() || 0}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-main grid-2 mt-8">

        {/* Live Surveillance */}
        <div className="main-card glass-panel p-6">
          <div className="flex-between mb-6">
            <h3>Live City Monitor: {monitorData?.city || 'Scanning...'}</h3>
            <span className="live-badge" style={{ color: 'var(--accent)' }}>● LIVE API</span>
          </div>

          <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.8rem 0', color: 'var(--text-muted)' }}>City/Area</th>
                <th style={{ padding: '0.8rem 0', color: 'var(--text-muted)' }}>Condition</th>
                <th style={{ padding: '0.8rem 0', color: 'var(--text-muted)' }}>Rain</th>
                <th style={{ padding: '0.8rem 0', color: 'var(--text-muted)' }}>MTS+ Probability</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1rem 0' }}>{monitorData?.city || 'Mumbai Zone 4'}</td>
                <td>
                  <span className={`status-badge ${monitorData?.conditions?.riskLevel === 'High' ? 'danger' : 'safe'}`}>
                    {monitorData?.conditions?.desc || 'Clear'}
                  </span>
                </td>
                <td><strong>{monitorData?.conditions?.rainfall || '0 mm'}</strong></td>
                <td>
                   <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${monitorData?.conditions?.riskLevel === 'High' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                       <span className="text-[11px] font-bold">{monitorData?.conditions?.riskLevel === 'High' ? 'Medium (24%)' : 'Low (8%)'}</span>
                   </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Predictive Analytics: Deliverable Requirement */}
          <div className="mt-8 p-6 glass-panel border border-blue-500/20 bg-blue-500/5">
             <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
               <Activity size={14} /> Next Week's Likely Disruption Forecast
             </h4>
             <div className="flex items-end justify-between gap-2 h-24">
                {forecast.map((f, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full rounded-t-lg transition-all" 
                          style={{ 
                            height: `${(f.claims / 40) * 100}%`, 
                            background: f.color,
                            opacity: 0.6
                          }}
                        ></div>
                        <span className="text-[9px] font-black text-white/50">{f.day}</span>
                    </div>
                ))}
             </div>
             <p className="text-[9px] text-muted mt-4 italic">Al-Driven Predictive Claims Volume Modeling</p>
          </div>

          {/* New Simulation Control Panel */}
          <div className="simulation-controls mt-8 p-6 glass-panel border border-primary/20 bg-primary/5">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Emergency Simulation Controls</h4>
            <div className="grid grid-cols-2 gap-4">
              <input 
                id="sim-city"
                type="text" 
                placeholder="City (e.g. Mumbai)" 
                className="input-field text-xs bg-black/40 border-white/10" 
                defaultValue="Mumbai"
              />
              <input 
                id="sim-rain"
                type="number" 
                placeholder="Rain (mm)" 
                className="input-field text-xs bg-black/40 border-white/10"
                defaultValue="15"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  const city = document.getElementById('sim-city').value;
                  const rain = document.getElementById('sim-rain').value;
                  try {
                    const res = await fetch(`${BACKEND_URL}/api/simulate/weather`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ city, rainfall: parseFloat(rain), riskLevel: 'High' })
                    });
                    if (res.ok) alert(`Risk Event Injected!`);
                  } catch (e) { console.error(e); }
                }}
                className="btn btn-primary flex-1 text-[10px] uppercase font-black"
                style={{ padding: '0.75rem' }}
              >
                Inject Risk
              </button>
              <button 
                onClick={async () => {
                  const city = document.getElementById('sim-city').value;
                  try {
                    await fetch(`${BACKEND_URL}/api/simulate/weather`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ city, rainfall: 0, description: 'Clear Skies', riskLevel: 'Normal' })
                    });
                    alert(`Simulation Cleared for ${city}`);
                  } catch (e) { console.error(e); }
                }}
                className="btn btn-secondary flex-1 text-[10px] uppercase font-black"
                style={{ padding: '0.75rem' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="main-card glass-panel p-6">
          <div className="flex-between mb-2">
             <h3>Live Payout Feed</h3>
             <span className="text-[10px] text-primary font-bold">SECURED BY MTS+</span>
          </div>
            <div className="feed-items mt-6">
              {recentClaims.map((claim, idx) => (
                <div key={idx} className="timeline-item">
                  <div className={`timeline-icon ${claim.status === 'Processed' ? 'bg-green' : 'bg-red'}`}>
                    {claim.status === 'Processed' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="timeline-content">
                    <h4 className="text-sm font-bold">{claim.userId?.name || 'Unknown Worker'}</h4>
                    <p className="text-xs text-soft">{claim.description || 'Rainfall Claim'}</p>
                    <div className="flex-between mt-1">
                       <span className={`status-pill ${claim.status.toLowerCase()}`}>{claim.status}</span>
                       <span className="text-[10px] font-black text-primary">₹{claim.amount}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentClaims.length === 0 && <p className="text-center text-muted text-xs p-4">No recent activity detected.</p>}
            </div>
        </div>

        {/* Loss Ratio Analytics Chart */}
        <div className="main-card glass-panel p-6 lg:col-span-2">
          <div className="flex-between mb-6">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter">System Solvency Analytics</h3>
              <p className="text-[10px] text-muted font-bold">Premium Revenue vs Payout Expenditure (Daily)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-[10px] font-bold">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="text-[10px] font-bold">Payouts</span>
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: 200 }}>
             <ResponsiveContainer>
                <AreaChart data={[
                  { day: 'Mon', revenue: 4000, payouts: 1200 },
                  { day: 'Tue', revenue: 3000, payouts: 800 },
                  { day: 'Wed', revenue: 2000, payouts: 1500 },
                  { day: 'Thu', revenue: 2780, payouts: 600 },
                  { day: 'Fri', revenue: 1890, payouts: 2100 },
                  { day: 'Sat', revenue: 2390, payouts: 800 },
                  { day: 'Sun', revenue: 3490, payouts: 400 },
                ]}>
                   <XAxis dataKey="day" stroke="rgba(255,255,255,0.1)" fontSize={10} axisLine={false} tickLine={false} />
                   <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} axisLine={false} tickLine={false} />
                   <Tooltip 
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                   />
                   <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
                   <Area type="monotone" dataKey="payouts" stroke="#f87171" fillOpacity={0.1} fill="#f87171" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default AdminDash;
