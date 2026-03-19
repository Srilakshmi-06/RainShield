import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Info } from 'lucide-react';
import axios from 'axios';

const RiskHeatmap = ({ userCity }) => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/monitor/heatmap/${userCity}`);
                setZones(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Heatmap load failed', err);
            }
        };

        fetchHeatmap();
        const interval = setInterval(fetchHeatmap, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, [userCity]);

    if (loading) return (
        <div className="heatmap-loader" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: '24px' }}>
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 40, height: 40, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    );

    return (
        <div className="heatmap-container" style={{ position: 'relative', height: '400px', width: '100%', background: '#0f172a', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)' }}>
            {/* Simulation of a Map Background with CSS Grids */}
            <div className="map-grid" style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <div className="heatmap-header" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30,41,59,0.8)', padding: '8px 16px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
                <MapPin size={16} className="text-blue-400" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Live Risk Heatmap: {userCity}</span>
            </div>

            <div className="heatmap-legend" style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(30,41,59,0.8)', padding: '12px', borderRadius: '12px', backdropFilter: 'blur(8px)', fontSize: '0.75rem' }}>
                <div className="flex-start" style={{ gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> High Risk (Payout)</div>
                <div className="flex-start" style={{ gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> Medium Risk</div>
                <div className="flex-start" style={{ gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Safe Zone</div>
            </div>

            {/* Radar Animation Rings for each zone */}
            {zones.map((zone, idx) => {
                const color = zone.riskLevel === 'HIGH' ? '#ef4444' : (zone.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981');
                const xPos = 20 + (idx * 15) + '%';
                const yPos = 30 + (idx % 2 === 0 ? 10 : 40) + '%';

                return (
                    <motion.div 
                        key={zone.zone}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{ position: 'absolute', left: xPos, top: yPos, translate: '-50% -50%', cursor: 'pointer' }}
                    >
                        {/* Glowing Radar Pulse */}
                        <motion.div 
                            animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ position: 'absolute', inset: -20, background: color, borderRadius: '50%', filter: 'blur(10px)' }}
                        />
                        <div style={{ position: 'relative', width: 12, height: 12, background: color, borderRadius: '50%', boxShadow: `0 0 20px ${color}`, border: '2px solid white' }} />
                        
                        <div className="zone-name" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', marginTop: '8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)' }}>
                            {zone.zone.split(' ')[0]}
                        </div>
                    </motion.div>
                );
            })}

            {/* Visual scan line animation */}
            <motion.div 
                animate={{ top: ['0%', '100%'] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', opacity: 0.2, zIndex: 1 }}
            />
        </div>
    );
};

export default RiskHeatmap;
