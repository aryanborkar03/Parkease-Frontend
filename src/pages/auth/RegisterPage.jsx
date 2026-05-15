import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, saveAuth } from '../../utils/api';
import { Alert } from '../../components/common/UI';
import LogoSvg from '../../assets/parkease-car-universal.svg';

// ── Validation Rules ──────────────────────────────────────────────────────────
const validate = (form) => {
  const errors = {};

  if (!form.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!form.email.trim()) errors.email = 'Email is required.';
  if (!form.password) errors.password = 'Password is required.';
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'Passwords do not match.';

  return errors;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'DRIVER' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const handle = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = e => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    // Validate on blur
    const fieldErrors = validate({ ...form });
    setErrors(prev => ({ ...prev, [name]: fieldErrors[name] || '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields touched
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // Don't send confirmPassword to backend
      const { confirmPassword, ...payload } = form;
      const data = await authApi.post('/api/auth/register', payload);
      saveAuth(data);
      const routes = { DRIVER: '/driver', LOT_MANAGER: '/manager', ADMIN: '/admin' };
      navigate(routes[data.role] || '/driver');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <img src={LogoSvg} alt="ParkEase Icon" style={{ width: 48, height: 48 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>ParkEase</div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Create Your Account
          </div>
        </div>

        {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Full Name */}
          <div className="input-wrap">
            <label className="input-label">Full Name</label>
            <input
              name="fullName"
              placeholder="Aryan Borkar"
              value={form.fullName}
              onChange={handle}
              onBlur={handleBlur}
              style={{ borderColor: touched.fullName && errors.fullName ? '#e53e3e' : '' }}
            />
            {touched.fullName && errors.fullName && (
              <span style={{ color: '#e53e3e', fontSize: 11, marginTop: 3, display: 'block' }}>
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="input-wrap">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              onBlur={handleBlur}
              style={{ borderColor: touched.email && errors.email ? '#e53e3e' : '' }}
            />
            {touched.email && errors.email && (
              <span style={{ color: '#e53e3e', fontSize: 11, marginTop: 3, display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="input-wrap">
            <label className="input-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handle}
              onBlur={handleBlur}
              style={{ borderColor: touched.password && errors.password ? '#e53e3e' : '' }}
            />
            {touched.password && errors.password && (
              <span style={{ color: '#e53e3e', fontSize: 11, marginTop: 3, display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="input-wrap">
            <label className="input-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handle}
              onBlur={handleBlur}
              style={{ borderColor: touched.confirmPassword && errors.confirmPassword ? '#e53e3e' : '' }}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span style={{ color: '#e53e3e', fontSize: 11, marginTop: 3, display: 'block' }}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Role */}
          <div className="input-wrap">
            <label className="input-label">Role</label>
            <select name="role" value={form.role} onChange={handle}>
              <option value="DRIVER">Driver — Looking for parking</option>
              <option value="LOT_MANAGER">Lot Manager — I manage parking lots</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', height: 42, justifyContent: 'center', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999, marginTop: 2 }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </div>

      </div>
    </div>
  );
}
