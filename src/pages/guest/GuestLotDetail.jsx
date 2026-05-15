import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/guest/GuestLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';
import LogoSvg from '../../assets/parkease-car-universal.svg';

export default function GuestLotDetail() {
  const { lotId } = useParams();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSpots = useCallback(() => {
    return api.get(`/api/bookings/slots/${lotId}/drive-in`)
      .then(setSpots)
      .catch(err => setError(err.message));
  }, [lotId]);

  useEffect(() => {
    Promise.all([
      api.get(`/api/lots/${lotId}`),
      api.get(`/api/bookings/slots/${lotId}/drive-in`),
    ])
      .then(([lotData, spotsData]) => { setLot(lotData); setSpots(spotsData); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lotId]);

  // Capture intended booking destination to enable post-login redirection
  const handleGuestBook = () => {
    sessionStorage.setItem('redirectAfterLogin', `/driver/lots/${lotId}`);
    navigate('/login', {
      state: {
        message: '👋 Please sign in or create a free account to book this spot.',
        lotId,
      }
    });
  };

  const spotsGroups = {};
  spots.forEach(s => {
    const f = `Floor ${s.floor}`;
    if (!spotsGroups[f]) spotsGroups[f] = [];
    spotsGroups[f].push(s);
  });

  const available = spots.filter(s => s.status === 'AVAILABLE' || s.status === 'FREE').length;

  if (loading) return (
    <GuestLayout>
      <div style={{ padding: '80px 0' }}><Spinner /></div>
    </GuestLayout>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <div className="pub-nav">
        <div className="pub-logo">
          <img src={LogoSvg} style={{ width: 36, height: 36 }} alt="ParkEase Icon" />
          <div className="pub-logo-name">ParkEase</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </div>

      <div style={{ padding: '20px 32px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {error && <div style={{ marginBottom: 16 }}><Alert type="danger" onClose={() => setError('')}>{error}</Alert></div>}

          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>← Back to Search</button>
          </div>

          {/* Selected spot confirmation bar */}
          {selected && (
            <div className="spot-confirm-bar" style={{ marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                  ✓ Spot {selected.spotNumber} selected — ₹{selected.pricePerHour}/hr
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Sign in or create a free account to complete your booking
                </div>
              </div>
              <div className="row gap-8">
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Sign In</button>
                <button className="btn btn-primary btn-sm" onClick={handleGuestBook}>Book Spot {selected.spotNumber} →</button>
              </div>
            </div>
          )}

          {/* Lot header */}
          <div className="card" style={{ marginBottom: 16 }}>
            {lot?.imageUrl && (
              <div style={{ margin: '-24px -24px 16px -24px', height: 160, overflow: 'hidden', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
                <img src={lot.imageUrl} alt={lot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div className="row-between">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {lot?.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>📍 {lot?.address}, {lot?.city}</div>
              </div>
              <div className="col" style={{ alignItems: 'flex-end', gap: 8 }}>
                <div className="row gap-8">
                  <span className={`badge ${lot?.open ? 'badge-success' : 'badge-danger'}`} style={{ dot: false }}>
                    {lot?.open ? '● Open' : '● Closed'}
                  </span>
                  <span className="badge badge-muted" style={{ dot: false }}>{available} available of {spots.length}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>🕐 {lot?.openTime} – {lot?.closeTime}</div>
              </div>
            </div>
          </div>

          {/* Instruction */}
          {!selected && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, fontStyle: 'italic' }}>
              Select an available spot below to book it
            </div>
          )}

          {/* Legend + refresh */}
          <div className="row-between" style={{ marginBottom: 24, fontSize: '0.85rem' }}>
            <div className="legend-bar" style={{ display: 'flex', gap: '16px' }}>
              {[
                { color: '#fff', border: 'var(--border)', label: 'Available (click to select)' },
                { color: 'rgba(13, 110, 253, 0.1)', border: 'rgba(13, 110, 253, 0.3)', label: 'Reserved' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: l.color, border: `2px solid ${l.border}` }} />
                  {l.label}
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-sm" onClick={loadSpots}>↻ Refresh</button>
          </div>

          {/* Floor sections */}
          {Object.entries(spotsGroups).map(([floor, floorSpots]) => (
            <div key={floor} style={{ marginBottom: 32 }}>
              <div className="floor-header">
                <div className="floor-title">{floor}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {floorSpots.filter(s => s.status === 'AVAILABLE' || s.status === 'FREE').length} available
                </div>
              </div>

              <div className="spot-grid">
                {floorSpots.map(spot => {
                  const statusClass = spot.status ? (spot.status.toLowerCase() === 'free' ? 'available' : spot.status.toLowerCase()) : 'available';
                  const isSelectable = spot.status === 'AVAILABLE' || spot.status === 'FREE' || spot.status === 'RESERVED';
                  return (
                    <div
                      key={spot.spotId}
                      className={`spot-cell spot-${statusClass} ${selected?.spotId === spot.spotId ? 'spot-selected' : ''}`}
                      onClick={() => isSelectable && setSelected(selected?.spotId === spot.spotId ? null : spot)}
                      title={isSelectable ? `₹${spot.pricePerHour}/hr` : spot.status}
                    >
                      <div className="spot-cell-num">{spot.spotNumber}</div>
                      <div className="spot-cell-type">
                        {spot.isHandicapped ? '♿' : (spot.vehicleType || 'STD')}
                      </div>
                      {(spot.spotType === 'EV' || spot.isEVCharging === true || spot.isEVCharging === 'true') && (
                        <div className="spot-cell-ev">
                          ⚡ EV
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CTA banner */}
          {!selected && (
            <div style={{
              textAlign: 'center',
              padding: '48px 32px',
              marginTop: 32,
              background: 'linear-gradient(145deg, #1e1b18 0%, #141311 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative background glow */}
              <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '60%', height: '200%', background: 'radial-gradient(circle, rgba(200,75,47,0.15) 0%, transparent 70%)', transform: 'rotate(15deg)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, textTransform: 'uppercase', marginBottom: 12, color: '#fff', letterSpacing: '-0.02em' }}>
                  Ready to <span style={{ color: 'var(--accent)' }}>park smarter?</span>
                </div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.5 }}>
                  Create a free account to book, manage, and pay for parking in seconds.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <button
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0 24px', height: 44, borderRadius: 999, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onClick={() => navigate('/login')}>
                    Sign In
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0 24px', height: 44, borderRadius: 999, fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 8px 16px rgba(200,75,47,0.3)', border: 'none', color: '#fff', background: 'var(--accent)' }}
                    onClick={() => navigate('/register')}>
                    Create Free Account &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
