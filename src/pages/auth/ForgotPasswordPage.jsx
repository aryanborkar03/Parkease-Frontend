import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../utils/api';
import { Alert } from '../../components/common/UI';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      await authApi.post('/api/auth/forgot-password', { email });
      setSuccess(`OTP sent to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await authApi.post('/api/auth/reset-password', { email, otp, newPassword });
      setSuccess('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        
        {step === 1 ? (
          <p>Enter your email to receive an OTP.</p>
        ) : (
          <p>Enter the 6-digit OTP sent to your email and set a new password.</p>
        )}

        {success && <Alert type="success">{success}</Alert>}
        {error && <Alert type="danger">{error}</Alert>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <input
              className="form-control"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '16px' }}>
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <input
              className="form-control"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{ marginBottom: '12px' }}
            />
            
            <input
              className="form-control"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ marginBottom: '12px' }}
            />

            <input
              className="form-control"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '16px' }}>
              Reset Password
            </button>
          </form>
        )}

        <p className="mt-3">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}