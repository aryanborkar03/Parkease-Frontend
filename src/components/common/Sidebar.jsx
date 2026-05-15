import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUserName, getEmail, getRole } from '../../utils/api';
import LogoSvg from '../../assets/parkease-car-universal.svg';

export default function Sidebar({ navItems, title, onMenuToggle, mobileOpen, isPremium = false }) {
  const navigate = useNavigate();
  const name = getUserName() || 'User';
  const email = getEmail() || '';
  const role = getRole() || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const roleLabel = {
    DRIVER: 'Driver',
    LOT_MANAGER: 'Lot Manager',
    ADMIN: 'Administrator',
  }[role] || role;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  // Close sidebar on nav link click (mobile only)
  const handleNavClick = () => {
    if (mobileOpen && onMenuToggle) onMenuToggle();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onMenuToggle}
        />
      )}

      <aside className={`dash-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Mobile close button */}
        <button
          className="sidebar-close-btn"
          onClick={onMenuToggle}
          aria-label="Close menu"
        >
          ✕
        </button>

        {/* Logo */}
        {/* Logo */}
        <div className="sb-logo">
          <img src={LogoSvg} style={{ width: 38, height: 38 }} alt="ParkEase Icon" />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="sb-logo-name" style={{ lineHeight: 1 }}>ParkEase</div>
            {isPremium && (
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.65rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #fde047 0%, #fbbf24 50%, #ea580c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.15em',
                marginTop: '4px',
                filter: 'drop-shadow(0 2px 4px rgba(234,88,12,0.2))'
              }}>
                Premium
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {title && <div className="sb-group-label">{title}</div>}
          {navItems.map((item, i) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <span className="sb-item-dot"></span>
              {item.label}
              <span className="sb-item-num">{String(i + 1).padStart(2, '0')}</span>
              {item.badge > 0 && (
                <span className="badge badge-danger" style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.65rem' }}>{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="sb-user">
          <div className="sb-user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div className="sb-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div className="sb-user-role">{roleLabel}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
          >
            ↩
          </button>
        </div>
      </aside>
    </>
  );
}
