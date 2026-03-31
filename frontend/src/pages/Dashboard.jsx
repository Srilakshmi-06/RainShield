import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudLightning, TrendingUp, IndianRupee, Map, ShieldAlert, CheckCircle, Bell, History, ArrowUpRight } from 'lucide-react';
import { io } from 'socket.io-client';
import './Dashboard.css';

import RiskHeatmap from '../components/RiskHeatmap';
import BACKEND_URL from '../config.js';

const socket = io(BACKEND_URL);

const Dashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [claims, setClaims] = useState([]);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const fetchClaims = async () => {
    try {
      const userId = user?.id || 1;
      const response = await fetch(`${BACKEND_URL}/api/monitor/claims/${userId}`);
      const result = await response.json();
      setClaims(result);
    } catch (err) {
      console.error('Error fetching claims:', err);
    }
  };

  const fetchActivity = async () => {
    try {
      const userId = user?.id || 1;
      const response = await fetch(`${BACKEND_URL}/api/monitor/activity/${userId}`);
      const result = await response.json();
      setActivity(result);
    } catch (err) {
      console.error('Error fetching activity:', err);
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
      // Auto-trigger notification if needed
    });

    return () => {
      socket.off('weatherUpdate');
      socket.off('riskAlert');
    };
  }, [user]);

  const handleClaim = async (alert) => {
    setIsSubmittingClaim(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/monitor/submit-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 1,
          type: alert.type,
          description: alert.message,
          amount: data?.prediction?.payoutAmount || 500,
          alertId: alert.id
        })
      });
      const result = await response.json();
      if (result.success) {
        alert('Claim submitted successfully!');
        fetchClaims();
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }
    } catch (err) {
      console.error('Claim Error:', err);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="dashboard-container container"
      style={{ paddingTop: '100px' }}
    >
      <header className="dashboard-header mt-6">
        <div>
          <h2>Hello, {user?.name || 'Worker'}! 👋</h2>
          <p>Monitoring Protection for: <strong>{data?.city || user?.city || 'Mumbai'}</strong></p>
          {data?.conditions?.desc && <p className="text-muted capitalize">{data.conditions.desc} • {data.conditions.temp}</p>}
        </div>
        <div className={`status-badge ${data?.conditions?.riskLevel === 'High' ? 'danger' : 'safe'}`}>
          {data?.conditions?.riskLevel === 'High' ? <ShieldAlert size={16} /> : <CheckCircle size={16} />}
          <span>Status: {data?.conditions?.riskLevel === 'High' ? 'High Risk Condition' : 'Safe to work'}</span>
        </div>
      </header>

      {/* Metrics Section */}
      <div className="metrics-grid mt-6">
        <div className="metric-card glass-panel">
          <div className="metric-icon-wrapper blue">
            <ShieldAlert className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Premium Rate</p>
            <h3 className="metric-value">₹{data?.dynamicPremium || '200'}/mo</h3>
          </div>
          {data?.dynamicPremium > 200 && <span className="trend-up"><ArrowUpRight size={14}/> Risk Factor</span>}
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-wrapper orange">
            <CloudLightning className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Zone Risk level</p>
            <h3 className="metric-value">{loading ? '...' : data?.conditions?.riskLevel}</h3>
          </div>
        </div>

        <div className="metric-card glass-panel highlight">
          <div className="metric-icon-wrapper purple">
            <TrendingUp className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Predicted Earnings</p>
            <h3 className="metric-value">
              {loading ? '...' : `₹${data?.prediction?.predictedEarnings || '0'}`}
            </h3>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-wrapper green">
            <IndianRupee className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Potential Payout</p>
            <h3 className="metric-value">
              ₹{loading ? '...' : (data?.prediction?.payoutAmount || 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Real-time Alerts Section */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <div className="alerts-section mt-6">
            <div className="flex-between mb-4">
              <h3 className="flex items-center gap-2"><Bell size={18} color="#ef4444"/> Live Risk Triggers</h3>
              <span className="view-all cursor-pointer" onClick={() => setAlerts([])}>Dismiss All</span>
            </div>
            {alerts.map(alert => (
              <motion.div 
                key={alert.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="alert-item glass-panel"
              >
                <div className="alert-content">
                  <h4>{alert.type} Risk Detected</h4>
                  <p>{alert.message}</p>
                </div>
                {alert.suggestClaim && (
                  <button 
                    className="btn-claim"
                    onClick={() => handleClaim(alert)}
                    disabled={isSubmittingClaim}
                  >
                    {isSubmittingClaim ? 'Processing...' : 'Claim Now'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="dashboard-main grid-2 mt-6">
        {/* Heatmap Section */}
        <div className="main-card glass-panel no-padding-bottom">
          <div className="flex-between mb-4">
            <h3>Live Hazard Heatmap</h3>
            <span className="text-muted text-sm">Zone: {user?.city}</span>
          </div>
          <RiskHeatmap userCity={user?.city || 'Mumbai'} />
        </div>

        {/* Protection Status */}
        <div className="main-card glass-panel relative-parent">
          <div className="flex-between mb-4">
            <h3>Active Protection</h3>
            <span className="live-badge">● MONITORING</span>
          </div>

          <div className="payout-tracker mt-6">
            <div className={`tracker-step active`}>
              <div className="step-point"></div>
              <div className="step-info">
                <h4>Dynamic Pricing</h4>
                <p>Premium adjusted to: ₹{data?.dynamicPremium || '200'}</p>
              </div>
            </div>
            <div className={`tracker-step ${data?.conditions?.riskLevel !== 'Low' ? 'active' : ''}`}>
              <div className="step-point"></div>
              <div className="step-info">
                <h4>Trigger Status</h4>
                <p>{data?.conditions?.riskLevel === 'High' ? '🚨 Risk Threshold Exceeded!' : 'Conditions Stable'}</p>
              </div>
            </div>
            <div className={`tracker-step ${claims.some(c => c.status === 'Pending') ? 'active' : ''}`}>
              <div className="step-point"></div>
              <div className="step-info">
                <h4>Claim Lifecycle</h4>
                <p>{claims.length > 0 ? `Latest: ${claims[0].status}` : 'No active claims'}</p>
              </div>
            </div>
          </div>

          <div className="current-conditions mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <div className="condition">
              <span>Rainfall</span>
              <strong>{loading ? '...' : data?.conditions?.rainfall}</strong>
            </div>
            <div className="condition">
              <span>Earnings Risk</span>
              <strong>{data?.prediction?.riskLevel || 'Low'}</strong>
            </div>
            <div className="condition">
              <span>Coverage</span>
              <strong>{user?.tier === 'basic' ? '60%' : '100%'}</strong>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="main-card glass-panel timeline-card">
          <div className="flex-between mb-4">
            <h3>Risk History</h3>
            <span className="view-all">Logs</span>
          </div>

          <div className="timeline">
            {activity.slice(0, 5).map((item, index) => (
              <div key={item.id || index} className="timeline-item">
                <div className={`timeline-icon ${item.risk_level === 'HIGH' ? 'bg-red' : item.risk_level === 'MEDIUM' ? 'bg-blue' : 'bg-green'}`}>
                  {item.risk_level === 'HIGH' ? <ShieldAlert size={16} /> : item.risk_level === 'MEDIUM' ? <CloudLightning size={16} /> : <CheckCircle size={16} />}
                </div>
                <div className="timeline-content">
                  <h4>{item.risk_level} Risk Detected</h4>
                  <p>{item.rainfall}mm rain • {item.temperature}°C</p>
                </div>
                <span className="time-text">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Claims Management Card */}
        <div className="main-card glass-panel claims-card">
          <div className="flex-between mb-4">
            <h3 className="flex items-center gap-2"><History size={18} /> Claim Status</h3>
            <button className="view-all btn-link" onClick={fetchClaims}>Refresh</button>
          </div>
          <div className="claims-list">
            {claims.length > 0 ? (
              claims.slice(0, 4).map(claim => (
                <div key={claim.id} className="claim-item">
                  <div>
                    <h4 className="text-sm font-semibold">{claim.claim_type} Claim</h4>
                    <p className="text-xs text-muted">₹{claim.amount} • {new Date(claim.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`claim-status status-${claim.status.toLowerCase()}`}>
                    {claim.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted py-8 text-sm">No claims submitted yet.</p>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
