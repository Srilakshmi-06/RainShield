import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, ShieldCheck, Activity, AreaChart as ChartIcon, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import BACKEND_URL from '../config.js';

const EarningsLog = ({ user }) => {
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/monitor/activity/${user?.phone || '999'}`);
                const data = await response.json();
                setActivity(data);
            } catch (err) {
                console.error('Error fetching activity:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [user]);

    const chartData = activity.slice(0, 7).reverse().map((a, i) => ({
        name: new Date(a.timestamp).toLocaleDateString([], { weekday: 'short' }),
        base: 800,
        predicted: a.predictedEarnings,
        payout: a.payoutAmount || 0,
        total: a.predictedEarnings + (a.payoutAmount || 0)
    }));

    const totalLossPrevented = activity.reduce((sum, a) => sum + (a.payoutAmount || 0), 0);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="earnings-log-view"
        >
            <header className="mb-8">
                <h2 className="text-2xl font-black text-white mb-2">Earnings Protection Log</h2>
                <p className="text-xs text-muted uppercase tracking-widest font-bold">ML-Powered Risk Absorption Analytics</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-[10px] text-muted font-black uppercase">Market Risk</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">₹{activity.length * 800 - activity.reduce((s, a) => s + a.predictedEarnings, 0)}</h3>
                    <p className="text-[10px] text-red-400/70 font-bold mt-1 uppercase">Total Predicted Income Loss</p>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-emerald-500/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-[10px] text-muted font-black uppercase">RainShield Cover</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">₹{totalLossPrevented}</h3>
                    <p className="text-[10px] text-emerald-400/70 font-bold mt-1 uppercase">Instant Payouts Processed</p>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Activity size={20} />
                        </div>
                        <span className="text-[10px] text-muted font-black uppercase">Resilience Score</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">92%</h3>
                    <p className="text-[10px] text-blue-400/70 font-bold mt-1 uppercase">Daily Income Stability Factor</p>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/5 mb-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Protection Visualizer</h4>
                        <p className="text-[10px] text-muted font-bold mt-1">Comparing Raw Market Earnings vs. Protected Payouts</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                           <span className="text-[10px] font-bold text-muted uppercase">Market Risk</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                           <span className="text-[10px] font-bold text-muted uppercase">With RainShield</span>
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="name" 
                                stroke="rgba(255,255,255,0.1)" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tick={{fill: 'rgba(255,255,255,0.4)', fontWeight: 700}}
                            />
                            <YAxis 
                                hide 
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    background: 'rgba(15, 23, 42, 0.95)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '16px',
                                    padding: '12px'
                                }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                cursor={{ stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 2 }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="predicted" 
                                stroke="#475569" 
                                fill="transparent" 
                                strokeWidth={2} 
                                strokeDasharray="5 5"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#10b981" 
                                fillOpacity={1} 
                                fill="url(#colorTotal)" 
                                strokeWidth={3} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-bottom border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Recent Activity Log</h4>
                </div>
                <div className="divide-y divide-white/5">
                    {activity.slice(0, 5).map((log, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${log.riskLevel === 'HIGH' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`}></div>
                                <div>
                                    <p className="text-xs font-bold text-white mb-1">{log.riskLevel} Risk Event Detected</p>
                                    <p className="text-[10px] text-muted">{log.rainfall}mm rainfall • {log.temperature}°C</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-white">₹{log.predictedEarnings}</p>
                                <p className="text-[9px] text-muted font-bold uppercase">Estimated Income</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default EarningsLog;
