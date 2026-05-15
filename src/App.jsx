import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken, getRole, isSuspended } from './utils/api';
import { SuspensionOverlay } from './components/common/UI';

// Guest pages (no auth needed)
import LandingPage    from './pages/guest/LandingPage';
import GuestLotDetail from './pages/guest/GuestLotDetail';

// Auth pages
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';
import OAuth2Redirect     from './pages/auth/OAuth2Redirect';

// Driver pages
import DriverDashboard   from './pages/driver/DriverDashboard';
import SearchLots        from './pages/driver/SearchLots';
import LotDetail         from './pages/driver/LotDetail';
import MyBookings        from './pages/driver/MyBookings';
import MyVehicles        from './pages/driver/MyVehicles';
import PaymentPage       from './pages/driver/PaymentPage';
import NotificationsPage from './pages/driver/NotificationsPage';
import ReceiptsPage      from './pages/driver/ReceiptsPage';
import Subscription      from './pages/driver/Subscription';

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import MyLots           from './pages/manager/MyLots';
import LotSpots         from './pages/manager/LotSpots';
import LotBookings      from './pages/manager/LotBookings';
import LotAnalytics     from './pages/manager/LotAnalytics';

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import ManageUsers       from './pages/admin/ManageUsers';
import ManageLots        from './pages/admin/ManageLots';
import AllBookings       from './pages/admin/AllBookings';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const token = getToken();
  const role  = getRole();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) {
    const redirects = { DRIVER: '/driver', LOT_MANAGER: '/manager', ADMIN: '/admin' };
    return <Navigate to={redirects[role] || '/login'} replace />;
  }
  return (
    <>
      {isSuspended() && <SuspensionOverlay />}
      {children}
    </>
  );
}

export default function App() {
  const suspended = isSuspended();
  
  React.useEffect(() => {
    // Sync suspension status on load if logged in
    const token = getToken();
    if (token && !suspended) {
      import('./utils/api').then(({ api, saveAuth }) => {
        api.get('/api/auth/me').then(user => {
          // Update suspended status if it changed
          if (!user.active) {
            localStorage.setItem('suspended', 'true');
            window.location.reload();
          }
        }).catch(() => {});
      });
    }
  }, [suspended]);

  return (
    <BrowserRouter>
      <Routes>

        {/* Guest and Public Routes */}
        <Route path="/"                element={<LandingPage />} />
        <Route path="/guest/lots/:lotId" element={<GuestLotDetail />} />

        {/* Authentication Routes */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/oauth2/success"  element={<OAuth2Redirect />} />

        {/* Driver Routes */}
        <Route path="/driver"                   element={<ProtectedRoute allowedRole="DRIVER"><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/search"            element={<ProtectedRoute allowedRole="DRIVER"><SearchLots /></ProtectedRoute>} />
        <Route path="/driver/lots/:lotId"       element={<ProtectedRoute allowedRole="DRIVER"><LotDetail /></ProtectedRoute>} />
        <Route path="/driver/bookings"          element={<ProtectedRoute allowedRole="DRIVER"><MyBookings /></ProtectedRoute>} />
        <Route path="/driver/vehicles"          element={<ProtectedRoute allowedRole="DRIVER"><MyVehicles /></ProtectedRoute>} />
        <Route path="/driver/payment/:bookingId" element={<ProtectedRoute allowedRole="DRIVER"><PaymentPage /></ProtectedRoute>} />
        <Route path="/driver/notifications"     element={<ProtectedRoute allowedRole="DRIVER"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/driver/receipts"          element={<ProtectedRoute allowedRole="DRIVER"><ReceiptsPage /></ProtectedRoute>} />
        <Route path="/driver/subscription"      element={<ProtectedRoute allowedRole="DRIVER"><Subscription /></ProtectedRoute>} />

        {/* Manager Routes */}
        <Route path="/manager"                       element={<ProtectedRoute allowedRole="LOT_MANAGER"><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/manager/lots"                  element={<ProtectedRoute allowedRole="LOT_MANAGER"><MyLots /></ProtectedRoute>} />
        <Route path="/manager/lots/:lotId/spots"     element={<ProtectedRoute allowedRole="LOT_MANAGER"><LotSpots /></ProtectedRoute>} />
        <Route path="/manager/lots/:lotId/bookings"  element={<ProtectedRoute allowedRole="LOT_MANAGER"><LotBookings /></ProtectedRoute>} />
        <Route path="/manager/lots/:lotId/analytics" element={<ProtectedRoute allowedRole="LOT_MANAGER"><LotAnalytics /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin"            element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"      element={<ProtectedRoute allowedRole="ADMIN"><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/lots"       element={<ProtectedRoute allowedRole="ADMIN"><ManageLots /></ProtectedRoute>} />
        <Route path="/admin/bookings"   element={<ProtectedRoute allowedRole="ADMIN"><AllBookings /></ProtectedRoute>} />
        <Route path="/admin/analytics"  element={<ProtectedRoute allowedRole="ADMIN"><PlatformAnalytics /></ProtectedRoute>} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
