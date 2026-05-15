import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function LotAnalytics() {
  const { lotId } = useParams();
  const navigate  = useNavigate();
  const [summary, setSummary]   = useState(null);
  const [hourly, setHourly]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/api/analytics/lots/${lotId}/summary`),
      api.get(`/api/analytics/lots/${lotId}/hourly`),
    ])
      .then(([s, h]) => { setSummary(s); setHourly(h); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lotId]);

  if (loading) return <ManagerLayout title={`Analytics — Lot #${lotId}`} subtitle="Occupancy trends, revenue, and performance metrics 📊"><Spinner /></ManagerLayout>;

  // Hourly chart — simple CSS bar chart
  const maxHourly = Math.max(...Object.values(hourly), 0.01);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <ManagerLayout
      title={`Analytics — Lot #${lotId}`}
      subtitle="Occupancy trends, revenue, and performance metrics 📊"
      topbarRight={
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
      }
    >

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {summary && (
        <>
          {/* Stat cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📊</div>
              <div className="stat-info">
                <div className="stat-label">Current Occupancy</div>
                <div className="stat-value">
                  {(summary.currentOccupancyRate * 100).toFixed(0)}%
                </div>
                <div className="stat-sub">{summary.occupiedSpots} / {summary.totalSpots} spots</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">💰</div>
              <div className="stat-info">
                <div className="stat-label">Revenue Today</div>
                <div className="stat-value">₹{summary.revenueToday?.toFixed(0) || 0}</div>
                <div className="stat-sub">₹{summary.revenueThisMonth?.toFixed(0) || 0} this month</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">📋</div>
              <div className="stat-info">
                <div className="stat-label">Bookings Today</div>
                <div className="stat-value">{summary.bookingsToday || 0}</div>
                <div className="stat-sub">{summary.bookingsThisMonth || 0} this month</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">⏱️</div>
              <div className="stat-info">
                <div className="stat-label">Avg Duration</div>
                <div className="stat-value">
                  {summary.avgParkingDurationMinutes > 0
                    ? `${(summary.avgParkingDurationMinutes / 60).toFixed(1)}h`
                    : '—'}
                </div>
                <div className="stat-sub">Per visit</div>
              </div>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="row-between mb-16">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Current Occupancy</h3>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="row-between" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>
                <span>{summary.occupiedSpots} occupied</span>
                <span>{summary.totalSpots - summary.occupiedSpots} available</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(summary.currentOccupancyRate * 100).toFixed(1)}%`, background: summary.currentOccupancyRate > 0.8 ? 'var(--danger)' : summary.currentOccupancyRate > 0.5 ? 'var(--warning)' : 'var(--success)' }}
                />
              </div>
            </div>
          </div>

          {/* Peak hours */}
          {summary.peakHours?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="row-between mb-16">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Peak Hours</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {summary.peakHours.map((h, i) => (
                  <div key={h} style={{
                    background: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#3b82f6',
                    color: 'white', borderRadius: 8, padding: '12px 24px', textAlign: 'center', flex: 1, minWidth: 100
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                      {h}:00
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>
                      {i === 0 ? '🔥 Busiest' : i === 1 ? '🌟 2nd' : '📈 3rd'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="row-between mb-16">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>24-Hour Occupancy Pattern</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, padding: '16px 0 8px 0', borderBottom: '1px solid var(--border)' }}>
              {hours.map(h => {
                const rate = hourly[h] || 0;
                const pct  = maxHourly > 0 ? (rate / maxHourly) * 100 : 0;
                const isPeak = summary.peakHours?.includes(h);
                return (
                  <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      title={`${h}:00 — ${(rate * 100).toFixed(0)}%`}
                      style={{
                        width: '100%',
                        height: `${Math.max(pct, 4)}%`,
                        background: isPeak ? '#ef4444' : 'rgba(59, 130, 246, 0.3)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        cursor: 'default',
                        border: rate > 0 ? '1px solid rgba(59, 130, 246, 0.5)' : 'none'
                      }}
                    />
                    {h % 6 === 0 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700 }}>{h}h</div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 8 }}>
              <span style={{ color: '#ef4444' }}>●</span> Red bars indicate peak hours
            </p>
          </div>

          {/* Revenue summary */}
          <div className="card">
            <div className="row-between mb-16">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Revenue Summary</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {[
                ['Today',      `₹${summary.revenueToday?.toFixed(2) || '0.00'}`],
                ['This Month', `₹${summary.revenueThisMonth?.toFixed(2) || '0.00'}`],
                ['All Time',   `₹${summary.revenueAllTime?.toFixed(2) || '0.00'}`],
              ].map(([label, value]) => (
                <div key={label} style={{ textAlign: 'center', padding: '20px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--accent)', marginTop: 8 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ManagerLayout>
  );
}
