import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Bike, IndianRupee, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import BACKEND_URL from '../config';
import './Signup.css';

const Signup = ({ onAuth }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  
  // Profile state
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [platform, setPlatform] = useState('');
  const [avgDailyEarnings, setAvgDailyEarnings] = useState('800');
  const [tier, setTier] = useState('standard');

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!phone) return setError('Enter a phone number');
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { phone });
      alert('Demo Mode: OTP Sent! Check backend console.');
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { phone, otp });
      if (res.data.success) {
        setStep(2);
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = () => {
    if(!name || !city || !platform || !avgDailyEarnings) return setError('Please fill all profile fields');
    setStep(3);
  }

  const handleFinish = async (selectedTier) => {
    setLoading(true);
    const userData = {
        name,
        city,
        platform,
        phone,
        avgDailyEarnings: parseFloat(avgDailyEarnings),
        tier: selectedTier
    };

    try {
        const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, userData);
        onAuth(res.data.user);
        navigate('/dashboard');
    } catch (err) {
        setError(err.response?.data?.error || 'Signup failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="signup-container container"
      style={{ paddingTop: '100px' }}
    >
      <div className="signup-card glass-panel">
        <div className="signup-header">
          <h2>Protect Your Earnings</h2>
          <p>Get automatic payouts during severe weather</p>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <motion.div className="step-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>1. Verify Phone Number</h3>
            <div className="input-group">
              <input 
                type="tel" 
                className="input-field" 
                placeholder="Enter Mobile Number (+91)" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={handleSendOtp} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Get OTP'}
              </button>
            </div>
            <div className="input-group mt-4">
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter 6-digit OTP" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button className="btn btn-primary w-full mt-6" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Continue'}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div className="step-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>2. Worker Profile</h3>
            <div className="grid-2 mt-4">
              <input 
                type="text" 
                className="input-field mb-4" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="input-with-icon mb-4">
                 <input 
                    type="text" 
                    className="input-field pl-10" 
                    placeholder="City" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />
                 <MapPin className="input-icon" />
              </div>
            </div>
            
            <div className="grid-2">
              <select className="input-field mb-4" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="">Select Platform...</option>
                <option value="Zomato">Zomato</option>
                <option value="Swiggy">Swiggy</option>
                <option value="Zepto">Zepto</option>
                <option value="Blinkit">Blinkit</option>
              </select>

              <div className="input-with-icon mb-4">
                <input 
                    type="number" 
                    className="input-field pl-10" 
                    placeholder="Avg Daily Earnings (₹)" 
                    value={avgDailyEarnings}
                    onChange={(e) => setAvgDailyEarnings(e.target.value)}
                />
                <IndianRupee className="input-icon" size={16} />
              </div>
            </div>
            
            <div className="input-with-icon mb-6">
              <input type="text" className="input-field pl-10" placeholder="Vehicle Type (e.g., Bike, EV)" />
              <Bike className="input-icon" />
            </div>

            <button className="btn btn-primary w-full" onClick={handleProfileSubmit}>Choose Coverage</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div className="step-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>3. Select Coverage Tier</h3>
            <div className="tiers-grid mt-4">
              
              <div className="tier-card glass-panel" onClick={() => handleFinish('basic')}>
                <h4>Basic</h4>
                <div className="price">₹49 <span className="period">/week</span></div>
                <ul>
                  <li>Up to ₹500/day payout</li>
                  <li>Rain & Flood Cover</li>
                  <li>Standard Detection</li>
                </ul>
              </div>

              <div className="tier-card glass-panel premium" onClick={() => handleFinish('standard')}>
                <div className="badge">Most Popular</div>
                <h4>Standard</h4>
                <div className="price">₹99 <span className="period">/week</span></div>
                <ul>
                  <li>Up to ₹1000/day payout</li>
                  <li>Rain, Flood & AQI Cover</li>
                  <li>Priority Payout (2hrs)</li>
                </ul>
              </div>

            </div>
          </motion.div>
        )}

        <p className="mt-6 text-center" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already a member? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Login</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Signup;
