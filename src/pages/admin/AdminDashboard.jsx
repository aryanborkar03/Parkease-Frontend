import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api, getUserName, getToken } from '../../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const name = getUserName();
  const token = getToken();

  useEffect(() => {
    if (!token) return;
    api.get('/api/analytics/platform')
      .then(setPlatform)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AdminLayout 
      title="Admin Dashboard"
      subtitle={`Welcome, ${name?.split(' ')[0] || 'Admin'} 👋`}
    >

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : (
        <>
          <div className="stat-grid">
            {[
              { icon: '🏢', label: 'Active Lots',     value: platform?.totalActiveLots    || 0, sub: 'Approved lots', cls: 'blue'   },
              { icon: '🅿',  label: 'Total Spots',     value: platform?.totalSpots         || 0, sub: `${platform?.totalOccupiedSpots || 0} occupied`, cls: 'green' },
              { icon: '📋', label: 'Bookings Today',  value: platform?.totalBookingsToday || 0, sub: `${platform?.totalBookingsAllTime || 0} all time`, cls: 'orange' },
              { icon: '💰', label: 'Revenue Today',   value: `₹${(platform?.totalRevenueToday || 0).toFixed(0)}`, sub: `₹${(platform?.totalRevenueAllTime || 0).toFixed(0)} all time`, cls: 'purple' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div className="stat-info">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Analytics Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: 24 }}>
            
            {/* Occupancy Chart */}
            <div className="card">
              <div className="row-between mb-16">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Platform Occupancy</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '140px' }}>
                <div className="row-between" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>
                  <span>{platform?.totalOccupiedSpots} occupied</span>
                  <span>{(platform?.platformOccupancyRate || 0).toFixed(1)}%</span>
                </div>
                <div className="progress-bar" style={{ height: '12px', borderRadius: '6px' }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${platform?.platformOccupancyRate || 0}%`, background: (platform?.platformOccupancyRate || 0) > 80 ? 'var(--danger)' : (platform?.platformOccupancyRate || 0) > 50 ? 'var(--warning)' : 'var(--success)', borderRadius: '6px' }}
                  />
                </div>
                <div className="row-between" style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-soft)' }}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { icon: '👥', title: 'Manage Users',    desc: 'View, suspend or delete user accounts.', path: '/admin/users',    btn: 'Manage Users'   },
              { icon: '🏢', title: 'Approve Lots',    desc: 'Review and approve new lot registrations.', path: '/admin/lots', btn: 'Review Lots'    },
              { icon: '📋', title: 'All Bookings',    desc: 'Platform-wide booking history.',         path: '/admin/bookings', btn: 'View Bookings'  },
              { icon: '📊', title: 'Platform Analytics', desc: 'Revenue and occupancy analytics.',   path: '/admin/analytics', btn: 'View Analytics' },
            ].map(c => (
              <div key={c.title} className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(c.path)}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{c.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: 6 }}>{c.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 20 }}>{c.desc}</p>
                <div style={{ marginTop: 'auto' }}>
                  <button className="btn btn-outline btn-sm">{c.btn} →</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
