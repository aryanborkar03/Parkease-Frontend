import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

const TYPE_CONFIG = {
  BOOKING_CONFIRMED: { icon: '✅', color: '#22c55e', bg: '#f0fdf4', label: 'Booking Confirmed' },
  CHECKIN:           { icon: '🚗', color: '#3b82f6', bg: '#eff6ff', label: 'Check-In' },
  CHECKOUT:          { icon: '🏁', color: '#8b5cf6', bg: '#faf5ff', label: 'Check-Out' },
  PAYMENT:           { icon: '💳', color: '#f59e0b', bg: '#fffbeb', label: 'Payment' },
  CANCELLATION:      { icon: '❌', color: '#ef4444', bg: '#fef2f2', label: 'Cancellation' },
  EXPIRY_REMINDER:   { icon: '⏰', color: '#f97316', bg: '#fff7ed', label: 'Expired' },
  BROADCAST:         { icon: '📢', color: '#06b6d4', bg: '#ecfeff', label: 'Announcement' },
};

function formatNotifDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const mo = d.toLocaleString('default', { month: 'short' });
  const time = d.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true });
  return `${day} ${mo}. ${time}`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [filter,        setFilter]        = useState('ALL');

  const load = () => {
    api.get('/api/notifications/my')
      .then(setNotifications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = filter === 'ALL'    ? notifications
                 : filter === 'UNREAD' ? notifications.filter(n => !n.isRead)
                 : notifications.filter(n => n.type === filter);

  return (
    <DriverLayout
      title="Notifications"
      subtitle={`${unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}`}
      topbarRight={
        unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" style={{ borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, padding: '8px 16px', background: 'var(--text)', color: 'var(--bg)' }} onClick={markAllRead}>
            ✓ Mark all as read
          </button>
        )
      }
    >

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}


      {/* Filter tabs */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {['ALL', 'UNREAD', 'BOOKING_CONFIRMED', 'PAYMENT', 'CANCELLATION'].map(f => (
          <div
            key={f}
            className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL'    ? 'All' :
             f === 'UNREAD' ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` :
             TYPE_CONFIG[f]?.label || f}
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications"
          message={filter === 'UNREAD' ? "You're all caught up!" : "Nothing here yet."}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(n => {
            const typeColors = {
              BOOKING_CONFIRMED: '#22c55e',
              CHECKIN:           '#3b82f6',
              CHECKOUT:          '#ef4444',
              PAYMENT:           '#22c55e',
              CANCELLATION:      '#ef4444',
              EXPIRY_REMINDER:   '#f97316',
              BROADCAST:         '#06b6d4',
            };
            const cfg = TYPE_CONFIG[n.type] || { label: n.type };
            const textColor = typeColors[n.type] || '#64748b';

            return (
              <div
                key={n.notificationId}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                style={{ cursor: !n.isRead ? 'pointer' : 'default', alignItems: 'center' }}
                onClick={() => !n.isRead && markRead(n.notificationId)}
              >
                {/* Unread Dot on Left Border */}
                {!n.isRead && <div className="notif-unread-dot" />}

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Top Row: Type and Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: textColor, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
                      {cfg.label}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 500 }}>
                      {formatNotifDate(n.sentAt)}
                    </div>
                  </div>

                  {/* Middle Row: Title */}
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>
                    {n.title}
                  </div>

                  {/* Bottom Row: Message */}
                  <div style={{ color: 'var(--text-soft)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                </div>

                {/* Right Side: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <button
                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-soft)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', opacity: n.isRead ? 0.3 : 1 }}
                    title="Mark as Read"
                    onClick={(e) => { e.stopPropagation(); markRead(n.notificationId); }}
                    disabled={n.isRead}
                    onMouseEnter={e => { if(!n.isRead) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
                    onMouseLeave={e => { if(!n.isRead) e.currentTarget.style.background = 'transparent' }}
                  >
                    ✓
                  </button>
                  <button
                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--accent)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    title="Delete"
                    onClick={e => { e.stopPropagation(); deleteNotif(n.notificationId); }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DriverLayout>
  );
}
