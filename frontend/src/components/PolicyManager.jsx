import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, RefreshCw, Zap, ChevronDown, ChevronUp, 
  TrendingDown, Layers, Activity, Calendar, 
  AlertCircle, CheckCircle2, ArrowRight, Info,
  TrendingUp, IndianRupee, PieChart
} from 'lucide-react';
import BACKEND_URL from '../config.js';
import UpiPaymentModal from './UpiPaymentModal';

const PolicyManager = ({ user, socket, refreshUser }) => {
  const [policies, setPolicies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'history', 'analytics'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPolicyForPayment, setSelectedPolicyForPayment] = useState(null);

  const fetchPolicyData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/policies/${user.phone}`);
      const result = await response.json();
      if (result.success) {
        setPolicies(result.policies);
        setAnalytics(result.analytics);
        if (result.policies.length > 0 && !expandedPolicy) {
          setExpandedPolicy(result.policies[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching policy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyData();

    if (socket) {
      socket.on('policyUpdate', (updatedPolicy) => {
        setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? { ...p, ...updatedPolicy } : p));
      });
    }

    return () => {
      if (socket) socket.off('policyUpdate');
    };
  }, [user.phone, socket]);

  const handleToggleAutoRenew = async (policyId, currentVal) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/policies/auto-renew/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenew: !currentVal })
      });
      const result = await response.json();
      if (result.success) {
        setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, autoRenew: !currentVal } : p));
      }
    } catch (err) {
      console.error('Toggle Error:', err);
    }
  };

  const handleUpdateTier = async (policyId, newTier) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/policies/tier/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier })
      });
      const result = await response.json();
      if (result.success) {
        setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, ...result.policy } : p));
        // Sync global user state so chatbot gets the new tier
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      console.error('Tier Update Error:', err);
    }
  };

  const handlePayPremium = async (policyId) => {
    // Open the modal first
    const policy = policies.find(p => p.id === policyId);
    setSelectedPolicyForPayment(policy);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPolicyForPayment) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/policies/pay-premium/${selectedPolicyForPayment.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            setPolicies(prev => prev.map(p => p.id === selectedPolicyForPayment.id ? { ...p, ...result.policy } : p));
            setShowPaymentModal(false);
            // alert('Premium paid successfully! Protection is now active for 7 days.');
        }
    } catch (err) {
        console.error('Payment Error:', err);
    }
  };

  const activePolicy = policies.find(p => p.status === 'active' || p.status === 'expiring_soon' || p.statusDisplay === 'Expiring Soon');
  const pastPolicies = policies.filter(p => p.status === 'expired' || p.status === 'cancelled');

  if (loading) return <div className="p-8 text-center"><RefreshCw className="animate-spin inline mr-2" /> Loading Insurance Data...</div>;

  return (
    <div className="policy-manager-wrapper mt-8">
      <div className="flex-between mb-6">
        <div className="flex items-center gap-3">
          <div className="icon-box bg-blue-glow">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Policy Management</h2>
            <p className="text-sm text-muted">Intelligent protection powered by RainShield AI</p>
          </div>
        </div>
        <div className="tab-switcher glass-panel p-1 flex gap-1">
          <button 
            className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            Active
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Insights
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'current' && (
          <motion.div 
            key="current"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="active-policy-container"
          >
            {activePolicy ? (
              <div className="policy-main-card glass-panel overflow-hidden">
                <div className="policy-card-header p-6 flex-between">
                  <div className="flex gap-4">
                    <div className={`tier-badge ${activePolicy.coverageTier}`}>
                      {activePolicy.coverageTier.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Protection ID: #RS-{activePolicy.id}</h3>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <Calendar size={12} /> Valid until {new Date(activePolicy.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`status-pill ${activePolicy.statusDisplay === 'Expiring Soon' ? 'warning' : 'active'}`}>
                    {activePolicy.statusDisplay || activePolicy.status}
                  </div>
                </div>

                <div className="policy-metrics-strip grid grid-cols-3 border-t border-b border-white/5">
                  <div className="strip-item p-4 text-center">
                    <p className="text-xs text-muted mb-1">Weekly Premium</p>
                    <p className="font-bold text-lg">₹{activePolicy.coverageTier === 'premium' ? 199 : (activePolicy.coverageTier === 'standard' ? 99 : 49)}</p>
                    {parseFloat(activePolicy.currentPremium) > (activePolicy.coverageTier === 'premium' ? 199 : (activePolicy.coverageTier === 'standard' ? 99 : 49)) && (
                      <span className="risk-indicator up flex items-center justify-center gap-1 text-[10px]">
                        <TrendingUp size={10} /> Risk adj.
                      </span>
                    )}
                  </div>
                  <div className="strip-item p-4 text-center border-l border-r border-white/5">
                    <p className="text-xs text-muted mb-1">Max Payout Limit</p>
                    <p className="font-bold text-lg">₹{activePolicy.payoutLimit}</p>
                  </div>
                  <div className="strip-item p-4 text-center">
                    <p className="text-xs text-muted mb-1">Premium Status</p>
                    <p className="font-bold text-sm">
                        {(Date.now() - new Date(activePolicy.lastPremiumPaidDate).getTime()) > 7 * 24 * 60 * 60 * 1000 
                          ? 'Overdue' 
                          : 'Paid (Active)'}
                    </p>
                  </div>
                </div>

                <div className="policy-details-body p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Why this premium Section */}
                    {/* Transparent Pricing Breakdown */}
                    <div className="insight-section">
                      <h4 className="flex items-center gap-2 mb-4 text-sm font-semibold opacity-80">
                        <PieChart size={16} className="text-secondary" /> 
                        Pricing Breakdown & Logic
                      </h4>
                      <div className="pricing-table glass-panel bg-white/5 p-5 rounded-xl border border-white/5">
                        <div className="table-row flex-between py-2 border-b border-white/5">
                          <span className="text-xs opacity-60">Base Coverage Price</span>
                          <span className="text-xs font-bold">₹{activePolicy.risk_insights?.breakdown?.base || 0}</span>
                        </div>
                        <div className="table-row flex-between py-2 border-b border-white/5">
                          <span className="text-xs opacity-60">Environmental Risk Surcharge</span>
                          <span className="text-xs font-bold text-red-300">+ ₹{activePolicy.risk_insights?.breakdown?.environmental || 0}</span>
                        </div>
                        <div className="table-row flex-between py-2 border-b border-white/5">
                          <span className="text-xs opacity-60">Activity Hazard Multiplier</span>
                          <span className="text-xs font-bold text-orange-300">+ ₹{activePolicy.risk_insights?.breakdown?.activity || 0}</span>
                        </div>
                        <div className="table-row flex-between py-2 border-b border-white/5">
                          <span className="text-xs opacity-60">AI Zone-Risk Load</span>
                          <span className="text-xs font-bold text-primary">+ ₹{activePolicy.risk_insights?.breakdown?.mlRisk || 0}</span>
                        </div>
                        <div className="table-row flex-between pt-3 font-black text-primary">
                          <span className="text-sm">Final Dynamic Premium</span>
                          <span className="text-lg">₹{activePolicy.currentPremium}</span>
                        </div>
                        
                        <div className="pricing-explanation mt-4 pt-4 border-t border-white/5">
                           <p className="text-[11px] leading-relaxed italic opacity-80">
                             <Info size={12} className="inline mr-1 text-primary" />
                             "{activePolicy.risk_insights?.explanation}"
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Settings & Actions */}
                    <div className="actions-section">
                      <h4 className="flex items-center gap-2 mb-4 text-sm font-semibold opacity-80">
                        <Activity size={16} className="text-primary" /> 
                        Policy Settings
                      </h4>
                      <div className="flex flex-col gap-4">
                         <div className="flex-between glass-panel bg-white/5 p-3 rounded-xl border-none">
                           <div className="flex items-center gap-2">
                             <RefreshCw size={16} className={activePolicy.autoRenew ? 'text-primary' : 'text-muted'} />
                             <span className="text-sm">Auto-Renewal</span>
                           </div>
                           <label className="switch">
                             <input 
                               type="checkbox" 
                               checked={activePolicy.autoRenew} 
                               onChange={() => handleToggleAutoRenew(activePolicy.id, activePolicy.autoRenew)}
                             />
                             <span className="slider round"></span>
                           </label>
                         </div>

                         <div className={`payment-action-box glass-panel p-4 rounded-xl border ${ (Date.now() - new Date(activePolicy.lastPremiumPaidDate).getTime()) > 7 * 24 * 60 * 60 * 1000 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                            <div className="flex-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Weekly Premium Cycle</span>
                                <span className="text-[10px] opacity-60">Every 7 Days</span>
                            </div>
                            <p className="text-xs opacity-80 mb-4">
                                {(Date.now() - new Date(activePolicy.lastPremiumPaidDate).getTime()) > 7 * 24 * 60 * 60 * 1000 
                                  ? 'Your premium is overdue. Automated payouts are disabled until payment is made.'
                                  : `Protection is active. Next payment due in ${Math.max(0, 7 - Math.floor((Date.now() - new Date(activePolicy.lastPremiumPaidDate).getTime()) / (24 * 60 * 60 * 1000)))} days.`}
                            </p>
                            <button 
                                onClick={() => handlePayPremium(activePolicy.id)}
                                disabled={(Date.now() - new Date(activePolicy.lastPremiumPaidDate).getTime()) <= 7 * 24 * 60 * 60 * 1000}
                                className={`w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${ (Date.now() - new Date(activePolicy.lastPremiumPaidDate).getTime()) > 7 * 24 * 60 * 60 * 1000 ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-emerald-500/50 opacity-50 cursor-not-allowed'}`}
                            >
                                {(Date.now() - new Date(activePolicy.lastPremiumPaidDate).getTime()) <= 7 * 24 * 60 * 60 * 1000 
                                  ? 'Paid for this week' 
                                  : `Pay Weekly (₹${activePolicy.coverageTier === 'premium' ? 199 : (activePolicy.coverageTier === 'standard' ? 99 : 49)})`}
                            </button>
                         </div>

                        <div className="tier-upgrade-box glass-panel bg-primary/10 border-primary/20 p-4 rounded-xl">
                          <div className="flex-between mb-3">
                            <span className="text-sm font-bold">Tier Management</span>
                            <span className="text-xs text-primary font-semibold">Smart Suggestion</span>
                          </div>
                          <p className="text-xs text-muted mb-4 line-relaxed">
                            {activePolicy.coverageTier === 'premium' 
                              ? 'You are on the highest protection tier. Best for extreme storm seasons.' 
                              : `Upgrade to ${activePolicy.coverageTier === 'basic' ? 'Standard' : 'Premium'} for 2x payout limits during upcoming high-rainfall zones.`}
                          </p>
                          <div className="flex gap-2">
                            {activePolicy.coverageTier !== 'basic' && (
                              <button 
                                onClick={() => handleUpdateTier(activePolicy.id, 'basic')}
                                className="flex-1 py-2 text-xs font-bold border border-white/10 rounded-lg hover:bg-white/5"
                              >
                                Basic
                              </button>
                            )}
                            {activePolicy.coverageTier !== 'standard' && (
                              <button 
                                onClick={() => handleUpdateTier(activePolicy.id, 'standard')}
                                className="flex-1 py-2 text-xs font-bold border border-primary/40 rounded-lg hover:bg-primary/20"
                              >
                                Standard
                              </button>
                            )}
                            {activePolicy.coverageTier !== 'premium' && (
                              <button 
                                onClick={() => handleUpdateTier(activePolicy.id, 'premium')}
                                className="flex-1 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary/30"
                              >
                                Premium
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-policy-state glass-panel p-12 text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-muted opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Active Policy Found</h3>
                <p className="text-muted mb-6">Your protection has expired or hasn't been activated yet.</p>
                <button className="btn btn-primary">Activate New Policy</button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="history-container space-y-4"
          >
            {pastPolicies.length > 0 ? (
              pastPolicies.map((p) => (
                <div key={p.id} className="history-item glass-panel p-4 flex-between border-l-4 border-l-white/20">
                  <div className="flex items-center gap-4">
                    <div className="icon-wrapper bg-white/5 p-2 rounded-lg">
                      <Shield size={20} className="text-muted" />
                    </div>
                    <div>
                      <h4 className="font-bold">#RS-{p.id} • {p.coverageTier.toUpperCase()}</h4>
                      <p className="text-xs text-muted">{new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{p.premiumAmount}</p>
                    <span className="text-[10px] uppercase font-black text-muted-foreground opacity-50">Expired</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted">No historical data available.</div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="analytics-grid grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="analytics-card glass-panel p-6 flex items-center gap-4">
              <div className="icon-circle bg-emerald-500/10 text-emerald-500">
                <IndianRupee size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">Total Premiums Paid</p>
                <h3 className="text-2xl font-black">₹{analytics?.total_premiums_paid || 0}</h3>
              </div>
            </div>
            
            <div className="analytics-card glass-panel p-6 flex items-center gap-4">
              <div className="icon-circle bg-blue-500/10 text-blue-500">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">Net Claims Received</p>
                <h3 className="text-2xl font-black">₹{analytics?.total_payouts_received || 0}</h3>
              </div>
            </div>

            <div className="analytics-card glass-panel p-6 col-span-1 md:col-span-2">
              <div className="flex-between mb-4">
                <h4 className="font-bold flex items-center gap-2"><PieChart size={18} /> Coverage Effectiveness</h4>
              </div>
              <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-primary" 
                  style={{ width: analytics?.total_premiums_paid > 0 ? (Math.min((analytics.total_payouts_received / analytics.total_premiums_paid) * 100, 100)) + '%' : '0%' }}
                />
              </div>
              <p className="text-[10px] text-muted mt-2 text-center uppercase tracking-wider">Protection value ratio based on payouts vs premiums</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpiPaymentModal 
        isOpen={showPaymentModal}
        amount={selectedPolicyForPayment?.coverageTier === 'premium' ? 199 : (selectedPolicyForPayment?.coverageTier === 'standard' ? 99 : 49)}
        userPhone={user.phone}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      <style jsx>{`
        .policy-manager-wrapper {
          color: white;
        }
        .tab-btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.2s;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .tab-btn.active {
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
        }
        .tier-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .tier-badge.basic { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
        .tier-badge.standard { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .tier-badge.premium { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        
        .status-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-pill.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; animation: pulse 2s infinite; }
        
        .icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .risk-indicator.up { color: #f87171; }
        
        /* Switch/Toggle Style */
        .switch {
          position: relative;
          display: inline-block;
          width: 34px;
          height: 20px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255,255,255,0.1);
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 14px; width: 14px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(14px); }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PolicyManager;
