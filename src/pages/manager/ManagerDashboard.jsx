import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, StatusBadge, EmptyState } from '../../components/common/UI';
import { api, getUserName } from '../../utils/api';

export default function ManagerDashboard() {
  const navigate  = useNavigate();
  const [lots, setLots]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading] = useState(true);
  const name = getUserName();
  const email = localStorage.getItem('email');

  useEffect(() => {
    Promise.all([
      api.get('/api/lots/my-lots'),
      api.get(`/api/analytics/manager?email=${email}`)
    ])
      .then(([l, s]) => { setLots(l); setSummary(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [email]);

  const totalSpots     = summary?.totalSpots || lots.reduce((s, l) => s + l.totalSpots, 0);
  const totalOccupied  = summary?.totalOccupiedSpots || 0;
  const totalAvailable = totalSpots - totalOccupied;
  const openLots       = lots.filter(l => l.open).length;
  const pendingLots    = lots.filter(l => !l.approved).length;
  const occupancyRate  = summary?.platformOccupancyRate || (totalSpots > 0 ? (totalOccupied / totalSpots) * 100 : 0);

  return (
    <ManagerLayout
      title="Manager Dashboard"
      subtitle={`Welcome, ${name?.split(' ')[0] || 'Manager'} 👋`}
      topbarRight={
        <button className="btn btn-primary btn-sm"
          onClick={() => navigate('/manager/lots')}>
          Manage Lots
        </button>
      }
    >

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 40 }}>
        <div className="stat-card">
          <div className="stat-icon ic-accent">❖</div>
          <div className="stat-kicker">Total Lots</div>
          <div className="stat-number">{lots.length}</div>
          <div className="stat-kicker" style={{ textTransform: 'none', fontSize: '0.75rem', marginTop: 4, letterSpacing: 'normal' }}>{openLots} currently open</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ic-info">◎</div>
          <div className="stat-kicker">Total Spots</div>
          <div className="stat-number">{totalSpots}</div>
          <div className="stat-kicker" style={{ textTransform: 'none', fontSize: '0.75rem', marginTop: 4, letterSpacing: 'normal' }}>{totalAvailable} available</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ic-warning">⏳</div>
          <div className="stat-kicker">Pending Approval</div>
          <div className="stat-number">{pendingLots}</div>
          <div className="stat-kicker" style={{ textTransform: 'none', fontSize: '0.75rem', marginTop: 4, letterSpacing: 'normal' }}>Awaiting admin review</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ic-success">%</div>
          <div className="stat-kicker">Occupancy</div>
          <div className="stat-number">
            {occupancyRate.toFixed(0)}%
          </div>
          <div className="stat-kicker" style={{ textTransform: 'none', fontSize: '0.75rem', marginTop: 4, letterSpacing: 'normal' }}>Across all lots</div>
        </div>
      </div>

      {/* Lots list */}
      <div>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>My Parking Lots</h3>
        </div>

        {loading ? <Spinner /> : lots.length === 0 ? (
          <EmptyState icon="🏢" title="No lots registered yet"
            message="Register your first parking facility."
            action={
              <button className="btn btn-primary"
                onClick={() => navigate('/manager/lots')}>
                Register Lot
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lot Name</th>
                  <th>City</th>
                  <th>Spots</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lots.map(lot => (
                  <tr key={lot.lotId}>
                    <td><strong style={{ fontWeight: 600 }}>{lot.name}</strong></td>
                    <td style={{ color: 'var(--text-soft)' }}>{lot.city}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{lot.availableSpots} / {lot.totalSpots}</td>
                    <td>
                      <StatusBadge status={lot.open ? 'AVAILABLE' : 'OCCUPIED'} />
                    </td>
                    <td>
                      <span className={`badge ${lot.approved ? 'badge-success' : 'badge-warning'}`}>
                        {lot.approved ? '✓ APPROVED' : 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          style={{ borderRadius: 999, background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', color: 'var(--text)', fontSize: '0.7rem', fontWeight: 800, padding: '6px 16px', cursor: 'pointer', letterSpacing: '0.05em' }}
                          onClick={() => navigate(`/manager/lots/${lot.lotId}/spots`)}>
                          SPOTS
                        </button>
                        <button 
                          style={{ borderRadius: 999, background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', color: 'var(--text)', fontSize: '0.7rem', fontWeight: 800, padding: '6px 16px', cursor: 'pointer', letterSpacing: '0.05em' }}
                          onClick={() => navigate(`/manager/lots/${lot.lotId}/bookings`)}>
                          BOOKINGS
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
