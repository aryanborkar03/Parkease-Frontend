import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi, saveAuth } from '../../utils/api';
import { Alert } from '../../components/common/UI';
import LogoSvg from '../../assets/parkease-car-universal.svg';

/* ─── Eye Tracking: Pupil (no white sclera) ─────────── */
function Pupil({ size = 12, maxDistance = 5, color = '#1a1816', forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = mouseX - cx, dy = mouseY - cy;
    const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  })();

  return (
    <div ref={ref} style={{
      width: size, height: size, borderRadius: '50%', backgroundColor: color,
      transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 0.1s ease-out',
    }} />
  );
}

/* ─── Eye Tracking: EyeBall (white sclera + pupil) ───── */
function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = 'white', pupilColor = '#1a1816', isBlinking = false, forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = mouseX - cx, dy = mouseY - cy;
    const d = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  })();

  return (
    <div ref={ref} style={{
      width: size, height: isBlinking ? 2 : size, borderRadius: '50%',
      backgroundColor: eyeColor, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}>
      {!isBlinking && (
        <div style={{
          width: pupilSize, height: pupilSize, borderRadius: '50%', backgroundColor: pupilColor,
          transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 0.1s ease-out',
        }} />
      )}
    </div>
  );
}

/* ─── Main Login Page ────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Auth state (preserved exactly from original) ──
  const [form, setForm] = useState({ email: '', password: '' });
  const searchParams = new URLSearchParams(location.search);
  const isSuspended = searchParams.get('suspended') === 'true';
  const [error, setError] = useState(isSuspended ? 'Your account has been suspended. Please contact your administrator.' : '');
  const [loading, setLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const guestMessage = location.state?.message;
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Password visibility ──
  const [showPassword, setShowPassword] = useState(false);

  // ── Character animation state ──
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  // Mouse tracking
  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Blinking – purple character
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => { setIsPurpleBlinking(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // Blinking – black character
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => { setIsBlackBlinking(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // Characters look at each other when typing starts
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(t);
    }
    setIsLookingAtEachOther(false);
  }, [isTyping]);

  // Purple peeks when password is visible
  useEffect(() => {
    if (form.password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    }
    setIsPurplePeeking(false);
  }, [form.password, showPassword, isPurplePeeking]);

  // Calculate character body lean from mouse position
  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 3;
    const dx = mouseX - cx, dy = mouseY - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const pp = calcPos(purpleRef);
  const bp = calcPos(blackRef);
  const yp = calcPos(yellowRef);
  const op = calcPos(orangeRef);

  const pwdVisible = form.password.length > 0 && showPassword;
  const pwdHidden = form.password.length > 0 && !showPassword;

  // ── Auth submit (preserved exactly from original) ──
  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate before calling API
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.password) errs.password = 'Password is required.';
    if (Object.keys(errs).length > 0) {
      setLoginErrors(errs);
      return;
    }
    setLoginErrors({});
    setLoading(true);
    try {
      const data = await authApi.post('/api/auth/login', form);
      saveAuth(data);
      const redirect = sessionStorage.getItem('redirectAfterLogin');
      if (redirect) { sessionStorage.removeItem('redirectAfterLogin'); navigate(redirect); return; }
      const routes = { DRIVER: '/driver', LOT_MANAGER: '/manager', ADMIN: '/admin' };
      navigate(routes[data.role] || '/driver');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split">

      {/* ═══ Left: Hero Panel with Animated Characters ═══ */}
      <div className="login-hero-panel">
        <div className="login-grid-overlay" />

        {/* Brand */}
        <div className="login-hero-brand">
          <img src={LogoSvg} style={{ width: 48, height: 48 }} alt="ParkEase Icon" />
          <div className="login-hero-brand-name">ParkEase</div>
        </div>

        {/* Characters */}
        <div className="login-characters-stage" style={{ transform: 'translateY(-40px)' }}>
          <div className="login-characters-wrap">

            {/* ── Terracotta tall character (back-left) ── */}
            <div
              ref={purpleRef}
              className="char-body"
              style={{
                left: 60,
                width: 170,
                height: (isTyping || pwdHidden) ? 420 : 380,
                backgroundColor: '#c84b2f',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform: pwdVisible
                  ? 'skewX(0deg)'
                  : (isTyping || pwdHidden)
                    ? `skewX(${(pp.bodySkew || 0) - 12}deg) translateX(40px)`
                    : `skewX(${pp.bodySkew || 0}deg)`,
              }}
            >
              <div
                className="char-eyes"
                style={{
                  gap: 30,
                  left: pwdVisible ? 16 : isLookingAtEachOther ? 50 : 40 + pp.faceX,
                  top: pwdVisible ? 32 : isLookingAtEachOther ? 60 : 36 + pp.faceY,
                }}
              >
                <EyeBall size={18} pupilSize={7} maxDistance={5} pupilColor="#1a1816" isBlinking={isPurpleBlinking}
                  forceLookX={pwdVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={pwdVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall size={18} pupilSize={7} maxDistance={5} pupilColor="#1a1816" isBlinking={isPurpleBlinking}
                  forceLookX={pwdVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={pwdVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            {/* ── Dark tall character (middle) ── */}
            <div
              ref={blackRef}
              className="char-body"
              style={{
                left: 220,
                width: 115,
                height: 300,
                backgroundColor: '#2D2D2D',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform: pwdVisible
                  ? 'skewX(0deg)'
                  : isLookingAtEachOther
                    ? `skewX(${(bp.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || pwdHidden)
                      ? `skewX(${(bp.bodySkew || 0) * 1.5}deg)`
                      : `skewX(${bp.bodySkew || 0}deg)`,
              }}
            >
              <div
                className="char-eyes"
                style={{
                  gap: 22,
                  left: pwdVisible ? 8 : isLookingAtEachOther ? 30 : 24 + bp.faceX,
                  top: pwdVisible ? 26 : isLookingAtEachOther ? 10 : 30 + bp.faceY,
                }}
              >
                <EyeBall size={16} pupilSize={6} maxDistance={4} pupilColor="#2D2D2D" isBlinking={isBlackBlinking}
                  forceLookX={pwdVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={pwdVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall size={16} pupilSize={6} maxDistance={4} pupilColor="#2D2D2D" isBlinking={isBlackBlinking}
                  forceLookX={pwdVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={pwdVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            {/* ── Warm sand semi-circle (front-left) ── */}
            <div
              ref={orangeRef}
              className="char-body"
              style={{
                left: 0,
                width: 220,
                height: 190,
                backgroundColor: '#d4a574',
                borderRadius: '110px 110px 0 0',
                zIndex: 3,
                transform: pwdVisible ? 'skewX(0deg)' : `skewX(${op.bodySkew || 0}deg)`,
              }}
            >
              <div
                className="char-eyes"
                style={{
                  gap: 30,
                  left: pwdVisible ? 46 : 76 + (op.faceX || 0),
                  top: pwdVisible ? 80 : 85 + (op.faceY || 0),
                }}
              >
                <Pupil size={12} maxDistance={5} color="#1a1816" forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} color="#1a1816" forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
              </div>
            </div>

            {/* ── Gold tall character (front-right) ── */}
            <div
              ref={yellowRef}
              className="char-body"
              style={{
                left: 295,
                width: 135,
                height: 220,
                backgroundColor: '#c9a84c',
                borderRadius: '68px 68px 0 0',
                zIndex: 4,
                transform: pwdVisible ? 'skewX(0deg)' : `skewX(${yp.bodySkew || 0}deg)`,
              }}
            >
              <div
                className="char-eyes"
                style={{
                  gap: 22,
                  left: pwdVisible ? 18 : 48 + (yp.faceX || 0),
                  top: pwdVisible ? 32 : 38 + (yp.faceY || 0),
                }}
              >
                <Pupil size={12} maxDistance={5} color="#1a1816" forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} color="#1a1816" forceLookX={pwdVisible ? -5 : undefined} forceLookY={pwdVisible ? -4 : undefined} />
              </div>
              {/* Mouth */}
              <div className="char-mouth" style={{
                width: 56,
                left: pwdVisible ? 8 : 36 + (yp.faceX || 0),
                top: pwdVisible ? 80 : 82 + (yp.faceY || 0),
              }} />
            </div>

          </div>
        </div>


      </div>

      {/* ═══ Right: Login Form ═══ */}
      <div className="login-form-panel">
        <div className="login-form-inner">

          {/* Mobile-only logo */}
          <div className="login-form-mobile-logo">
            <img src={LogoSvg} alt="ParkEase Icon" style={{ width: 48, height: 48 }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>ParkEase</div>
          </div>

          {/* Header */}
          <div className="login-form-header">
            <h1>Welcome Back!</h1>
            <p>Smart Parking Management Platform</p>
          </div>

          {/* Alerts */}
          {guestMessage && <Alert type="info" style={{ marginBottom: 16 }}>{guestMessage}</Alert>}
          {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

          {/* Form */}
          <form onSubmit={submit} className="login-form-body">

            <div className="input-wrap">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handle}
                onFocus={() => setIsTyping(true)}
                onBlur={() => { setIsTyping(false); }}
              />
              {loginErrors.email && (
                <span style={{ color: '#e53e3e', fontSize: 11, marginTop: 3, display: 'block' }}>
                  {loginErrors.email}
                </span>
              )}
            </div>

            <div className="input-wrap">
              <label className="input-label">Password</label>
              <div className="login-pwd-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handle}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="login-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {loginErrors.password && (
                <span style={{ color: '#e53e3e', fontSize: 11, marginTop: 3, display: 'block' }}>
                  {loginErrors.password}
                </span>
              )}
            </div>

            <div className="login-remember-row" style={{ justifyContent: 'flex-end' }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 44, justifyContent: 'center', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="login-divider"><span>or</span></div>

            <button
              type="button"
              style={{ width: '100%', height: 44, background: '#141311', color: '#fff', border: 'none', borderRadius: 999, fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              onClick={() => window.location.href = 'https://51.21.141.9.nip.io/oauth2/authorization/google'}
            >
              <span style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: 16 }}>G</span>
              Continue with Google
            </button>
          </form>

          <div className="login-signup-link">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </div>
          <div className="login-guest-link">
            <Link to="/">← Browse lots without signing in</Link>
          </div>

        </div>
      </div>
    </div>
  );
}
