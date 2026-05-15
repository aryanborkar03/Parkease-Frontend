import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { api, getToken } from '../../utils/api';

export default function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const token = getToken();

  useEffect(() => {
    if (!token) return;
    api.get('/api/bookings/admin/all')
      .then(data => { setBookings(data); setFiltered(data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    let result = bookings;
    if (statusFilter !== 'ALL') result = result.filter(b => b.status === statusFilter);
    if (search.trim()) result = result.filter(b =>
      b.driverEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.vehiclePlate?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, statusFilter, bookings]);

  const totalRevenue = bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <AdminLayout
      title="All Bookings"
      subtitle={`${bookings.length} bookings · ₹${totalRevenue.toFixed(2)} revenue 📋`}
    >

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', minWidth: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--muted)', pointerEvents: 'none' }}>🔍</span>
            <input className="form-control" placeholder="Search by email or plate..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, fontSize: '0.85rem' }} />
          </div>
          <select className="form-control" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)} style={{ width: 160, fontSize: '0.85rem' }}>
            {['ALL','RESERVED','ACTIVE','COMPLETED','CANCELLED'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="📋" title="No bookings found" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Driver</th><th>Lot</th><th>Spot</th>
                  <th>Vehicle</th><th>Type</th><th>Status</th>
                  <th>Start</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.bookingId}>
                    <td><strong>#{b.bookingId}</strong></td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.driverEmail}</td>
                    <td>#{b.lotId}</td>
                    <td>#{b.spotId}</td>
                    <td>{b.vehiclePlate}</td>
                    <td><span className="badge badge-muted">{b.bookingType?.replace('_',' ')}</span></td>
                    <td><StatusBadge status={b.status} /></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(b.startTime).toLocaleDateString()}</td>
                    <td>
                      {b.totalAmount > 0
                        ? <strong>₹{b.totalAmount}</strong>
                        : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
