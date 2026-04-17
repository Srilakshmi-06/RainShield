import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

const UpiPaymentModal = ({ isOpen, amount, onClose, onSuccess, userPhone }) => {
  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    // Simulate a brief loading state
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="upi-simulation-overlay" onClick={onClose}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="upi-modal glass-panel"
          onClick={e => e.stopPropagation()}
        >
          <div className="upi-header">
            <div className="upi-logo">UPI</div>
            <div className="bank-logo">Secure Payment Gateway</div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} className="text-muted" />
            </button>
          </div>
          
          <div className="upi-amount-row text-center mb-8">
            <p className="text-xs text-muted uppercase font-black tracking-widest mb-2">Request from RainShield</p>
            <h2 className="text-4xl font-black">₹{amount}</h2>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20 w-fit mx-auto">
              <CheckCircle size={10} /> VERIFIED MERCHANT
            </div>
          </div>

          <div className="upi-details-grid mb-8">
            <div className="detail-item">
              <span>From:</span>
              <strong>{userPhone || '999'}@okaxis</strong>
            </div>
            <div className="detail-item">
              <span>Purpose:</span>
              <strong>Weekly Premium</strong>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              className="upi-close-btn" 
              onClick={handleSimulatePayment}
            >
              Confirm & Pay ₹{amount}
            </button>
            <button 
              className="py-3 text-xs font-bold text-muted hover:text-white transition-colors" 
              onClick={onClose}
            >
              Cancel Payment
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[9px] text-muted-foreground opacity-50 uppercase tracking-widest">
              Powered by NPCI • 256-bit Encrypted
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpiPaymentModal;
