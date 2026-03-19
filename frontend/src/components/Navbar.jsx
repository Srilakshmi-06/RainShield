import React from 'react';
import { NavLink } from 'react-router-dom';
import { CloudRain, UserCircle, Menu } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar glass-panel">
      <div className="container nav-content">
        <NavLink to="/" className="brand">
          <CloudRain className="brand-icon" size={28} />
          <span className="brand-text">RainShield</span>
        </NavLink>
        
        <div className="nav-links">
          {user && <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Dashboard</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Admin Panel</NavLink>}
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>How it Works</NavLink>
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="user-profile">
               <span className="user-name">{user.name}</span>
               <button onClick={onLogout} className="btn btn-secondary nav-login">Logout</button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-secondary nav-login">Login</NavLink>
              <NavLink to="/signup" className="btn btn-primary nav-login" style={{ marginLeft: '10px' }}>Join Now</NavLink>
            </>
          )}
          <Menu className="mobile-menu" size={24} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
