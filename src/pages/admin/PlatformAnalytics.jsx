import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api, getToken } from '../../utils/api';

export default function PlatformAnalytics() {
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
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
      title="Platform Analytics"
      subtitle="Aggregated stats across all active parking lots 📊"
    >

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : platform && (
        <>
          {/* Main stats */}
          <div className="stat-grid">
            {[
              { icon: '🏢', label: 'Active Lots',       value: platform.totalActiveLots,            sub: 'Approved & active',      cls: 'blue'   },
              { icon: '🅿',  label: 'Platform Occupancy',value: `${(platform.platformOccupancyRate || 0).toFixed(1)}%`, sub: `${platform.totalOccupiedSpots} / ${platform.totalSpots} spots`, cls: 'green'  },
              { icon: '📋', label: 'Bookings Today',    value: platform.totalBookingsToday,         sub: `${platform.totalBookingsAllTime} all time`, cls: 'orange' },
              { icon: '💰', label: 'Revenue All Time',  value: `₹${(platform.totalRevenueAllTime || 0).toFixed(0)}`, sub: `₹${(platform.totalRevenueToday || 0).toFixed(0)} today`, cls: 'purple' },
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

          {/* Platform occupancy bar */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="row-between mb-16">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Platform Occupancy</h3>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="row-between" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>
                <span>{platform.totalOccupiedSpots} occupied</span>
                <span>{platform.totalSpots - platform.totalOccupiedSpots} available</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${platform.platformOccupancyRate || 0}%`, background: (platform.platformOccupancyRate || 0) > 80 ? 'var(--danger)' : (platform.platformOccupancyRate || 0) > 50 ? 'var(--warning)' : 'var(--success)' }}
                />
              </div>
            </div>
          </div>

          {/* Revenue summary */}
          <div className="card">
            <div className="row-between mb-16">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Revenue Overview</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                ['Today',    `₹${(platform.totalRevenueToday    || 0).toFixed(2)}`],
                ['All Time', `₹${(platform.totalRevenueAllTime  || 0).toFixed(2)}`],
              ].map(([label, value]) => (
                <div key={label} style={{
                  textAlign: 'center', padding: '32px 24px',
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-lg)', color: 'white'
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, marginTop: 8 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
