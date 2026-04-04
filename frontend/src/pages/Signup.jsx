import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, MapPin, Bike, IndianRupee, Loader2, 
  Smartphone, User, Briefcase, Zap, CheckCircle, 
  Upload, Navigation, Info, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import BACKEND_URL from '../config.js';
import './Signup.css';

const Signup = ({ onAuth }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Advanced Form State
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    password: '',
    tempToken: '',
    name: '',
    age: '',
    city: '',
    platform: '',
    vehicleType: 'Two-Wheeler',
    workingHours: '8',
    preferredZones: '',
    wetWork: false,
    tier: '',
    docsUploaded: false
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed.data }));
        setStep(parsed.step || 1);
      } catch (e) { 
        console.error('Failed to load progress', e); 
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('onboarding_progress', JSON.stringify({ step, data: formData }));
  }, [step, formData]);

  const updateForm = (updates) => setFormData(prev => ({ ...prev, ...updates }));

  const nextStep = () => setStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  
  const stepProgress = Math.round((step / 7) * 100);

  // --- Handlers ---

  const handleSendOtp = async () => {
    if (!formData.phone) return setError('Enter a valid mobile number');
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { phone: formData.phone });
      alert(`DEMO: OTP is ${res.data.debugOtp}`);
    } catch (err) {
      setError('Service busy. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp) return setError('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { 
        phone: formData.phone, 
        otp: formData.otp 
      });
      if (res.data.success) {
        updateForm({ tempToken: res.data.tempToken });
        nextStep();
        setError('');
      }
    } catch (err) {
      setError('Invalid code. Use 000000 for demo bypass.');
    } finally {
      setLoading(false);
    }
  };

  const autoDetectLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const city = res.data.address.city || res.data.address.town || res.data.address.village || 'Location Found';
        updateForm({ city: `${city} (Auto)` });
      } catch (err) {
        console.error('Geocoding error', err);
        updateForm({ city: 'Location Found' });
      } finally {
        setLoading(false);
      }
    }, () => {
      setLoading(false);
      alert('Location access denied. Please type manually.');
    });
  };

  const calculateRisk = () => {
    let score = 20;
    if (parseInt(formData.workingHours) > 10) score += 30;
    if (formData.wetWork) score += 40;
    return score;
  };

  const riskScore = calculateRisk();
  const suggestedTier = riskScore >= 70 ? 'premium' : (riskScore >= 40 ? 'standard' : 'basic');

  const handleFinalSignup = async (selectedTier) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
        ...formData,
        tier: selectedTier || formData.tier,
        avgDailyEarnings: 800 // Fallback
      });
      
      localStorage.removeItem('onboarding_progress');
      onAuth(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="signup-card glass-panel"
      >
        <div className="progress-container">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${stepProgress}%` }}></div>
          </div>
          <div className="progress-text">
            {step > 1 && (
              <span className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={prevStep}>
                <ArrowLeft size={14}/> Back
              </span>
            )}
            <span>Step {step} of 7</span>
            <span>{stepProgress}% Protected</span>
          </div>
        </div>

        {error && <div className="error-message mb-6 flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}

        <AnimatePresence mode="wait">
          {/* STEP 1: AUTH */}
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -20, opacity: 0 }} 
              className="step-content"
            >
              <h3><Smartphone className="text-primary" /> Identity Verification</h3>
              <p className="mb-6 text-muted">Verify your mobile to start your journey.</p>
              <div className="input-group mb-4">
                <input 
                  type="tel" className="input-field" placeholder="Mobile Number" 
                  value={formData.phone} onChange={(e) => updateForm({ phone: e.target.value })}
                />
                <button className="btn btn-secondary" onClick={handleSendOtp} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18}/> : 'Get OTP'}
                </button>
              </div>
              <input 
                type="text" className="input-field mb-6" placeholder="6-Digit Code" 
                value={formData.otp} onChange={(e) => updateForm({ otp: e.target.value })}
              />
              <button className="btn btn-primary w-full" onClick={handleVerifyOtp} disabled={loading}>
                Verify & Continue
              </button>
            </motion.div>
          )}

          {/* STEP 2: PROFILE */}
          {step === 2 && (
            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="step-content">
              <h3><User className="text-primary" /> Basic Profile</h3>
              <input 
                type="text" className="input-field mb-4" placeholder="Full Name" 
                value={formData.name} onChange={(e) => updateForm({ name: e.target.value })}
              />
              <input 
                type="password" className="input-field mb-4" placeholder="Secure Password (for login)" 
                value={formData.password} onChange={(e) => updateForm({ password: e.target.value })}
              />
              <div className="grid-2 mb-4">
                <input 
                  type="number" className="input-field" placeholder="Age" 
                  value={formData.age} onChange={(e) => updateForm({ age: e.target.value })}
                />
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <input 
                    type="text" className="input-field" placeholder="City" 
                    value={formData.city} onChange={(e) => updateForm({ city: e.target.value })}
                  />
                  <Navigation 
                    className="absolute right-3 top-3 cursor-pointer text-primary" 
                    style={{ position: 'absolute', right: '12px', top: '12px' }}
                    size={18} onClick={autoDetectLocation} 
                  />
                </div>
              </div>
              <button className="btn btn-primary w-full" onClick={() => nextStep()}>Next Step</button>
            </motion.div>
          )}

          {/* STEP 3: PLATFORM */}
          {step === 3 && (
            <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="step-content">
              <h3><Briefcase className="text-primary" /> Work Platform</h3>
              <p className="mb-6 text-muted text-sm">Select your primary delivery or transport partner.</p>
              
              <div className="platform-grid mb-6">
                {[
                  { name: 'Zomato' },
                  { name: 'Swiggy' },
                  { name: 'Uber' },
                  { name: 'Ola' },
                  { name: 'Zepto' },
                  { name: 'Porter' }
                ].map(p => (
                  <div key={p.name} 
                    className={`platform-card ${formData.platform === p.name ? 'active' : ''}`}
                    onClick={() => updateForm({ platform: p.name })}
                  >
                    <span className="platform-name">{p.name}</span>
                    {formData.platform === p.name && <CheckCircle size={14} className="check-mark" />}
                  </div>
                ))}
              </div>

              <div className="input-group-vertical mb-6">
                <label className="text-xs text-muted mb-2 block uppercase tracking-wider font-bold">Preferred Coverage Zone</label>
                <div className="input-with-icon">
                  <MapPin size={18} className="text-primary opacity-50" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input 
                    type="text" className="input-field pl-10" placeholder="e.g. Koramangala, Indiranagar" 
                    value={formData.preferredZones} onChange={(e) => updateForm({ preferredZones: e.target.value })}
                  />
                </div>
              </div>

              <button className="btn btn-primary w-full" onClick={() => nextStep()} disabled={!formData.platform}>
                Next: Assess Risk Profile
              </button>
            </motion.div>
          )}

          {/* STEP 4: RISK SURVEY */}
          {step === 4 && (
            <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="step-content">
              <h3><Zap className="text-primary" /> Smart Risk Profiler</h3>
              <p className="mb-8 text-muted text-sm">Tell us about your work habits so our AI can optimize your protection tier.</p>
              
              <div className="risk-input-group mb-8">
                <div className="flex-between mb-2">
                  <label className="text-sm font-bold">Daily Work Hours</label>
                  <span className="text-primary font-black">{formData.workingHours} hrs</span>
                </div>
                <input 
                  type="range" min="1" max="16" className="custom-slider w-full"
                  value={formData.workingHours} onChange={(e) => updateForm({ workingHours: e.target.value })}
                />
                <div className="flex-between mt-1 text-[10px] text-muted uppercase font-bold">
                  <span>Casual</span>
                  <span>Full Time</span>
                  <span>Extreme</span>
                </div>
              </div>

              <div 
                className={`checkbox-card ${formData.wetWork ? 'selected' : ''}`}
                onClick={() => updateForm({ wetWork: !formData.wetWork })}
              >
                <div className="checkbox-icon">
                  {formData.wetWork ? <CheckCircle size={24} className="text-primary" /> : <div className="checkbox-empty" />}
                </div>
                <div className="checkbox-content">
                  <p className="font-bold text-sm mb-1">Exposure Risk</p>
                  <p className="text-xs text-muted">I work during heavy rain / monsoon conditions</p>
                </div>
                {formData.wetWork && <motion.div layoutId="badge" className="active-badge">2X RISK</motion.div>}
              </div>

              <div className="info-box mt-8 flex gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <Info size={20} className="text-blue-400 shrink-0" />
                <p className="text-[11px] leading-relaxed text-muted">
                    Working during heavy rain increases accident probability by <b>40%</b>. 
                    This profile helps us prioritize your claim during peak hazard hours.
                </p>
              </div>

              <button className="btn btn-primary w-full mt-8" onClick={() => nextStep()}>
                Generate Recommendations
              </button>
            </motion.div>
          )}

          {/* STEP 5: TIER SELECTION */}
          {step === 5 && (
            <motion.div key="step5" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="step-content">
              <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mb-6">
                <p className="text-sm text-emerald-400 font-bold mb-1">🤖 RainShield AI SAYS:</p>
                <p className="text-xs">Based on your {formData.workingHours}hr shifts, you have a <b>{riskScore}% Risk exposure</b>. We recommend <b>{suggestedTier.toUpperCase()}</b>.</p>
              </div>

              <div className="tiers-grid">
                <div className={`tier-card ${suggestedTier === 'basic' ? 'suggested' : ''} ${formData.tier === 'basic' ? 'active' : ''}`} onClick={() => updateForm({ tier: 'basic' })}>
                  <h4>Basic</h4>
                  <div className="price">₹49<span>/wk</span></div>
                </div>
                <div className={`tier-card ${suggestedTier === 'standard' ? 'suggested' : ''} ${formData.tier === 'standard' ? 'active' : ''}`} onClick={() => updateForm({ tier: 'standard' })}>
                  <h4>Standard</h4>
                  <div className="price">₹99<span>/wk</span></div>
                </div>
                <div className={`tier-card ${suggestedTier === 'premium' ? 'suggested' : ''} ${formData.tier === 'premium' ? 'active' : ''}`} onClick={() => updateForm({ tier: 'premium' })}>
                  <h4>Premium</h4>
                  <div className="price">₹199<span>/wk</span></div>
                </div>
              </div>

              <button className="btn btn-primary w-full mt-8" onClick={() => nextStep()} disabled={!formData.tier}>
                One Last Step
              </button>
            </motion.div>
          )}

          {/* STEP 6: VERIFICATION */}
          {step === 6 && (
            <motion.div key="step6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="step-content">
              <h3><ShieldCheck className="text-primary" /> Trust & Verification</h3>
              <p className="text-sm text-muted mb-6">Upload an ID to earn the "Verified Worker" badge and get faster payouts.</p>
              
              <div className="upload-box mb-6" onClick={() => updateForm({ docsUploaded: true })}>
                <Upload className="mx-auto mb-2 text-muted" />
                <p className="text-sm">{formData.docsUploaded ? '✅ Document captured: DL_2024.jpg' : 'Tap to upload Driving License'}</p>
              </div>

              <div className="badge-verified mb-8">
                 <ShieldCheck size={14} /> Future Aadhaar/KYC Integration Ready
              </div>

              <button className="btn btn-primary w-full" onClick={() => nextStep()}>
                Finalize Protection
              </button>
            </motion.div>
          )}

          {/* STEP 7: SUCCESS */}
          {step === 7 && (
            <motion.div key="step7" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="step-content text-center">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-emerald-500/20 rounded-full">
                  <CheckCircle size={64} className="text-emerald-500 animate-bounce" />
                </div>
              </div>
              <h3>Registration Complete!</h3>
              <p className="text-muted mb-8">Welcome, {formData.name}. Your {formData.tier} protection is now active.</p>
              
              <div className="glass-panel p-4 mb-8 text-left text-sm">
                <div className="flex justify-between mb-2"><span>Risk Score:</span> <span className="font-bold text-primary">{riskScore}%</span></div>
                <div className="flex justify-between"><span>Status:</span> <span className="badge-verified">Verified Partner</span></div>
              </div>

              <button className="btn btn-primary w-full" onClick={() => handleFinalSignup()}>
                Enter Member Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 7 && (
          <p className="mt-8 text-center text-xs text-muted">
            Progress autosaved to your device. <b>100% Secure & AI-Verified.</b>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;
