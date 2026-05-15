import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function SearchLots() {
  const navigate = useNavigate();
  const [city, setCity]     = useState('');
  const [lots, setLots]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [searched, setSearched] = useState(false);
  const [vehicleType, setVehicleType] = useState('');
  const [isEv, setIsEv] = useState(false);
  const [isHandicapped, setIsHandicapped] = useState(false);

  const getQueryParams = () => {
    const params = new URLSearchParams();
    if (vehicleType) params.append('vehicleType', vehicleType);
    if (isEv) params.append('isEv', 'true');
    if (isHandicapped) params.append('isHandicapped', 'true');
    return params.toString();
  };

  // Search by city
  const searchByCity = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const qs = getQueryParams();
      const url = `/api/lots/city/${city.trim()}${qs ? '?' + qs : ''}`;
      const data = await api.get(url);
      console.log('API returned lots:', JSON.stringify(data[0])); // Debug: log first lot
      setLots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Search nearby using GPS
  const searchNearby = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }
    setLoading(true); setError(''); setSearched(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const qs = getQueryParams();
          const url = `/api/lots/nearby?lat=${lat}&lon=${lon}&radius=10${qs ? '&' + qs : ''}`;
          const data = await api.get(url);
          console.log('API returned lots:', JSON.stringify(data[0])); // Debug: log first lot
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
      ? (lot.totalSpots - lot.availableSpots) / lot.totalSpots
      : 0;
    if (pct < 0.5) return 'low';
    if (pct < 0.8) return 'medium';
    return 'high';
  };

  return (
    <DriverLayout title="Find Parking" subtitle="Search by city or use your current location 🔍">

      {/* Search card */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: 24 }}>
        <form onSubmit={searchByCity}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="Enter city, area or landmark..."
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{
                flex: '1 1 200px',
                minWidth: 0,
                border: '1.5px solid rgba(0,0,0,0.08)',
                background: '#f5f3ef',
                outline: 'none',
                fontSize: '0.88rem',
                padding: '10px 16px',
                borderRadius: 10,
                color: 'var(--text)',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <button
              type="submit"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                padding: '9px 20px',
                fontWeight: 800,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={searchNearby}
              style={{
                background: '#fff',
                color: 'var(--text)',
                border: '1.5px solid rgba(0,0,0,0.12)',
                borderRadius: '999px',
                padding: '9px 16px',
                fontWeight: 800,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              📍 Nearby
            </button>
          </div>
          
          {/* Modern Filters Row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
            {/* Vehicle Type Pills */}
            <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '999px', padding: '3px', border: '1px solid rgba(0,0,0,0.05)', gap: '3px', overflow: 'auto', maxWidth: '100%' }}>
              {[
                { id: '', label: 'All' },
                { id: 'TWO_WHEELER', label: '🏍️ 2W' },
                { id: 'FOUR_WHEELER', label: '🚗 4W' },
                { id: 'HEAVY', label: '🚛 Heavy' },
              ].map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleType(v.id)}
                  style={{
                    background: vehicleType === v.id ? 'var(--text)' : 'transparent',
                    color: vehicleType === v.id ? '#fff' : 'var(--text-soft)',
                    border: 'none', borderRadius: '999px', padding: '5px 12px',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Feature Toggles */}
            <button
              type="button"
              onClick={() => setIsEv(!isEv)}
              style={{
                background: isEv ? 'rgba(46, 125, 50, 0.1)' : 'var(--bg)',
                color: isEv ? 'var(--success)' : 'var(--text-soft)',
                border: isEv ? '1px solid rgba(46, 125, 50, 0.2)' : '1px solid rgba(0,0,0,0.05)',
                borderRadius: '999px', padding: '5px 12px',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              ⚡ EV
            </button>
            <button
              type="button"
              onClick={() => setIsHandicapped(!isHandicapped)}
              style={{
                background: isHandicapped ? 'rgba(2, 119, 189, 0.1)' : 'var(--bg)',
                color: isHandicapped ? 'var(--info)' : 'var(--text-soft)',
                border: isHandicapped ? '1px solid rgba(2, 119, 189, 0.2)' : '1px solid rgba(0,0,0,0.05)',
                borderRadius: '999px', padding: '5px 12px',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              ♿ Accessible
            </button>
          </div>
        </form>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Results */}
      {loading ? <Spinner /> : searched && (
        lots.length === 0 ? (
          <EmptyState icon="🔍" title="No lots found"
            message="Try a different city or expand your search area." />
        ) : (
          <>
            <p style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {lots.length} parking lot{lots.length !== 1 ? 's' : ''} found
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {lots.map(lot => {
                const occupied = lot.totalSpots - lot.availableSpots;
                const pct = lot.totalSpots > 0 ? (occupied / lot.totalSpots) * 100 : 0;
                // DEBUG: Log what we're using to render
                if (lot.name.includes('Ashima') || lot.name.includes('DB')) {
                  console.log(`RENDER ${lot.name}: totalSpots=${lot.totalSpots}, availableSpots=${lot.availableSpots}, occupied=${occupied}, pct=${pct}%`);
                }
                return (
                  <div
                    key={lot.lotId}
                    className="lot-card"
                    style={{ cursor: 'pointer', transition: 'transform 0.2s', margin: 0, padding: '16px', overflow: 'hidden' }}
                    onClick={() =>
                      navigate(`/driver/lots/${lot.lotId}`, {
                        state: { refreshKey: Date.now() }
                      })
                    }
                  >
                    {lot.imageUrl && (
                      <div style={{ margin: '-16px -16px 12px -16px', height: 130, overflow: 'hidden', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
                        <img src={lot.imageUrl} alt={lot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ marginBottom: 10 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 3, lineHeight: 1.3 }}>{lot.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📍 {lot.address}, {lot.city}</p>
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', marginBottom: 10, color: 'var(--text-soft)', flexWrap: 'wrap' }}>
                        <span>🅿 {lot.availableSpots}/{lot.totalSpots}</span>
                        {lot.distanceKm && <span>📏 {lot.distanceKm}km</span>}
                        <span>
                          {lot.open
                            ? <span style={{ color: 'var(--success)' }}>● Open</span>
                            : <span style={{ color: 'var(--danger)' }}>● Closed</span>}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                         {lot.vehicleTypes?.includes('TWO_WHEELER') && <span className="badge badge-outline" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>🏍️</span>}
                         {lot.vehicleTypes?.includes('FOUR_WHEELER') && <span className="badge badge-outline" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>🚗</span>}
                         {lot.vehicleTypes?.includes('HEAVY') && <span className="badge badge-outline" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>🚛</span>}
                         {lot.isEv && <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>⚡</span>}
                         {lot.isHandicapped && <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>♿</span>}
                      </div>

                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%`, background: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                        <span>Occupancy</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}
    </DriverLayout>
  );
}
