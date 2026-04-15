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
          <h2>RainShield Admin Command Center</h2>
          <p>Real-time platform oversight & risk management</p>
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
        <div className="metric-card glass-panel" style={{ borderTop: '4px solid var(--primary)' }}>
          <div className="metric-icon-wrapper blue">
            <Users className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Total Workers</p>
            <h3 className="metric-value">8,452</h3>
          </div>
        </div>

        <div className="metric-card glass-panel" style={{ borderTop: '4px solid var(--accent)' }}>
          <div className="metric-icon-wrapper orange">
            <AlertTriangle className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Active Triggers</p>
            <h3 className="metric-value">{activeTriggers.length} Zones</h3>
          </div>
        </div>

        <div className="metric-card glass-panel" style={{ borderTop: '4px solid var(--secondary)' }}>
          <div className="metric-icon-wrapper green">
            <ShieldCheck className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Weekly Loss Ratio</p>
            <h3 className="metric-value">12.4%</h3>
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
                <th style={{ padding: '0.8rem 0', color: 'var(--text-muted)' }}>Fraud Prob</th>
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
                       <span className="text-[11px] font-bold">Low (8%)</span>
                   </div>
                </td>
              </tr>
              <tr style={{ opacity: 0.4 }}>
                <td style={{ padding: '1rem 0' }}>Delhi NCR</td>
                <td><span className="status-badge safe">Drizzle</span></td>
                <td><strong>2.5 mm</strong></td>
                <td>0</td>
              </tr>
              <tr style={{ opacity: 0.4 }}>
                <td style={{ padding: '1rem 0' }}>Bangalore Central</td>
                <td><span className="status-badge safe">Sunny</span></td>
                <td><strong>0 mm</strong></td>
                <td>0</td>
              </tr>
            </tbody>
          </table>

          <div className="platform-health mt-8" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
            <div className="flex-between mb-2">
              <span className="small" style={{ color: 'var(--text-muted)' }}>Platform Solvent Reserve</span>
              <span className="small">₹8.5 Cr</span>
            </div>
            <div className="payout-bar" style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
              <div className="progress" style={{ width: '85%', height: '100%', background: 'var(--primary)' }}></div>
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="main-card glass-panel p-6">
          <div className="flex-between mb-2">
             <h3>Live Payout Feed</h3>
             <span className="text-[10px] text-primary font-bold">SECURED BY MTS+</span>
          </div>
          <div className="timeline mt-6">
            {activeTriggers.length > 0 ? activeTriggers.map((t, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-icon bg-green"><ShieldCheck size={16} /></div>
                <div className="timeline-content">
                  <div className="flex-between">
                    <h4>{t.amount} Distributed</h4>
                    <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">VERIFIED</span>
                  </div>
                  <p>Trigger: {t.city} • {t.reason}</p>
                  <span className="time-text">{t.time}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 opacity-50">
                <Activity size={32} className="mb-2" />
                <p>Waiting for parametric triggers...</p>
              </div>
            )}
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
