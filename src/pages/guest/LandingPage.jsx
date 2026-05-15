import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/guest/GuestLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';
import LogoSvg from '../../assets/parkease-car-universal.svg';

export default function LandingPage() {
  const navigate = useNavigate();

  const [city, setCity] = useState('');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const WORDS = ['Instantly.', 'Quickly.', 'Easily.', 'Anywhere.'];
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const searchByCity = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const data = await api.get(`/api/lots/city/${city.trim()}`);
      setLots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchNearby = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }
    setLoading(true); setError(''); setSearched(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const data = await api.get(`/api/lots/nearby?lat=${lat}&lon=${lon}&radius=10`);
          setLots(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Could not get your location. Please allow location access.');
        setLoading(false);
      }
    );
  };

  const getOccupancyClass = (lot) => {
    const pct = lot.totalSpots > 0
      ? (lot.totalSpots - lot.availableSpots) / lot.totalSpots : 0;
    if (pct < 0.5) return 'low';
    if (pct < 0.8) return 'medium';
    return 'high';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar (from PubNav in design reference) */}
      <div className="pub-nav">
        <div className="pub-logo">
          <img src={LogoSvg} style={{ width: 36, height: 36 }} alt="ParkEase Icon" />
          <div className="pub-logo-name">ParkEase</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, padding: '0 20px', height: 38, borderRadius: 999, border: '1px solid rgba(0,0,0,0.08)' }} onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, padding: '0 24px', height: 38, borderRadius: 999 }} onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Hero */}
        <div className="hero-section" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="hero-eyebrow">
            <span>◈</span> Smart Parking for Everyone
          </div>
          <div className="hero-h1">
            Find parking.<br />
            <span key={wordIdx} className="hero-h1-accent animated-word">
              {WORDS[wordIdx]}
            </span>
          </div>
          <div className="hero-sub" style={{ textAlign: 'center', margin: '0 auto 32px' }}>
            Book parking spots in seconds. Real-time availability, seamless payments, and smart alerts — all in one platform.
          </div>

          <form onSubmit={searchByCity} style={{ width: '100%', maxWidth: 560, margin: '0 auto 24px' }}>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Search by city, area or landmark..."
              style={{
                width: '100%',
                height: 52,
                background: 'rgba(240,237,232,0.09)',
                border: '1.5px solid rgba(240,237,232,0.18)',
                color: '#f0ede8',
                padding: '0 24px',
                borderRadius: 14,
                outline: 'none',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-sans)',
                marginBottom: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  height: 44,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🔍 Search
              </button>
              <button
                type="button"
                onClick={searchNearby}
                style={{
                  flex: 1,
                  height: 44,
                  background: 'rgba(240,237,232,0.12)',
                  color: '#f0ede8',
                  border: '1.5px solid rgba(240,237,232,0.25)',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📍 Nearby
              </button>
            </div>
          </form>
        </div>

        {error && <div style={{ marginTop: 24 }}><Alert type="danger" onClose={() => setError('')}>{error}</Alert></div>}

        {/* Feature Cards or Search Results */}
        {!searched && !loading ? (
          <>
            <div className="feature-cards">
              {[
                { icon: '⚡', title: 'Instant Booking', desc: 'Reserve your spot in seconds. No waiting, no hassle — just park.' },
                { icon: '◉', title: 'Live Availability', desc: 'See real-time spot availability across all lots near you.' },
                { icon: '◈', title: 'Easy Payments', desc: 'Secure in-app payments with instant receipts and history.' },
                { icon: '◎', title: 'Smart Alerts', desc: 'Get notified about your booking, check-in, and check-out times.' },
              ].map(f => (
                <div key={f.title} className="feature-card" style={{ transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="feature-icon">{f.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 6, color: 'var(--text)' }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            {/* NEW SECTION: How it Works */}
            <div style={{ marginTop: 100, marginBottom: 80, textAlign: 'center' }}>
              <h2 className="section-title" style={{ fontSize: '2.2rem', marginBottom: 12 }}>How ParkEase Works</h2>
              <div style={{ fontSize: '1.05rem', color: 'var(--muted)', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
                A seamless process designed to get you from searching to parking in under a minute.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, padding: '0 16px' }}>
                {[
                  { step: '1', title: 'Search Location', desc: 'Enter your destination or use location to find nearby spots instantly.' },
                  { step: '2', title: 'Pick a Spot', desc: 'View live availability, pricing, and distance to pick your ideal parking bay.' },
                  { step: '3', title: 'Book & Park', desc: 'Securely pay in-app and get instant digital access to your reserved spot.' }
                ].map(s => (
                  <div key={s.step} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-6px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 24, boxShadow: '0 8px 24px rgba(200, 75, 47, 0.3)' }}>
                      {s.step}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: 10 }}>{s.title}</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW SECTION: Stats / Trust */}
            <div style={{ background: '#141311', color: '#e8e6e1', borderRadius: 24, padding: '72px 32px', textAlign: 'center', marginBottom: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent)', marginBottom: 8, lineHeight: 1 }}>10k+</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(232, 230, 225, 0.5)' }}>Active Users</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent)', marginBottom: 8, lineHeight: 1 }}>500+</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(232, 230, 225, 0.5)' }}>Parking Lots</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent)', marginBottom: 8, lineHeight: 1 }}>99%</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(232, 230, 225, 0.5)' }}>Uptime</div>
                </div>
              </div>
            </div>
          </>
        ) : loading ? (
          <div style={{ padding: '60px 0' }}><Spinner /></div>
        ) : (
          <div style={{ marginTop: 24 }}>
            {lots.length === 0 ? (
              <EmptyState icon="🔍" title="No lots found" message="Try a different city or use 'Near Me'." />
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 12 }}>
                  Click a lot to see available spots
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{lots.length}</span>
                  {' '}parking lot{lots.length !== 1 ? 's' : ''} found
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {lots.map(lot => {
                    const occupied = lot.totalSpots - lot.availableSpots;
                    const pct = lot.totalSpots > 0 ? (occupied / lot.totalSpots) * 100 : 0;
                    return (
                      <div key={lot.lotId} className="lot-card" style={{ cursor: 'pointer', width: '100%', maxWidth: 450 }} onClick={() => navigate(`/guest/lots/${lot.lotId}`)}>
                        {lot.imageUrl && (
                          <div style={{ margin: '-24px -24px 16px -24px', height: 180, overflow: 'hidden', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
                            <img src={lot.imageUrl} alt={lot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                          <div style={{ paddingRight: 12 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>{lot.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{lot.address}, {lot.city}</div>
                          </div>
                          <button className="btn" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, padding: '0 16px', height: 32, borderRadius: 999, border: '1px solid rgba(200,75,47,0.3)', color: 'var(--accent)', background: 'transparent', flexShrink: 0, whiteSpace: 'nowrap' }} onClick={(e) => { e.stopPropagation(); navigate(`/guest/lots/${lot.lotId}`); }}>View Spots &rarr;</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                          <span className={`badge ${lot.open ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
                            {lot.open ? '• Open' : '• Closed'}
                          </span>
                          <span className="badge badge-muted" style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>{lot.availableSpots}/{lot.totalSpots} spots</span>
                          {lot.distanceKm && <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', background: 'rgba(2, 119, 189, 0.1)', color: 'var(--info)' }}>{lot.distanceKm} km away</span>}
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                            <span>Occupancy</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)' }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
