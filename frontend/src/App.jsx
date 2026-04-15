import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdminDash from './pages/AdminDash';
import { AnimatePresence, motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { Bell, X } from 'lucide-react';
import BACKEND_URL from './config.js';

const socket = io(BACKEND_URL);

import ChatWidget from './components/ChatWidget';

function App() {
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(() => {
    // Basic persistence mock
    const savedUser = localStorage.getItem('shield_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('shield_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('shield_user');
  };

  useEffect(() => {
    socket.on('pushNotification', (data) => {
      setNotification(data);
      setTimeout(() => setNotification(null), 6000);
    });
    return () => socket.off('pushNotification');
  }, []);

  // Protection Wrappers
  const ProtectedRoute = ({ children, role }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      {/* Global Real-time Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="toast-notification premium-toast"
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              zIndex: 9999,
              width: '90%',
              maxWidth: '400px',
              padding: '1.25rem',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              cursor: 'pointer'
            }}
          >
            <div className="toast-content flex-start" style={{ gap: '1rem' }}>
              <div className="icon-wrapper" style={{
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                padding: '10px',
                borderRadius: '14px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <Bell size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{notification.title}</h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineWeight: 1.4 }}>{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Real-time Progress Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 6, ease: 'linear' }}
              style={{
                height: '3px',
                background: 'rgba(239, 68, 68, 0.5)',
                position: 'absolute',
                bottom: 0,
                left: 0,
                borderRadius: '0 0 20px 20px'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-content" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing user={user} onLogout={handleLogout} />} />
            <Route path="/signup" element={<Signup onAuth={handleLogin} />} />
            <Route path="/login" element={<Login onAuth={handleLogin} />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDash onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
      
      {/* Global Chatbot for logged in users */}
      {user && <ChatWidget />}
    </BrowserRouter>
  );
}

export default App;

