import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Modal, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';

// Helper to get friendly label for vehicle type (without EV indicator)
// Helper to format datetime
const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const dt = new Date(dateTime);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  const hours = String(dt.getHours()).padStart(2, '0');
  const minutes = String(dt.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const getVehicleTypeLabel = (vehicleType) => {
  if (!vehicleType) return 'STANDARD';
  const type = vehicleType.toUpperCase();
  if (type === 'BIKE' || type === 'SCOOTER' || type === 'TWO_WHEELER') return '2-WHEELER';
  if (type === 'CAR' || type === 'FOUR_WHEELER') return '4-WHEELER';
  if (type === 'HEAVY') return 'HEAVY VEHICLE';
  return 'STANDARD';
};

// Helper to check if a spot is an EV spot
const isEvSpot = (spot) => {
  return spot.spotType === 'EV' || spot.isEVCharging === true || spot.isEVCharging === 'true';
};

// Generate reservation message with time range
const getReservationMessage = (spot) => {
  if (spot.reservedFrom && spot.reservedTo) {
    return `This spot is reserved from ${formatDateTime(spot.reservedFrom)} to ${formatDateTime(spot.reservedTo)}. You can still book a different time slot.`;
  }
  return "This spot is reserved for another time. You can still book a different time slot.";
};

export default function LotDetail() {
  const { lotId } = useParams();
  const navigate  = useNavigate();

  const [lot, setLot]             = useState(null);
  const [spots, setSpots]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [form, setForm] = useState({
    bookingType: 'PRE_BOOKING', startTime: '', endTime: '',
  });

  // ── Load spots from server ────────────────────────────────────────────────
const loadSpots = useCallback(async () => {
  try {
    const driverEmail = localStorage.getItem('email');
    const url = driverEmail
      ? `/api/bookings/slots/${lotId}/drive-in?driverEmail=${encodeURIComponent(driverEmail)}`
      : `/api/bookings/slots/${lotId}/drive-in`;
    const spotsData = await api.get(url);
    setSpots(spotsData);
  } catch (err) {
    console.error('Spot refresh failed:', err);
  }
}, [lotId]);

useEffect(() => {
  const init = async () => {
    try {
      const [lotData, vehiclesData] = await Promise.all([
        api.get(`/api/lots/${lotId}`),
        api.get('/api/vehicles/my')
      ]);

      setLot(lotData);
      setVehicles(vehiclesData);

      await loadSpots(); // important

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false); // Ensure loading state is complete
    }
  };

  init();
}, [lotId, loadSpots]);

  // ── datetime-local gives "2026-04-13T10:00" — backend needs seconds ───────
  const toISO = dt => (!dt ? '' : dt.length === 16 ? `${dt}:00` : dt);

  // ── Fare estimate shown in modal ──────────────────────────────────────────
  const getEstimate = () => {
    if (!form.startTime || !form.endTime || !selected) return null;
    const diff = new Date(form.endTime) - new Date(form.startTime);
    if (diff <= 0) return null;
    return (Math.max(1, diff / 3600000) * selected.pricePerHour).toFixed(2);
  };

  // ── Book spot ─────────────────────────────────────────────────────────────
  const handleBook = async () => {
    setError('');
    if (!selectedVehicleId) return setError('Please select your vehicle.');

    const isDriveIn = form.bookingType === 'DRIVE_IN';
    let bookStartTime, bookEndTime;

    if (isDriveIn) {
      // Walk-in: format as local datetime (yyyy-MM-ddTHH:mm:ss) to match backend LocalDateTime.
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const fmt = d =>
        `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      bookStartTime = fmt(now);
      bookEndTime   = fmt(new Date(now.getTime() + 60 * 60 * 1000));
    } else {
      if (!form.startTime || !form.endTime) return setError('Please select start and end times.');
      if (new Date(form.endTime) <= new Date(form.startTime)) return setError('End time must be after start time.');
      bookStartTime = toISO(form.startTime);
      bookEndTime   = toISO(form.endTime);
    }

    setBookingLoading(true);
    try {
      const booking = await api.post('/api/bookings', {
        lotId:        Number(lotId),
        spotId:       selected.spotId,
        vehicleId:    Number(selectedVehicleId),
        bookingType:  form.bookingType,
        startTime:    bookStartTime,
        endTime:      bookEndTime,
      });

      // 1. Optimistic update — instantly show RESERVED color
      const bookedId = selected.spotId;
      setSpots(prev =>
        prev.map(s => s.spotId === bookedId ? { ...s, status: 'RESERVED' } : s)
      );

      // 2. Close modal & reset
      setSuccess(`Booking #${booking.bookingId} confirmed! Spot ${selected.spotNumber} is now reserved.`);
      setShowModal(false);
      setSelected(null);
      setForm({ vehiclePlate: '', bookingType: 'PRE_BOOKING', startTime: '', endTime: '' });
      setSelectedVehicleId('');

      // 3. Sync with server after short delay to get authoritative status
      await loadSpots();

      // 4. Send notification (best-effort — never blocks the booking)
      api.post('/api/notifications/send', {
        recipientEmail: localStorage.getItem('email'),
        type: 'BOOKING_CONFIRMED', channel: 'BOTH',
        title: 'Booking Confirmed! 🎉',
        message: `Spot ${selected.spotNumber} at ${lot.name} is reserved. Booking #${booking.bookingId}`,
        relatedId: booking.bookingId, relatedType: 'BOOKING',
      }).catch(() => {});

    } catch (err) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <DriverLayout title="Lot Details"><Spinner /></DriverLayout>;

  const available   = spots.filter(s => s.status === 'FREE').length;
  const spotsGroups = {};
  spots.forEach(s => {
    const f = `Floor ${s.floor}`;
    if (!spotsGroups[f]) spotsGroups[f] = [];
    spotsGroups[f].push(s);
  });

  return (
    <DriverLayout
      title={lot?.name || 'Lot Detail'}
      topbarRight={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={loadSpots}>🔄 Refresh</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
        </div>
      }
    >
      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Lot info */}
      <div className="card" style={{ marginBottom: 24 }}>
        {lot?.imageUrl && (
          <div style={{ margin: '-24px -24px 16px -24px', height: 160, overflow: 'hidden', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
            <img src={lot.imageUrl} alt={lot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div className="row-between mb-8">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 4 }}>{lot?.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>📍 {lot?.address}, {lot?.city}</p>
          </div>
          <span className={`badge ${lot?.open ? 'badge-success' : 'badge-danger'}`}>
            {lot?.open ? '● Open' : '● Closed'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-soft)', fontWeight: 500 }}>
          <div>🅿 {available} available of {spots.length}</div>
          <div>🕐 {lot?.openTime} – {lot?.closeTime}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-bar" style={{ marginBottom: 24, fontSize: '0.85rem' }}>
        {[
          { color: '#fff', border: 'var(--border)', label: 'Available (click to select)' },
          { color: 'rgba(13, 110, 253, 0.1)', border: 'rgba(13, 110, 253, 0.3)', label: 'Reserved' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: l.color, border: `2px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
        {selected && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <strong>✓ {selected.spotNumber} — ₹{selected.pricePerHour}/hr</strong>
            <button className="btn btn-primary btn-sm"
              onClick={() => { setError(''); setShowModal(true); }}>
              Book This Spot
            </button>
          </div>
        )}
      </div>

      {/* Spot grid per floor */}
      {Object.entries(spotsGroups).map(([floor, floorSpots]) => (
        <div key={floor} style={{ marginBottom: 32 }}>
          <div className="floor-header">
            <div className="floor-title">{floor}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 700 }}>
              {floorSpots.filter(s => s.status === 'FREE').length} available
            </span>
          </div>
          <div className="spot-grid">
            {floorSpots.map(spot => {
              const statusClass = spot.status ? (spot.status.toLowerCase() === 'free' ? 'available' : spot.status.toLowerCase()) : 'free';
              const isSelectable = spot.status === 'FREE' || spot.status === 'RESERVED';
              return (
                <div
                  key={spot.spotId}
                  className={`spot-cell spot-${statusClass} ${selected?.spotId === spot.spotId ? 'spot-selected' : ''}`}
                  onClick={() => isSelectable && setSelected(spot)}
                  title={
                    isSelectable
                      ? `${spot.spotNumber} — ₹${spot.pricePerHour}/hr — Click to select`
                      : `${spot.spotNumber} — ${spot.status}`
                  }
                >
                  <div className="spot-cell-num">{spot.spotNumber}</div>
                  <div className="spot-cell-type">
                    {spot.isHandicapped ? '♿' : getVehicleTypeLabel(spot.vehicleType)}
                  </div>
                  {isEvSpot(spot) && (
                    <div className="spot-cell-ev">
                      ⚡ EV
                    </div>
                  )}
                  {spot.vehicleNumberForCurrentUser && (
                    <div className="spot-cell-plate">
                      {spot.vehicleNumberForCurrentUser}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Booking Modal — NOT inside <form> to prevent double submit */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError(''); }}
        title={`Book Spot ${selected?.spotNumber}`}
        footer={
          <div className="row gap-12" style={{ justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline"
              onClick={() => { setShowModal(false); setError(''); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleBook} disabled={bookingLoading || !selectedVehicleId || vehicles.length === 0}>
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        }
      >
        {selected && (
          <div className="alert alert-info mb-3">
            <div className="flex-between">
              <span>
                🅿 <strong>{selected.spotNumber}</strong> — {getVehicleTypeLabel(selected.vehicleType)}{isEvSpot(selected) ? ' (EV)' : ''}
                {selected.isHandicapped && ' ♿'}
              </span>
              <strong>₹{selected.pricePerHour}/hr</strong>
            </div>
            {getEstimate() && (
              <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                💰 Estimated fare: <strong>₹{getEstimate()}</strong>
                <span style={{ opacity: 0.7 }}> (min. 1hr charge applies)</span>
              </div>
            )}
          </div>
        )}
        {selected?.status === 'RESERVED' && (
  <div className="alert alert-warning mb-3">
            ⚠ {getReservationMessage(selected)}
          </div>
)}

        {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

        <div className="form-group">
          <label className="form-label">Select Vehicle</label>
          {vehicles.length === 0 ? (
            <div className="alert alert-warning">
              <p style={{ marginBottom: 8 }}>You don't have any registered vehicles.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/driver/vehicles')}
              >
                Add Vehicle
              </button>
            </div>
          ) : (
            <select
              className="form-control"
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
            >
              <option value="">-- Select your vehicle --</option>
              {vehicles.map(v => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.licensePlate} ({v.vehicleType})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Booking Type</label>
          <select className="form-control" value={form.bookingType}
            onChange={e => setForm({ ...form, bookingType: e.target.value })}>
            <option value="PRE_BOOKING">Pre-Booking (Reserve in advance)</option>
            <option value="DRIVE_IN">Walk-in (Immediate on arrival)</option>
          </select>
        </div>
        {form.bookingType === 'PRE_BOOKING' ? (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-control" type="datetime-local"
                value={form.startTime}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-control" type="datetime-local"
                value={form.endTime}
                min={form.startTime || new Date().toISOString().slice(0, 16)}
                onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="alert alert-info" style={{ fontSize: '0.875rem', marginTop: 4 }}>
            ⚡ Your booking will start now and end in 1 hour. You can extend your session anytime from My Bookings.
          </div>
        )}
      </Modal>
      </div>
    </DriverLayout>
  );
}
