import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LogoSvg from '../../assets/parkease-car-universal.svg';

export default function GuestLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="guest-layout">
      {/* Public navbar */}
      <nav className="guest-nav">
        <div className="guest-nav-inner">
          <div className="pub-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={LogoSvg} style={{ width: 36, height: 36 }} alt="ParkEase Icon" />
            <div className="pub-logo-name" style={{ color: 'var(--text)' }}>ParkEase</div>
          </div>
          <div className="guest-nav-actions">
            <Link to="/login"    className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary  btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="guest-main">
        {children}
      </main>
    </div>
  );
}
