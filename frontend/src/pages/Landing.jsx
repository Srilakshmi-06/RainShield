import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, ArrowRight, CloudRain, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-content"
        >
          <div className="badge-glow">Parametric AI Insurance</div>
          <h1>Protect Your Gig Earnings from <span className="text-gradient">Nature's Chaos</span></h1>
          <p className="hero-description">
            RainShield provides instant, automatic payouts for delivery partners and gig workers 
            when severe weather or pollution hits your zone. No claims, no paperwork, just protection.
          </p>
          <div className="hero-btns">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Covered Now <ArrowRight size={20} style={{ marginLeft: '10px' }} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Member Login</Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="hero-visual"
        >
          <div className="hero-card glass-panel animate-float">
             <div className="flex-between mb-4">
                <CloudRain className="text-primary" />
                <span className="live-badge">TRIGGER ACTIVE</span>
             </div>
             <div className="price">₹1,200</div>
             <p className="text-muted">Instant Payout for Mumbai Zone 4</p>
             <div className="payout-bar mt-4">
                <div className="progress" style={{ width: '100%' }}></div>
             </div>
             <p className="mt-2" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Successfully processed via UPI</p>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="features container py-20">
        <h2 className="section-title">Why RainShield?</h2>
        <div className="features-grid mt-12">
          
          <div className="feature-card glass-panel">
            <div className="feat-icon bg-blue"><Zap /></div>
            <h3>Automatic Payouts</h3>
            <p>Our AI detects weather triggers (Rain, AQI, Heat) and initiates payouts instantly to your bank. You don't even have to ask.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon bg-green"><Shield /></div>
            <h3>Zero Paperwork</h3>
            <p>No more fighting with insurance agents. We use real-time environmental data to validate every claim automatically.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon bg-orange"><TrendingUp /></div>
            <h3>Income Stability</h3>
            <p>Calculate your coverage based on your average daily earnings. We ensure you take home your daily pay, rain or shine.</p>
          </div>

          <div className="feature-card glass-panel">
             <div className="feat-icon bg-gray"><Clock /></div>
             <h3>Weekly Flexibility</h3>
             <p>Small weekly premiums starting from just ₹49. Active only when you are working. Cancel or pause anytime.</p>
          </div>

        </div>
      </section>

      {/* Footer / CTA */}
      <section className="cta-section container py-20 text-center">
         <div className="glass-panel cta-box">
            <h2>Join 4,500+ Workers Already Protected</h2>
            <p>Currently active in Mumbai, Delhi, Bangalore and Hyderabad.</p>
            <Link to="/signup" className="btn btn-primary mt-6">Create Your Protection Plan</Link>
         </div>
      </section>
    </div>
  );
};

export default Landing;
