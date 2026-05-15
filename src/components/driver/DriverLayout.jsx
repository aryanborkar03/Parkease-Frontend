import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import { Topbar } from '../common/UI';
import { api } from '../../utils/api';

export default function DriverLayout({ title, subtitle, children, topbarRight }) {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [isPremium,   setIsPremium]     = useState(false);

  // Poll unread notification count every 30 seconds
  useEffect(() => {
    const fetchCount = () => {
      api.get('/api/notifications/my/count')
        .then(data => setUnreadCount(data.unreadCount || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pass status once on layout mount — silently ignore 404 (no pass)
  useEffect(() => {
    api.get('/api/pass/my')
      .then(pass => {
        const now = Date.now();
        const active = pass?.status === 'ACTIVE'
          && new Date(pass.expiresAt).getTime() > now
          && pass.parkingCountUsed < pass.parkingCountLimit;
        setIsPremium(active);
      })
      .catch(() => setIsPremium(false));
  }, []);

  const DRIVER_NAV = [
    { icon: '🏠', label: 'Dashboard',      path: '/driver',                  exact: true },
    { icon: '🔍', label: 'Find Parking',   path: '/driver/search'            },
    { icon: '📋', label: 'My Bookings',    path: '/driver/bookings'          },
    { icon: '🚗', label: 'My Vehicles',    path: '/driver/vehicles'          },
    { icon: '🧾', label: 'My Receipts',    path: '/driver/receipts'          },
    { icon: '🔔', label: 'Notifications',  path: '/driver/notifications', badge: unreadCount },
    { icon: '💎', label: 'Subscription',  path: '/driver/subscription'      },
  ];

  return (
    <div className="dash-layout">
      <Sidebar
        navItems={DRIVER_NAV}
        title="Driver Menu"
        mobileOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen(o => !o)}
        isPremium={isPremium}
      />
      <div className="dash-main">
        <Topbar
          title={title}
          subtitle={subtitle}
          onMenuToggle={() => setMobileOpen(o => !o)}
        >
          {topbarRight}
        </Topbar>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

