import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Info, CloudRain, Thermometer, Wind } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RiskHeatmap = ({ userCity }) => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Default Mumbai

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/monitor/heatmap/${userCity}`);
                setZones(response.data);
                
                // Centering on the first zone found
                if (response.data && response.data.length > 0) {
                    setMapCenter([response.data[0].lat, response.data[0].lng]);
                }
                
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
        <div className="heatmap-loader" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: '24px' }}>
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 40, height: 40, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    );

    const getRiskColor = (risk) => {
        const r = risk.toUpperCase();
        if (r === 'HIGH') return '#ef4444';
        if (r === 'MEDIUM') return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className="heatmap-wrapper" style={{ position: 'relative', height: '450px', width: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            {/* Real Interactive Map Container */}
            <MapContainer 
                center={mapCenter} 
                zoom={11} 
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
                zoomControl={false}
                key={`${userCity}-${mapCenter[0]}`} // Force re-render on city change
            >
                {/* Premium Dark Map Style using CartoDB */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                <ZoomControl position="bottomleft" />

                {zones.map((zone, idx) => (
                    <CircleMarker
                        key={zone.zone}
                        center={[zone.lat, zone.lng]}
                        radius={15}
                        pathOptions={{
                            fillColor: getRiskColor(zone.riskLevel),
                            color: 'white',
                            weight: 2,
                            opacity: 0.8,
                            fillOpacity: 0.6
                        }}
                    >
                        {/* Real-time Tooltip with details */}
                        <Tooltip permanent={false} direction="top" className="custom-tooltip">
                            <div style={{ background: '#1e293b', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <strong style={{ display: 'block', marginBottom: '4px' }}>{zone.zone}</strong>
                                <div className="detail" style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: getRiskColor(zone.riskLevel) }}>Risk: {zone.riskLevel}</span>
                                    <span>🌧️ Rainfall: {zone.rainfall} mm</span>
                                    <span>🌡️ Temp: {zone.temp}°C</span>
                                </div>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}
            </MapContainer>

            {/* Overlays (Status Banner & Legend) */}
            <div className="heatmap-header" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.9)', padding: '10px 20px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '10px' }}>
                    <MapPin size={18} className="text-blue-400" />
                </div>
                <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>LIVE EARTH MONITOR</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>TRACKING: {userCity} / REAL-TIME DATA</div>
                </div>
            </div>

            <div className="heatmap-legend" style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(15, 23, 42, 0.9)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'rgba(255,255,255,0.7)' }}>Risk Key</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: 12, height: 12, borderRadius: '4px', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} /> High Risk</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: 12, height: 12, borderRadius: '4px', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} /> Moderate</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: 12, height: 12, borderRadius: '4px', background: '#10b981', boxShadow: '0 0 10px #10b981' }} /> Safe Zone</div>
            </div>

            {/* Simulated High-Risk Scan Line (Still kept for aesthetic but restricted to overlay) */}
            <motion.div 
                animate={{ top: ['0%', '100%'] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'rgba(59, 130, 246, 0.3)', zIndex: 900, pointerEvents: 'none' }}
            />
        </div>
    );
};

export default RiskHeatmap;
