import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  ChevronRight, ArrowRight, Zap, RefreshCw,
  Search, Filter, ShieldCheck, CreditCard
} from 'lucide-react';
import BACKEND_URL from '../config.js';

const ClaimsManager = ({ user, socket }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClaims = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/claims/${user.phone}`);
      const result = await response.json();
      if (result.success) setClaims(result.claims);
    } catch (err) {
      console.error('Fetch Claims Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();

    if (socket) {
      socket.on('claimSuggestion', (data) => {
        setSuggestion(data);
      });
      
      socket.on('claimUpdate', (updatedClaim) => {
        setClaims(prev => prev.map(c => c._id === updatedClaim._id ? updatedClaim : c));
      });
    }

    return () => {
      if (socket) {
        socket.off('claimSuggestion');
        socket.off('claimUpdate');
      }
    };
  }, [user.phone, socket]);

  const handleSubmitOneClick = async () => {
    if (!suggestion) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/claims/one-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestion)
      });
      const result = await response.json();
      if (result.success) {
        setClaims(prev => [result.claim, ...prev]);
        setSuggestion(null);
        // Alert handled by parent or toast
      }
    } catch (err) {
      console.error('Submit Claim Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={16} className="text-emerald-400" />;
      case 'Under Review': return <Clock size={16} className="text-yellow-400" />;
      case 'Processed': return <ShieldCheck size={16} className="text-primary" />;
      case 'Rejected': return <AlertTriangle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-muted" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Under Review': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Processed': return 'bg-primary/10 text-primary border-primary/20';
      case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-white/5 text-muted border-white/5';
    }
  };

  if (loading) return <div className="p-12 text-center opacity-50"><RefreshCw className="animate-spin inline mr-2" /> Loading Claims...</div>;

  return (
    <div className="claims-manager mt-8">
      <div className="flex-between mb-8">
        <div className="flex items-center gap-3">
          <div className="icon-box bg-purple-glow">
            <FileText size={24} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Zero-Touch Claims</h2>
            <p className="text-sm text-muted">AI-powered proactive loss protection</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {suggestion && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="claim-suggestion-card glass-panel mb-8 p-6 relative overflow-hidden group"
            style={{ borderColor: 'var(--primary)' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={80} className="text-yellow-400" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest">System Detected Risk</span>
                   <span className="text-xs text-muted">• {suggestion.prefilled.riskData.location}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Potential Loss Protection Eligible</h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  We've detected {suggestion.prefilled.riskData.rainfall}mm rainfall. Your active policy allows for a payout of <span className="text-white font-bold">₹{suggestion.prefilled.amount}</span> to cover potential delivery loss.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setSuggestion(null)}
                  className="flex-1 md:w-24 py-3 text-sm font-bold border border-white/10 rounded-xl hover:bg-white/5"
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleSubmitOneClick}
                  disabled={isSubmitting}
                  className="flex-3 md:min-w-[180px] py-3 bg-primary text-white font-black rounded-xl hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <><Zap size={16} fill="white" /> Submit One-Click Claim</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="claims-activity-feed space-y-4">
         <div className="flex-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-black uppercase tracking-widest opacity-50">Recent History</h4>
            <div className="flex gap-4">
               <Filter size={14} className="text-muted cursor-pointer hover:text-white" />
            </div>
         </div>

         {claims.length > 0 ? (
           claims.map((claim) => (
             <motion.div 
               key={claim._id}
               layout
               className="claim-feed-item glass-panel p-5 hover:bg-white/5 transition-all cursor-pointer"
             >
               <div className="flex-between mb-4">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/5 rounded-xl">
                      <CreditCard size={20} className="text-muted" />
                   </div>
                   <div>
                     <h4 className="font-bold flex items-center gap-2">
                       {claim.claimType} • <span className="text-muted text-xs">#CLM-{claim._id.slice(-6)}</span>
                     </h4>
                     <p className="text-xs text-muted mb-1">{new Date(claim.submittedAt).toLocaleDateString()} @ {new Date(claim.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                 </div>
                 <div className="text-right">
                    <p className="text-lg font-black tracking-tight">₹{claim.amount}</p>
                    <span className={`status-tag px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                        {getStatusIcon(claim.status)} {claim.status}
                    </span>
                 </div>
               </div>

               {/* Simple Timeline Progress Bar */}
               <div className="claim-progress-bar w-full h-1 bg-white/5 rounded-full mb-4 overflow-hidden flex">
                  <div className={`h-full ${claim.status === 'Rejected' ? 'bg-red-500' : 'bg-primary'}`} style={{ width: claim.status === 'Pending' ? '25%' : (claim.status === 'Under Review' ? '50%' : '100%') }} />
               </div>

               <div className="claim-preview-text p-3 bg-white/5 rounded-lg border border-white/5 italic text-xs text-muted leading-relaxed">
                  "{claim.description}"
               </div>
             </motion.div>
           ))
         ) : (
           <div className="text-center py-16 glass-panel border-dashed border-white/10">
              <FileText size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-muted font-medium">No claims reported. RainShield is monitoring.</p>
           </div>
         )}
      </div>

      <style jsx>{`
        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-purple-glow {
          background: rgba(168, 85, 247, 0.1);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.1);
        }
        .status-tag {
          border: 1px solid transparent;
        }
        @keyframes subtle-pulse {
          0% { border-color: var(--primary-glow); }
          50% { border-color: rgba(16, 185, 129, 0.4); }
          100% { border-color: var(--primary-glow); }
        }
        .claim-suggestion-card {
           border-width: 1px;
           animation: subtle-pulse 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ClaimsManager;
