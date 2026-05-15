import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function LotBookings() {
  const { lotId } = useParams();
  const navigate  = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('ALL');

  useEffect(() => {
    api.get(`/api/bookings/lot/${lotId}`)
      .then(data => { setBookings(data); setFiltered(data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lotId]);

  const applyFilter = (status) => {
    setFilter(status);
    setFiltered(status === 'ALL' ? bookings : bookings.filter(b => b.status === status));
  };

  const counts = {
    ALL:       bookings.length,
    RESERVED:  bookings.filter(b => b.status === 'RESERVED').length,
    ACTIVE:    bookings.filter(b => b.status === 'ACTIVE').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <ManagerLayout
      title={`Bookings — Lot #${lotId}`}
      subtitle="View all reservations and check-ins for this lot 📋"
      topbarRight={
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
      }
    >

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Filter tabs */}
      <div className="tab-bar" style={{ marginBottom: 24, maxWidth: 600 }}>
        {Object.entries(counts).map(([status, count]) => (
          <div
            key={status}
            className={`tab ${filter === status ? 'active' : ''}`}
            onClick={() => applyFilter(status)}
          >
            {status} ({count})
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="📋" title="No bookings found" message="No bookings match the selected filter." />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Driver</th><th>Spot</th>
                  <th>Vehicle</th><th>Type</th>
                  <th>Start</th><th>End</th>
                  <th>Status</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.bookingId}>
                    <td><strong>#{b.bookingId}</strong></td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.driverEmail}
                    </td>
                    <td>#{b.spotId}</td>
                    <td>{b.vehiclePlate}</td>
                    <td>
                      <span className="badge badge-muted">{b.bookingType?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(b.startTime).toLocaleString()}</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(b.endTime).toLocaleString()}</td>
                    <td><StatusBadge status={b.status} /></td>
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
    </ManagerLayout>
  );
}
