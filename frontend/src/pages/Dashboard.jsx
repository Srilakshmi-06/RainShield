import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudLightning, TrendingUp, IndianRupee, Map, ShieldAlert,
  CheckCircle, Bell, History, ArrowUpRight,
  Home, ClipboardList, User as UserIcon, LogOut, Menu, X, Search, Activity, MapPin,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { io } from 'socket.io-client';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

import RiskHeatmap from '../components/RiskHeatmap';
import PolicyManager from '../components/PolicyManager';
import ClaimsManager from '../components/ClaimsManager';
import ProfileView from '../components/ProfileView';
import EarningsLog from '../components/EarningsLog';
import PayoutHistory from '../components/PayoutHistory';
import BACKEND_URL from '../config.js';

const socket = io(BACKEND_URL);

const Dashboard = ({ user, onLogout, refreshUser }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [claims, setClaims] = useState([]);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'policy', 'profile', 'earnings', 'payouts'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpiModal, setShowUpiModal] = useState(null); // { amount, txId, vpa }

  const fetchClaims = async () => {
    try {
      const phone = user?.phone || '999';
      const response = await fetch(`${BACKEND_URL}/api/monitor/claims/${phone}`);
      const result = await response.json();
      setClaims(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setClaims([]);
    }
  };

  const fetchActivity = async () => {
    try {
      const phone = user?.phone || '999';
      const response = await fetch(`${BACKEND_URL}/api/monitor/activity/${phone}`);
      const result = await response.json();
      setActivity(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setActivity([]);
    }
  };

  useEffect(() => {
    fetchActivity();
    fetchClaims();

    if (user?.city) {
      socket.emit('joinZone', user.city);
    }

    socket.on('weatherUpdate', (update) => {
      setData(update);
      setLoading(false);
      fetchActivity();
    });

    socket.on('riskAlert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('weatherUpdate');
      socket.off('riskAlert');
    };
  }, [user]);

  const handleClaim = async (riskAlert) => {
    setIsSubmittingClaim(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/monitor/submit-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id || user?.id,
          phone: user?.phone,
          type: riskAlert.type,
          description: riskAlert.message,
          amount: data?.prediction?.payoutAmount || 300,
          alertId: riskAlert.id
        })
      });
      const result = await response.json();
      if (result.success) {
        // If it was auto-approved and paid, show the simulation
        if (result.claim && result.claim.payoutStatus === 'Success') {
           setShowUpiModal({ 
             amount: result.claim.amount, 
             txId: result.claim.payoutId,
             vpa: (user?.phone || '999') + '@okaxis'
           });
           
           // Refresh wallet balance
           if (refreshUser) refreshUser();
        } else {
           alert('Claim submitted! Under AI review.');
        }
        fetchClaims();
        setAlerts(prev => prev.filter(a => a.id !== riskAlert.id));
      }
    } catch (err) {
      console.error('Claim Error:', err);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    window.location.href = '/';
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className={`sidebar-nav ${sidebarOpen ? 'open' : 'closed'} glass-panel`}>
        <div className="sidebar-brand">
          <div className="logo-box">
            <ShieldAlert className="text-primary" size={24} />
            <span className="logo-text">RainShield</span>
          </div>
        </div>

        <nav className="nav-items">
          <div className="nav-group">
            <p className="nav-label">Main Menu</p>
            <button
              className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <Home size={18} />
              <span>Overview</span>
            </button>
            <button
              className={`nav-item ${activeView === 'policy' ? 'active' : ''}`}
              onClick={() => setActiveView('policy')}
            >
              <ClipboardList size={18} />
              <span>Insurance Policy</span>
            </button>
            <button
              className={`nav-item ${activeView === 'claims' ? 'active' : ''}`}
              onClick={() => setActiveView('claims')}
            >
              <Activity size={18} />
              <span>Claims Tracker</span>
            </button>
            <button
              className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveView('profile')}
            >
              <UserIcon size={18} />
              <span>Account Profile</span>
            </button>
            <button
              className="nav-item chatbot-trigger"
              onClick={() => {
                const event = new CustomEvent('toggleChat');
                window.dispatchEvent(event);
              }}
            >
              <Activity size={18} className="text-secondary" />
              <span>AI Help Assistant</span>
            </button>
          </div>

          <div className="nav-group">
            <p className="nav-label">Reports</p>
            <button 
              className={`nav-item ${activeView === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveView('earnings')}
            >
              <Activity size={18} />
              <span>Earnings Log</span>
            </button>
            <button 
              className={`nav-item ${activeView === 'payouts' ? 'active' : ''}`}
              onClick={() => setActiveView('payouts')}
            >
              <History size={18} />
              <span>Payout History</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item collapse-toggle mb-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <div className="icon-wrapper">
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </div>
            <span>{sidebarOpen ? 'Minimize' : ''}</span>
          </button>

          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        {/* Top bar */}
        <header className="dashboard-top-bar glass-panel">
          <div className="flex items-center gap-6">
            {/* Mobile-only Menu Button */}
            <button className="sidebar-toggle md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>

            {/* Left-Aligned Information Group */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <div className="page-title">
                <h2 className="text-xl font-black">{activeView === 'overview' ? 'Protection Hub' : activeView === 'policy' ? 'Policy Desk' : activeView === 'earnings' ? 'Earnings Analytics' : activeView === 'payouts' ? 'Settlement Ledger' : 'Profile Management'}</h2>
              </div>

              {/* Weather Data moved to Left Group */}
              <div className="weather-mini flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <CloudLightning size={14} className="text-primary animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  {data?.conditions?.temp || '24°C'} • {user?.city || 'Mumbai'}
                </span>
                <MapPin size={12} className="text-muted ml-1" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 glass-panel px-6 py-2 border border-white/5">
            {/* 0. Wallet Balance (New) */}
            <div className="hidden md:flex flex-col items-end pr-6 border-r border-white/10">
              <span className="text-[9px] text-muted font-black uppercase tracking-widest mb-0.5">My Wallet</span>
              <span className="text-sm font-black text-primary">₹{(user?.walletBalance || 0).toLocaleString()}</span>
            </div>

            {/* 1. Notification Icon */}
            <div className="relative group/bell pr-6 border-r border-white/10">
              <Bell size={18} className="text-muted group-hover/bell:text-white transition-colors cursor-pointer" />
              {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>}
            </div>

            {/* 2. Username / Tier (Horizontal) */}
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveView('profile')}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-white tracking-widest group-hover:text-primary transition-colors">{user?.name || 'Worker'}</span>
                <span className="text-[9px] text-primary font-black uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">{user?.tier || 'Standard'}</span>
              </div>

              {/* 3. Profile Avatar Icon */}
              <div className="avatar-orb border-2 border-white/10 group-hover:border-primary transition-all">
                <div className="avatar-content bg-gradient-to-br from-emerald-400 to-cyan-500 w-full h-full flex items-center justify-center font-black text-[10px] text-white">
                  {user?.name?.charAt(0) || '9'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="content-inner p-8">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* 🏠 New Inline Greeting & Dynamic Status */}
                <header className="dashboard-intro mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2 leading-none">Hello, {user?.name || 'Worker'}! 👋</h2>
                    <p className="text-xs text-muted font-bold uppercase tracking-widest">
                      Real-time Monitoring for: <span className="text-primary">{user?.city || 'Mumbai'}</span> •
                      Updated <span className="text-white">Just Now</span>
                    </p>
                  </div>

                  <div className={`status-badge-premium flex items-center gap-3 px-4 py-2 rounded-xl border ${data?.conditions?.riskLevel === 'High' ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                    <div className="status-dot-pulse"></div>
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {data?.conditions?.riskLevel === 'High' ? 'CRITICAL: HIGH RISK DETECTED' : 'Status: Safe to Work'}
                    </span>
                  </div>
                </header>

                {/* Metrics Grid */}
                <div className="metrics-grid mb-8">
                  <div className="main-card glass-panel metric-card highlight">
                    <div className="metric-icon-wrapper blue"><IndianRupee size={20} /></div>
                    <div>
                      <p className="metric-label">Dynamic Premium</p>
                      <motion.h3
                        key={data?.dynamicPremium}
                        initial={{ scale: 1.1, color: '#fff' }}
                        animate={{
                          scale: 1,
                          color: (data?.dynamicPremium > 200) ? '#f87171' : (data?.dynamicPremium < 200 ? '#34d399' : '#fff')
                        }}
                        className="metric-value"
                      >
                        ₹{data?.dynamicPremium || '200'}
                      </motion.h3>
                    </div>
                    {data?.dynamicPremium > 200 && (
                      <span className="trend-up" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <ArrowUpRight size={14} /> Risk Adjustment
                      </span>
                    )}
                    {data?.dynamicPremium < 200 && (
                      <span className="trend-up" style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.1)' }}>
                        <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} /> Safe Discount
                      </span>
                    )}
                  </div>

                  <div className="main-card glass-panel metric-card">
                    <div className="metric-icon-wrapper orange"><ShieldAlert size={20} /></div>
                    <div>
                      <p className="metric-label">Hazard Status</p>
                      <h3 className="metric-value">{loading ? '...' : data?.conditions?.riskLevel}</h3>
                    </div>
                  </div>

                  <div className="main-card glass-panel metric-card">
                    <div className="metric-icon-wrapper purple"><TrendingUp size={20} /></div>
                    <div>
                      <p className="metric-label">Active Coverage</p>
                      <h3 className="metric-value">{user?.tier || 'Basic'}</h3>
                    </div>
                  </div>
                </div>

                {/* Alerts Section */}
                {alerts.length > 0 && (
                  <div className="alerts-section mb-6">
                    {alerts.map(alert => (
                      <div key={alert.id} className="alert-item glass-panel">
                        <div className="alert-content">
                          <h4>{alert.type} Alert Triggered</h4>
                          <p>{alert.message}</p>
                        </div>
                        <button className="btn-claim" onClick={() => handleClaim(alert)}>Claim Payout</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="dashboard-main-grid grid-2">
                  {/* Earnings Protection Chart */}
                  <div className="main-card glass-panel lg:col-span-2">
                    <div className="flex-between mb-6">
                      <div>
                        <h3 className="text-lg font-black">Earnings Protection Shield</h3>
                        <p className="text-[10px] text-muted font-bold uppercase">Weekly actual earnings + RainShield automatic payouts</p>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                            <span className="text-[10px] font-bold">Base Earnings</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-bold">With RainShield</span>
                         </div>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                        <AreaChart
                          data={activity.slice(0, 7).reverse().map((a, i) => ({
                            name: `Day ${i+1}`,
                            base: user?.avgDailyEarnings || 800,
                            protected: (user?.avgDailyEarnings || 800) + (a.payoutAmount || 0)
                          }))}
                        >
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="base" stroke="#475569" fill="transparent" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="protected" stroke="#10b981" fillOpacity={0.3} fill="#10b981" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Heatmap */}
                  <div className="main-card glass-panel lg:col-span-2">
                    <div className="flex-between mb-4">
                      <h3>Zone Risk Landscape</h3>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Monitoring
                      </div>
                    </div>
                    <RiskHeatmap userCity={user?.city || 'Mumbai'} />
                  </div>

                  {/* History */}
                  <div className="main-card glass-panel">
                    <div className="flex-between mb-6">
                      <h3>Risk Snapshot</h3>
                    </div>
                    <div className="timeline">
                      {activity.slice(0, 4).map((item, index) => (
                        <div key={index} className="timeline-item">
                          <div className={`timeline-icon ${item.riskLevel === 'HIGH' ? 'bg-red' : 'bg-blue'}`}>
                            <ShieldAlert size={14} />
                          </div>
                          <div className="timeline-content">
                            <p className="text-xs font-bold">{item.riskLevel} Condition</p>
                            <p className="text-[10px] text-muted">{item.rainfall}mm rain at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))}
                      {activity.length === 0 && <p className="text-center py-6 text-muted text-xs italic">No activity detected.</p>}
                    </div>
                  </div>

                  {/* Quick Claims */}
                  <div className="main-card glass-panel">
                    <div className="flex-between mb-6">
                      <h3>Claim Archive</h3>
                    </div>
                    <div className="claims-list">
                      {claims.slice(0, 3).map((claim, idx) => (
                        <div key={idx} className="claim-item">
                          <div>
                            <p className="text-xs font-bold leading-none">₹{claim.amount}</p>
                            <p className="text-[9px] text-muted mt-1 uppercase">{claim.claimType}</p>
                          </div>
                          <span className={`status-pill ${claim.status.toLowerCase()}`}>{claim.status}</span>
                        </div>
                      ))}
                      {claims.length === 0 && <p className="text-center py-6 text-muted text-xs italic">No claim history.</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'policy' && (
              <motion.div
                key="policy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PolicyManager user={user} socket={socket} />
              </motion.div>
            )}

            {activeView === 'claims' && (
              <motion.div
                key="claims"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ClaimsManager user={user} socket={socket} />
              </motion.div>
            )}

            {activeView === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ProfileView user={user} />
              </motion.div>
            )}

            {activeView === 'earnings' && (
              <motion.div
                key="earnings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <EarningsLog user={user} />
              </motion.div>
            )}

            {activeView === 'payouts' && (
              <motion.div
                key="payouts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PayoutHistory user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* UPI Simulation Modal */}
      <AnimatePresence>
        {showUpiModal && (
          <div className="upi-simulation-overlay" onClick={() => setShowUpiModal(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="upi-modal glass-panel"
              onClick={e => e.stopPropagation()}
            >
              <div className="upi-header">
                <div className="upi-logo">UPI</div>
                <div className="bank-logo">NPCI Parametric Gateway</div>
              </div>
              
              <div className="upi-success-orb">
                <CheckCircle size={48} className="text-primary animate-bounce" />
              </div>

              <div className="upi-amount-row text-center">
                <h2>₹{showUpiModal.amount}</h2>
                <p>Transfer Successful</p>
              </div>

              <div className="upi-details-grid">
                <div className="detail-item">
                  <span>To:</span>
                  <strong>{showUpiModal.vpa}</strong>
                </div>
                <div className="detail-item">
                  <span>Txn ID:</span>
                  <strong className="text-[10px] break-all">{showUpiModal.txId}</strong>
                </div>
              </div>

              <button className="upi-close-btn" onClick={() => setShowUpiModal(null)}>Back to Hub</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
