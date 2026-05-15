import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/common/UI';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>

        <Alert type="info">
          Password reset is now done via OTP. Please use the Forgot Password page.
        </Alert>

        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/forgot-password')}
          style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '16px' }}
        >
          Go to Forgot Password
        </button>
      </div>
    </div>
  );
}