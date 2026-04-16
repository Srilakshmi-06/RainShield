import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle, IndianRupee, ArrowUpRight, ExternalLink } from 'lucide-react';
import BACKEND_URL from '../config.js';

const PayoutHistory = ({ user }) => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayouts = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/monitor/claims/${user?.phone || '999'}`);
                const data = await response.json();
                // Filter only successful payouts
                const successful = data.filter(c => c.payoutStatus === 'Success');
                setPayouts(successful);
            } catch (err) {
                console.error('Error fetching payouts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPayouts();
    }, [user]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="payout-history-view"
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-2">Payout History</h2>
                    <p className="text-xs text-muted uppercase tracking-widest font-bold">Verified NPCI Parametric Settlements</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                    <span className="text-[10px] text-emerald-400 font-black uppercase">Total Protected</span>
                    <h3 className="text-lg font-black text-white">₹{payouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</h3>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-muted">Loading transactions...</div>
            ) : payouts.length === 0 ? (
                <div className="py-20 glass-panel rounded-3xl text-center">
                    <History size={48} className="mx-auto mb-4 text-slate-700" />
                    <h3 className="text-white font-bold">No payouts yet</h3>
                    <p className="text-xs text-muted">Your parametric payouts will appear here automatically.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {payouts.map((payout, idx) => (
                        <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <IndianRupee size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-white text-sm">Parametric Settlement</h4>
                                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Success</span>
                                    </div>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Txn: {payout.payoutId}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{new Date(payout.submittedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <h3 className="text-xl font-black text-emerald-400">₹{payout.amount}</h3>
                                <div className="flex items-center justify-end gap-1 text-[9px] text-muted font-bold mt-1 uppercase cursor-pointer hover:text-white">
                                    <span>Receipt</span>
                                    <ExternalLink size={10} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default PayoutHistory;
