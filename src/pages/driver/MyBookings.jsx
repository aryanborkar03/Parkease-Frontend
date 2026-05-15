import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, StatusBadge, Alert, Modal, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

/* Pure visual helper functions */

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function calcDuration(start, end) {
  // Guard: null/undefined fields (e.g. endTime missing in old DB rows) must not
  // fall through to new Date(null) which returns epoch and gives a huge negative.
  if (!start || !end) return '—';
  const startMs = new Date(start).getTime();
  const endMs   = new Date(end).getTime();
  if (isNaN(startMs) || isNaN(endMs)) return '—';

  const totalMins = Math.round((endMs - startMs) / 60000);
  if (totalMins <= 0) return '—';

  const d = Math.floor(totalMins / 1440);          // full days
  const h = Math.floor((totalMins % 1440) / 60);   // remaining hours
  const m = totalMins % 60;                         // remaining minutes

  if (d === 0 && h === 0) return `${m}m`;
  if (d === 0 && m === 0) return `${h}h`;
  if (d === 0)            return `${h}h ${m}m`;
  if (h === 0 && m === 0) return `${d}d`;
  if (m === 0)            return `${d}d ${h}h`;
  if (h === 0)            return `${d}d ${m}m`;
  return `${d}d ${h}h ${m}m`;
}

function groupByDate(bookings) {
  const today = new Date().toDateString();
  const groups = {};
  bookings.forEach(b => {
    const d = new Date(b.startTime);
    const key = d.toDateString();
    if (!groups[key]) groups[key] = { label: '', bookings: [] };
    groups[key].bookings.push(b);
    if (key === today) {
      groups[key].label = `Today — ${fmtDate(b.startTime)}`;
    } else {
      groups[key].label = `Earlier — ${fmtDate(b.startTime)}`;
    }
  });
  // Sort groups: today first, then descending
  return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
}

function calcStats(bookings, paidBookingIds) {
  const total = bookings.length;
  let totalMins = 0;
  let totalSpent = 0;
  let allClear = true;

  bookings.forEach(b => {
    if (b.startTime && b.endTime) {
      totalMins += Math.max(0, Math.round((new Date(b.endTime) - new Date(b.startTime)) / 60000));
    }
    const amt = b.totalAmount > 0 ? b.totalAmount : b.estimatedAmount;
    if (paidBookingIds.has(b.bookingId)) totalSpent += amt;
    if (b.status === 'COMPLETED' && b.totalAmount > 0 && !paidBookingIds.has(b.bookingId)) {
      allClear = false;
    }
  });

  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const hoursParked = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return { total, hoursParked, totalSpent, allClear };
}

/* Status badge colors using design-system tokens */
function statusBadgeClass(status) {
  if (status === 'COMPLETED') return 'badge badge-success';
  if (status === 'ACTIVE')    return 'badge badge-info';
  if (status === 'RESERVED')  return 'badge badge-accent';
  return 'badge badge-muted';
}

/* BookingCard Sub-component */
function BookingCard({ b, paidBookingIds, canCheckIn, canCheckOut, canCancel, canExtend, canPay, isPaid, onAction, onPay, onExtend }) {
  const amt = b.totalAmount > 0 ? b.totalAmount : b.estimatedAmount;

  // Priority 1: use actual check-in → check-out when both are present and valid.
  // Priority 2: fall back to the originally booked start → end window.
  // Priority 3: nothing valid → pass nulls so calcDuration returns '—'.
  const isValid = (a, b) => !!(a && b &&
    !isNaN(new Date(a).getTime()) && !isNaN(new Date(b).getTime()) &&
    new Date(b) > new Date(a)
  );

  let effectiveStart, effectiveEnd;
  if (isValid(b.checkInTime, b.checkOutTime)) {
    effectiveStart = b.checkInTime;
    effectiveEnd   = b.checkOutTime;
  } else if (isValid(b.startTime, b.endTime)) {
    effectiveStart = b.startTime;
    effectiveEnd   = b.endTime;
  } else {
    effectiveStart = null;
    effectiveEnd   = null;
  }

  const timeRange = `${fmtTime(b.startTime)} → ${fmtTime(b.endTime)}`;
  const duration  = calcDuration(effectiveStart, effectiveEnd);

  return (
    <div className="booking-card" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Zone 1: Header Row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: '0.95rem', letterSpacing: '0.01em', color: 'var(--text)'
          }}>
            Booking #{b.bookingId}
          </span>
          <span style={{
            fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-soft)'
          }}>
            {timeRange}
          </span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 800, color: 'var(--muted)',
            background: 'var(--offset)', borderRadius: '999px',
            padding: '2px 10px', letterSpacing: '0.03em', whiteSpace: 'nowrap'
          }}>
            {duration}
          </span>
        </div>
        <span className={statusBadgeClass(b.status)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Hairline Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0' }} />

      {/* Zone 2: Metadata Grid */}
      <div className="booking-meta-grid">
        {/* Vehicle */}
        <div className="booking-meta-cell">
          <div className="booking-detail-label">Vehicle</div>
          <div style={{
            fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem',
            color: 'var(--info)', letterSpacing: '0.04em'
          }}>
            {b.vehiclePlate}
          </div>
        </div>

        {/* Spot · Lot */}
        <div className="booking-meta-cell">
          <div className="booking-detail-label">Spot · Lot</div>
          <div className="booking-detail-val">
            Spot #{b.spotId} · Lot #{b.lotId}
          </div>
        </div>

        {/* Date */}
        <div className="booking-meta-cell">
          <div className="booking-detail-label">Date</div>
          <div className="booking-detail-val">{fmtDate(b.startTime)}</div>
        </div>
      </div>

      {/* Hairline Divider */}
      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Zone 3: Footer Actions Row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', gap: 12, flexWrap: 'wrap'
      }}>
        {/* Left: amount + payment status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: '1.4rem', color: 'var(--text)', lineHeight: 1
          }}>
            ₹{Number(amt).toFixed(2)}
          </span>
          {paidBookingIds.has(b.bookingId) ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>
              ✓ Payment successful
            </span>
          ) : canPay(b) ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 700 }}>
              Payment pending
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>—</span>
          )}
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Functional action buttons */}
          {b.status === 'RESERVED' && (
            <>
              <button
                className="btn btn-primary btn-sm"
                disabled={!canCheckIn(b)}
                onClick={() => onAction(`/api/bookings/${b.bookingId}/checkin`)}
              >
                Check In
              </button>
              {!canCheckIn(b) && (
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
                  Available at {new Date(b.startTime).toLocaleTimeString()}
                </span>
              )}
            </>
          )}
          {canCheckOut(b) && (
            <button className="btn btn-outline btn-sm"
              onClick={() => onAction(`/api/bookings/${b.bookingId}/checkout`)}>
              Check Out
            </button>
          )}
          {canExtend(b) && (
            <button className="btn btn-outline btn-sm"
              onClick={() => onExtend(b.bookingId)}>
              Extend
            </button>
          )}
          {canCancel(b) && (
            <button className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)' }}
              onClick={() => onAction(`/api/bookings/${b.bookingId}/cancel`)}>
              Cancel
            </button>
          )}
          {canPay(b) && (
            <button className="btn btn-primary btn-sm" onClick={() => onPay(b.bookingId, b.totalAmount)}>
              Pay ₹{Number(b.totalAmount).toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Main Page Component */
export default function MyBookings() {
  const navigate  = useNavigate();
  const location  = useLocation();   // Capture location state for post-payment redirect handling

  const [bookings, setBookings] = useState([]);
  const [paidBookingIds, setPaidBookingIds] = useState(new Set());
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [extendModal, setExtendModal] = useState(null);
  const [newEndTime, setNewEndTime]   = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/bookings/my'),
      api.get('/api/payments/my').catch(() => []),
      api.get('/api/pass/transactions').catch(() => []),
    ])
      .then(([bookingsData, paymentsData, passTxns]) => {
        setBookings(bookingsData);
        // Include both Razorpay-paid and Pass-paid booking IDs
        const razorpayPaid = paymentsData
          .filter(p => p.status === 'PAID')
          .map(p => p.bookingId);
        const passPaid = passTxns.map(t => t.bookingId);
        setPaidBookingIds(new Set([...razorpayPaid, ...passPaid]));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Re-fetch bookings on component mount and subsequent route navigations
  useEffect(() => {
    load();
    // Show success message passed from PaymentPage via navigation state
    if (location.state?.success) {
      setSuccess(location.state.success);
      // Clear state so message doesn't re-appear on manual refresh
      window.history.replaceState({}, '');
    }
  }, [location.key]);

  useEffect(() => {
  const interval = setInterval(() => {
    setBookings(prev => [...prev]); // triggers re-render
  }, 1000);

  return () => clearInterval(interval);
}, []);

  const action = async (path, body = null) => {
    setError('');
    try {
      await api.put(path, body);
      setSuccess('Action completed successfully!');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExtend = async () => {
    if (!newEndTime) return;
    // Append seconds to satisfy backend datetime formatting requirements
    const formatted = newEndTime.length === 16 ? `${newEndTime}:00` : newEndTime;
    await action(`/api/bookings/${extendModal}/extend`, { newEndTime: formatted });
    setExtendModal(null);
  };

  // Status-based functional access control policies
  const canCheckIn = (b) => {
  if (b.status !== 'RESERVED') return false;

  const now = new Date().getTime();
  const start = new Date(b.startTime).getTime();

  return now >= start;
  };
  const canCheckOut = b => b.status === 'ACTIVE';
  const canCancel   = b => b.status === 'RESERVED';
  const canExtend   = b => b.status === 'ACTIVE' || b.status === 'RESERVED';

  // Evaluate payment eligibility based on booking lifecycle state
  const canPay = b => b.status === 'COMPLETED' && b.totalAmount > 0 && !paidBookingIds.has(b.bookingId);
  const isPaid = b => b.status === 'COMPLETED' && b.totalAmount > 0 && paidBookingIds.has(b.bookingId);

  /* Derived Statistical Metrics */
  const stats = calcStats(bookings, paidBookingIds);

  return (
    <DriverLayout title="My Bookings" subtitle="Manage your parking reservations 📋">

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : bookings.length === 0 ? (
        <EmptyState icon="📋" title="No bookings yet"
          message="Book a parking spot to get started."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/driver/search')}>
              Find Parking
            </button>
          }
        />
      ) : (
        <>
          {/* Summary Statistics Panel */}
          <div className="stat-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-icon ic-accent">📋</div>
              <div className="stat-kicker">Total Bookings</div>
              <div className="stat-number">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon ic-info">⏱</div>
              <div className="stat-kicker">Hours Parked</div>
              <div className="stat-number">{stats.hoursParked}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon ic-warning">₹</div>
              <div className="stat-kicker">Total Spent</div>
              <div className="stat-number">₹{Number(stats.totalSpent).toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon ic-success">✓</div>
              <div className="stat-kicker">Payment Status</div>
              <div className="stat-number" style={{
                fontSize: '1.2rem',
                color: stats.allClear ? 'var(--success)' : 'var(--warning)'
              }}>
                {stats.allClear ? 'All clear' : 'Pending'}
              </div>
            </div>
          </div>

          {/* Chronological Booking Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {groupByDate(bookings).map(([dateKey, group]) => (
              <div key={dateKey}>
                {/* Date group label */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '0.78rem', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--muted)'
                  }}>
                    {group.label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* Cards in this group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {group.bookings.map(b => (
                    <BookingCard
                      key={b.bookingId}
                      b={b}
                      paidBookingIds={paidBookingIds}
                      canCheckIn={canCheckIn}
                      canCheckOut={canCheckOut}
                      canCancel={canCancel}
                      canExtend={canExtend}
                      canPay={canPay}
                      isPaid={isPaid}
                      onAction={action}
                      onPay={(id, amt) => navigate(`/driver/payment/${id}`)}
                      onExtend={(id) => { setExtendModal(id); setNewEndTime(''); }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Extend Modal */}
      <Modal isOpen={!!extendModal} onClose={() => setExtendModal(null)}
        title="Extend Booking"
        footer={
          <div className="row gap-12" style={{ justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => setExtendModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleExtend}>Extend</button>
          </div>
        }
      >
        <div className="form-group">
          <label className="form-label">New End Time</label>
          <input className="form-control" type="datetime-local"
            value={newEndTime}
            min={new Date().toISOString().slice(0, 16)}
            onChange={e => setNewEndTime(e.target.value)} />
        </div>
      </Modal>
    </DriverLayout>
  );
}
