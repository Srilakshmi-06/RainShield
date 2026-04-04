import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, ArrowRight, CloudRain, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Landing.css';

const Landing = ({ user, onLogout }) => {
  return (
    <div className="landing-page">
      <Navbar user={user} onLogout={onLogout} />
      {/* Hero */}
      <section className="hero container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="hero-content"
        >
          <div className="badge-glow">Parametric AI Insurance</div>
          <h1>Protect Your Gig Earnings from <span className="text-gradient">Nature's Chaos</span></h1>
          <p className="hero-description">
            RainShield provides instant, automatic payouts for delivery partners and gig workers
            when severe weather hits your zone. No claims, no paperwork — just protection.
          </p>
          <div className="hero-btns">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Covered Now <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Member Login</Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="hero-visual"
        >
          <div className="hero-card animate-float">
            <div className="flex-between mb-4">
              <CloudRain size={22} className="text-primary" />
              <span className="live-badge">● TRIGGER ACTIVE</span>
            </div>
            <div className="price text-gradient">₹1,200</div>
            <p className="text-soft" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Instant Payout · Mumbai Zone 4</p>
            <div className="payout-bar" style={{ marginTop: '1.25rem' }}>
              <div className="progress" style={{ width: '100%' }}></div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.75rem', fontWeight: 600 }}>
              ✓ Processed via UPI in 2 seconds
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="features container py-20">
        <h2 className="section-title">Why RainShield?</h2>
        <p className="section-subtitle">Built for the gig economy. No paperwork, no delays.</p>
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feat-icon bg-blue"><Zap size={22} /></div>
            <h3>Automatic Payouts</h3>
            <p>AI detects weather triggers and initiates payouts instantly to your bank. You don't even have to ask.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feat-icon bg-green"><Shield size={22} /></div>
            <h3>Zero Paperwork</h3>
            <p>Real-time environmental data validates every claim automatically. No agents, no forms.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feat-icon bg-orange"><TrendingUp size={22} /></div>
            <h3>Income Stability</h3>
            <p>Coverage based on your average daily earnings. We ensure you take home your pay, rain or shine.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feat-icon bg-gray"><Clock size={22} /></div>
            <h3>Weekly Flexibility</h3>
            <p>Premiums from just ₹49/week. Active only when you work. Pause or cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="cta-box">
          <h2>Join 4,500+ Workers Already Protected</h2>
          <p>Active in Mumbai, Delhi, Bangalore and Hyderabad.</p>
          <Link to="/signup" className="btn btn-primary btn-lg mt-6">Create Your Protection Plan</Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
