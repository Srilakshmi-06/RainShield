import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Phone, Lock, LogIn } from 'lucide-react';
import BACKEND_URL from '../config';
import '../pages/Signup.css'; // Reusing signup styles

const Login = ({ onAuth }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { phone, password });
      onAuth(res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
      <div className="signup-card glass-panel" style={{ maxWidth: '400px', padding: '3rem 2.5rem' }}>
        <div className="signup-header">
          <h2 style={{ fontSize: '1.75rem' }}>Welcome Back</h2>
          <p>Login to your worker dashboard</p>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem', color: '#ff4d4d', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin} className="mt-6">
          <div className="mb-4">
            <input
              type="tel"
              className="input-field"
              placeholder="Mobile Number (+91)"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              className="input-field"
              placeholder="Password or OTP"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ padding: '0.875rem' }}>
            {loading ? 'Authenticating...' : 'Login securely'}
          </button>
        </form>

        <p className="mt-4" style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Demo Admin: 999 / admin
        </p>

        <p className="mt-6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign up</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;
