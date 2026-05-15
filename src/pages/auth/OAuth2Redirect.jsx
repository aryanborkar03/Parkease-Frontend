import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveAuth } from '../../utils/api';

const OAuth2Redirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Extract the exact parameters from the URL address bar
    const params = new URLSearchParams(location.search);
    
    const accessToken = params.get('token');
    const refreshToken = params.get('refreshToken');
    const role = params.get('role');
    const email = params.get('email');
    const userId = params.get('userId');
    const active = params.get('active');
    
    // CRITICAL: This key MUST match the queryParam key in your Java OAuth2SuccessHandler
    const fullName = params.get('fullName'); 

    if (accessToken && refreshToken) {
      // 2. Save to localStorage using your utility
      saveAuth({ 
        accessToken, 
        refreshToken,
        role: role || 'DRIVER',
        email,
        fullName, // This will now save "Aryan Borkar" instead of null
        userId,
        active
      });

      // 3. Navigate to the dashboard based on role
      const dashboardRoutes = {
        ADMIN: '/admin',
        LOT_MANAGER: '/manager',
        DRIVER: '/driver'
      };

      navigate(dashboardRoutes[role] || '/driver', { replace: true });
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [navigate, location]);

  return (
    <div className="auth-page d-flex align-items-center justify-content-center">
      <div className="text-center" style={{ marginTop: '100px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3 className="mt-3">Authenticating with Google...</h3>
        <p className="text-muted">Please wait while we sync your account.</p>
      </div>
    </div>
  );
};

export default OAuth2Redirect;