import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudLightning, TrendingUp, IndianRupee, Map, ShieldAlert, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import './Dashboard.css';

import RiskHeatmap from '../components/RiskHeatmap';
import BACKEND_URL from '../config.js';

const socket = io(BACKEND_URL);

const Dashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
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

    fetchActivity();

    if (user?.city) {
      socket.emit('joinZone', user.city);
    }

    socket.on('weatherUpdate', (update) => {
      setData(update);
      setLoading(false);
      // Refresh activity list on new update
      fetchActivity();
    });

    return () => {
      socket.off('weatherUpdate');
    };
  }, [user]);

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

      <div className="metrics-grid mt-6">
        <div className="metric-card glass-panel">
          <div className="metric-icon-wrapper blue">
            <ShieldAlert className="metric-icon" />
          </div>
          <div>
            <p className="metric-label">Active Plan</p>
            <h3 className="metric-value" style={{ textTransform: 'capitalize' }}>{user?.tier || 'Standard'}</h3>
          </div>
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
            <p className="metric-label">Automated Payout</p>
            <h3 className="metric-value">
              ₹{loading ? '...' : (data?.prediction?.payoutAmount || 0)}
            </h3>
          </div>
        </div>
      </div>

      {data?.prediction && (
        <div className={`risk-banner ${data.prediction.riskLevel.toLowerCase()}`}>
          <ShieldAlert size={20} />
          <span><strong>ML INSIGHT:</strong> {data.prediction.riskLevel} RISK detected based on weather patterns. Estimated loss triggers ${data.prediction.payoutAmount} payout.</span>
        </div>
      )}

      <div className="dashboard-main grid-2 mt-6">
        {/* Heatmap Section */}
        <div className="main-card glass-panel no-padding-bottom">
          <RiskHeatmap userCity={user?.city || 'Mumbai'} />
        </div>


        {/* Weather Status Card */}
        <div className="main-card glass-panel relative-parent">
          <div className="flex-between mb-4">
            <h3>Active Protection Status</h3>
            <span className="live-badge">● MONITORING</span>
          </div>

          <div className="payout-tracker mt-6">
            <div className="tracker-step active">
              <div className="step-point"></div>
              <div className="step-info">
                <h4>Region: {data?.city || user?.city}</h4>
                <p>Weather sensors connected and active</p>
              </div>
            </div>
            <div className={`tracker-step ${data?.conditions?.riskLevel !== 'Low' ? 'active' : ''}`}>
              <div className="step-point"></div>
              <div className="step-info">
                <h4>Trigger Detection</h4>
                <p>{data?.conditions?.riskLevel === 'High' ? '🚨 Rain Threshold Exceeded!' : 'Conditions below trigger point'}</p>
              </div>
            </div>
            <div className={`tracker-step ${data?.conditions?.riskLevel === 'High' ? 'active' : ''}`}>
              <div className="step-point"></div>
              <div className="step-info">
                <h4>Automatic Payout</h4>
                <p>
                  {data?.conditions?.riskLevel === 'High'
                    ? `✅ ₹${(user?.avgDailyEarnings * (user?.tier === 'basic' ? 0.6 : 1.0)).toFixed(0)} sent to UPI`
                    : 'Standby mode'}
                </p>
              </div>
            </div>
          </div>

          <div className="current-conditions mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <div className="condition">
              <span>Real Rainfall</span>
              <strong>{loading ? '...' : data?.conditions?.rainfall}</strong>
            </div>
            <div className="condition">
              <span>Conditions</span>
              <strong>{loading ? '...' : (data?.conditions?.desc || 'Clear')}</strong>
            </div>
            <div className="condition">
              <span>Protection Cover</span>
              <strong>{user?.tier === 'basic' ? '60%' : '100%'}</strong>
            </div>
          </div>
        </div>

        {/* Payout History & Timeline */}
        <div className="main-card glass-panel timeline-card">
          <div className="flex-between mb-4">
            <h3>Recent Activity</h3>
            <a href="#" className="view-all">View All</a>
          </div>

          <div className="timeline">
            {activity.length > 0 ? (
              activity.map((item, index) => (
                <div key={item.id || index} className="timeline-item">
                  <div className={`timeline-icon ${item.risk_level === 'HIGH' ? 'bg-red' : item.risk_level === 'MEDIUM' ? 'bg-blue' : 'bg-green'}`}>
                    {item.risk_level === 'HIGH' ? <ShieldAlert size={16} /> : item.risk_level === 'MEDIUM' ? <CloudLightning size={16} /> : <CheckCircle size={16} />}
                  </div>
                  <div className="timeline-content">
                    <h4>{item.risk_level} Risk Detected</h4>
                    <p>{item.rainfall}mm rain at {item.temperature}°C</p>
                    {item.payout_amount > 0 && (
                      <span className="amount positive">+ ₹{item.payout_amount}</span>
                    )}
                  </div>
                  <span className="time-text">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="timeline-item opacity-50">
                <div className="timeline-icon bg-gray">
                  <CheckCircle size={16} />
                </div>
                <div className="timeline-content">
                  <h4>No Recent Activity</h4>
                  <p>Monitoring your zone for risks...</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default Dashboard;
