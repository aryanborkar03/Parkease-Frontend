import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, StatusBadge, EmptyState } from '../../components/common/UI';
import { api, getUserName } from '../../utils/api';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const name = getUserName();

  useEffect(() => {
    Promise.all([
      api.get('/api/bookings/my'),
      api.get('/api/payments/my').catch(() => []),
      api.get('/api/pass/transactions').catch(() => []),
    ])
      .then(([allBookings, paymentsData, passTxns]) => {
        setBookings(allBookings);
        setRecentBookings(allBookings.slice(0, 5));

        // Count bookings paid via Razorpay OR via Pass
        const paidIds = new Set([
          ...paymentsData.filter(p => p.status === 'PAID').map(p => p.bookingId),
          ...passTxns.map(t => t.bookingId),
        ]);
        const spent = allBookings.reduce((sum, b) => {
          if (!paidIds.has(b.bookingId)) return sum;
          const amt = b.totalAmount > 0 ? b.totalAmount : (b.estimatedAmount || 0);
          return sum + amt;
        }, 0);
        setTotalSpent(spent);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active    = bookings.filter(b => b.status === 'ACTIVE').length;
  const reserved  = bookings.filter(b => b.status === 'RESERVED').length;
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <DriverLayout
      title="Driver Dashboard"
      subtitle={`Welcome, ${name ? name.split(' ')[0] : 'Driver'} 👋`}
      topbarRight={
        <button className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px', borderRadius: '999px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          onClick={() => navigate('/driver/search')}>
          + Find Parking
        </button>
      }
    >
      {/* Stat Cards */}
      <div className="stat-grid">
        <div key="active" className="stat-card">
          <div className="stat-icon ic-accent">◈</div>
          <div className="stat-kicker">Active Parking</div>
          <div className="stat-number">{active}</div>
          <div className="stat-sub">Currently parked</div>
        </div>
        <div key="reserved" className="stat-card">
          <div className="stat-icon ic-info">◎</div>
          <div className="stat-kicker">Reserved</div>
          <div className="stat-number">{reserved}</div>
          <div className="stat-sub">Upcoming bookings</div>
        </div>
        <div key="completed" className="stat-card">
          <div className="stat-icon ic-success">✓</div>
          <div className="stat-kicker">Completed</div>
          <div className="stat-number">{completed}</div>
          <div className="stat-sub">Total trips</div>
        </div>
        <div key="spent" className="stat-card">
          <div className="stat-icon ic-warning">₹</div>
          <div className="stat-kicker">Total Spent</div>
          <div className="stat-number">
            ₹{Math.trunc(totalSpent)}
          </div>
          <div className="stat-sub">All time</div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{ marginTop: 32 }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0, textTransform: 'uppercase', letterSpacing: '0.02em', fontSize: '0.95rem' }}>RECENT BOOKINGS</div>
          <button className="btn btn-outline btn-sm"
            style={{ borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--accent)', borderColor: 'var(--accent)', padding: '6px 14px' }}
            onClick={() => navigate('/driver/bookings')}>
            VIEW ALL →
          </button>
        </div>

        {loading ? <Spinner /> : recentBookings.length === 0 ? (
          <EmptyState icon="🅿" title="No bookings yet"
            message="Find a parking spot to get started."
            action={
              <button className="btn btn-primary"
                onClick={() => navigate('/driver/search')}>
                Find Parking
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Spot</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.bookingId}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>#{b.bookingId}</td>
                    <td>{b.spotId ? `Spot #${b.spotId}` : 'Spot'}</td>
                    <td>{b.startTime ? new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                    <td>{b.endTime ? new Date(b.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{b.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
