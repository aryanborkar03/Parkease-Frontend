import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';
import LogoSvg from '../../assets/parkease-car-universal.svg';
import { LOGO_BASE64 } from '../../assets/logoBase64';

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function daysLeft(isoExpiry) {
  if (!isoExpiry) return 0;
  const diff = new Date(isoExpiry) - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

/* ─── Inline styles ───────────────────────────────────────────────────── */
const S = {
  hero: {
    background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)',
    borderRadius: 20,
    padding: '52px 40px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 32,
  },
  shimmer: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.06) 50%, transparent 60%)',
    backgroundSize: '200% 100%',
    animation: 'heroShimmer 3s linear infinite',
    pointerEvents: 'none',
  },
  label: {
    fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em',
    color: '#F59E0B', textTransform: 'uppercase', marginBottom: 12,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 900,
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff',
    marginBottom: 10, lineHeight: 1.1,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: 36,
  },
  featGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16, marginBottom: 28,
  },
  featCard: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '20px 16px', textAlign: 'center',
  },
  featIcon: { fontSize: '1.8rem', marginBottom: 8 },
  featTitle: { fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 },
  featSub: { color: 'var(--muted)', fontSize: '0.78rem' },
  priceBlock: {
    textAlign: 'center', marginBottom: 32,
    padding: '28px 24px',
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 18,
  },
  price: {
    fontFamily: 'var(--font-display)', fontWeight: 900,
    fontSize: '3rem', color: '#F59E0B', lineHeight: 1,
  },
  priceUnit: { color: 'var(--muted)', fontSize: '1rem', fontWeight: 500 },
  priceTagline: { color: 'var(--text)', fontSize: '0.85rem', marginTop: 6 },
  priceFine: { color: 'var(--muted)', fontSize: '0.72rem', marginTop: 6 },
  buyBtn: {
    display: 'inline-block', padding: '14px 36px',
    background: 'linear-gradient(135deg, #ea580c, #fb923c)',
    color: '#fff', fontWeight: 800, fontSize: '1rem',
    borderRadius: 999, border: 'none', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(234,88,12,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    letterSpacing: '0.02em',
  },
};

/* ─── PassCard component — matches parkease_premium_pass_card.html ──── */
function PassCard({ pass }) {
  const wrapRef  = useRef(null);
  const shineRef = useRef(null);
  const shadowRef = useRef(null);

  const state = useRef({
    currentX: 0, currentY: 0,
    targetX: 0,  targetY: 0,
    animating: false,
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    const s   = state.current;
    const wrap = wrapRef.current;
    const shad = shadowRef.current;
    if (!wrap) return;
    s.currentX = lerp(s.currentX, s.targetX, 0.12);
    s.currentY = lerp(s.currentY, s.targetY, 0.12);
    wrap.style.transform = `rotateY(${s.currentX}deg) rotateX(${s.currentY}deg)`;
    if (shad) {
      shad.style.transform = `translateX(${s.currentX * 1.5}px)`;
      shad.style.opacity   = String(0.5 + Math.abs(s.currentX) * 0.02 + Math.abs(s.currentY) * 0.02);
    }
    if (Math.abs(s.currentX - s.targetX) > 0.01 || Math.abs(s.currentY - s.targetY) > 0.01) {
      requestAnimationFrame(tick);
    } else {
      s.animating = false;
    }
  }

  function startAnim() {
    const s = state.current;
    if (!s.animating) { s.animating = true; requestAnimationFrame(tick); }
  }

  const onMove = useCallback((e) => {
    const s    = state.current;
    const wrap = wrapRef.current;
    const shine = shineRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    s.targetX =  dx * 18;
    s.targetY = -dy * 14;
    if (shine) {
      shine.style.background = `linear-gradient(${105 + dx * 30}deg, transparent 30%, rgba(255,255,255,${0.04 + Math.abs(dx) * 0.06}) 50%, transparent 70%)`;
    }
    startAnim();
  }, []);

  const onLeave = useCallback(() => {
    const s = state.current;
    const shine = shineRef.current;
    s.targetX = 0; s.targetY = 0;
    if (shine) shine.style.background = 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)';
    startAnim();
  }, []);

  const remaining = pass.parkingCountLimit - pass.parkingCountUsed;
  const usedPct   = Math.round((pass.parkingCountUsed / pass.parkingCountLimit) * 100);
  const days      = daysLeft(pass.expiresAt);
  const driverName = (pass.driverEmail || '').split('@')[0].toUpperCase();
  const passLabel  = `PE-${String(pass.passId).padStart(5, '0')}`;

  return (
    <div style={{ marginBottom: 28 }}>

      {/* Scene wrapper — perspective */}
      <div style={{ perspective: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Card wrap — 3D tilt target */}
        <div
          ref={wrapRef}
          style={{
            width: 380, height: 230,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'none',
            willChange: 'transform',
            cursor: 'pointer',
          }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          {/* Card face */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: 20, overflow: 'hidden',
            transformStyle: 'preserve-3d',
          }}>
            {/* BG */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }} />

            {/* Orange glow top-right */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(234,88,12,0.55) 0%, rgba(251,146,60,0.25) 50%, transparent 70%)',
              borderRadius: '50%',
            }} />
            {/* Orange glow bottom-left */}
            <div style={{ position: 'absolute', bottom: -60, left: -20, width: 160, height: 160, background: 'radial-gradient(circle, rgba(234,88,12,0.3) 0%, transparent 65%)', borderRadius: '50%' }} />
            {/* Grid lines */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            {/* Shine effect */}
            <div ref={shineRef} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)', pointerEvents: 'none', transition: 'opacity 0.3s' }} />

            {/* Card content */}
            <div style={{ position: 'absolute', inset: 0, padding: '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white' }}>
              {/* Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={LogoSvg} alt="ParkEase Logo" style={{ width: 28, height: 28, filter: 'brightness(0) invert(1)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--font-sans)' }}>ParkEase</span>
                </div>
                <span style={{ background: 'linear-gradient(90deg, #ea580c, #fb923c)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', color: 'white', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(234,88,12,0.4)' }}>Premium</span>
              </div>
              
              {/* Mid Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '0.06em', color: 'white', fontFamily: 'var(--font-sans)', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{driverName}</div>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(251,146,60,0.85)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>Pass Holder</div>
              </div>

              {/* Bottom Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>Parkings used</span>
                  <span style={{ fontSize: 17, fontWeight: 500, color: 'white', fontFamily: 'var(--font-sans)' }}>{pass.parkingCountUsed} / {pass.parkingCountLimit}</span>
                  <div style={{ width: 90, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginTop: 4 }}>
                    <div style={{ height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #ea580c, #fb923c)', width: `${usedPct}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>Valid until</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)', fontFamily: 'var(--font-sans)' }}>{fmtDate(pass.expiresAt)}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>Pass #{passLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      {/* Card shadow */}
        <div ref={shadowRef} style={{ position: 'absolute', bottom: -18, left: '10%', width: '80%', height: 30, background: 'radial-gradient(ellipse, rgba(234,88,12,0.35) 0%, transparent 70%)', filter: 'blur(8px)', borderRadius: '50%', transition: 'all 0.08s ease-out', pointerEvents: 'none' }} />
      </div>

      {/* Info strip */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        width: '100%',
        maxWidth: 480, 
        background: 'var(--surface-2)', 
        border: '1px solid var(--border)', 
        borderRadius: '12px', 
        padding: '16px 24px', 
        marginTop: 24,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Days remaining</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-sans)' }}>{days} days</span>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Parkings left</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>{remaining} <span style={{ fontSize: 12, color: 'var(--muted)' }}>/ {pass.parkingCountLimit}</span></span>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Vehicles</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>All covered</span>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Status</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: pass.status === 'CANCELLED' ? '#f59e0b' : '#10b981', fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>
            {pass.status === 'CANCELLED' ? `CANCELS ${fmtDate(pass.expiresAt)}` : pass.status}
          </span>
        </div>
      </div>
    </div>
  );
}


/* ─── Transaction history table ──────────────────────────────────────── */
function TransactionHistory({ transactions }) {
  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎫</div>
        <div style={{ fontWeight: 600 }}>No parkings used yet. Start parking!</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Booking #</th>
            <th>Amount</th>
            <th>Count After</th>
            <th>Transaction Ref</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.transactionId}>
              <td style={{ fontSize: '0.82rem' }}>
                {new Date(t.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td style={{ fontWeight: 700 }}>#{t.bookingId}</td>
              <td style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{Number(t.amount).toFixed(2)}</td>
              <td style={{ color: 'var(--muted)' }}>{t.countAfter} / 150</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--info)' }}>
                🎫 {t.passTransactionRef}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Marketing / Buy page ───────────────────────────────────────────── */
function BuyPassView({ expiredPass, onPurchaseSuccess, buying, setBuying, error, setError }) {
  const navigate = useNavigate();

  const handleBuy = async () => {
    setBuying(true);
    setError('');
    try {
      const order = await api.post('/api/pass/order', {});
      await loadRazorpayScript();

      const options = {
        key:      order.razorpayKeyId,
        amount:   order.amount * 100,
        currency: 'INR',
        name:     'ParkEase',
        description: 'ParkEase Premium Pass — 150 parkings / 30 days',
        order_id: order.razorpayOrderId,

        handler: async (response) => {
          try {
            const passData = await api.post('/api/pass/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            onPurchaseSuccess(passData);
          } catch (err) {
            setError('Pass activation failed: ' + err.message);
          }
          setBuying(false);
        },

        prefill: { email: localStorage.getItem('email') || '' },
        theme:   { color: '#ea580c' },
        image: LOGO_BASE64,
        modal:   { ondismiss: () => setBuying(false) },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      setError(err.message);
      setBuying(false);
    }
  };

  return (
    <>
      {/* Greyed-out old pass stamp */}
      {expiredPass && (
        <div style={{ marginBottom: 40, position: 'relative', width: 380, opacity: 0.8 }}>
          {/* Ghost version of the card — grayscale + EXPIRED stamp */}
          <div style={{
            width: 380, height: 230, borderRadius: 20, overflow: 'hidden',
            position: 'relative', opacity: 0.35, filter: 'grayscale(1)',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div style={{ position: 'absolute', inset: 0, padding: '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <img src={LogoSvg} alt="" style={{ width: 32, height: 32 }} />
                <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.08em' }}>ParkEase</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '0.06em' }}>{(expiredPass.driverEmail || '').split('@')[0].toUpperCase()}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Valid until {new Date(expiredPass.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Pass #PE-{String(expiredPass.passId).padStart(5,'0')}</span>
              </div>
            </div>
          </div>
          {/* EXPIRED / DEPLETED stamp */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            border: '4px solid #ef4444', color: '#ef4444',
            fontWeight: 900, fontSize: '1.8rem', letterSpacing: '0.15em',
            padding: '8px 24px', borderRadius: 8, pointerEvents: 'none',
            textShadow: '0 2px 12px rgba(239, 68, 68, 0.4)',
            boxShadow: 'inset 0 0 12px rgba(239, 68, 68, 0.2), 0 0 12px rgba(239, 68, 68, 0.2)'
          }}>
            {expiredPass.status}
          </div>
        </div>
      )}

      {/* Redesigned Premium Layout */}
      <div style={{ 
        display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center',
        background: 'linear-gradient(145deg, #121110 0%, #1a1816 100%)',
        borderRadius: 24, padding: '48px 56px', border: '1px solid rgba(255,255,255,0.03)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative Background Glows */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '100%', background: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '40%', height: '80%', background: 'radial-gradient(circle, rgba(251, 146, 60, 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Left Column: Value Proposition */}
        <div style={{ flex: '1 1 400px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: '#ea580c', textTransform: 'uppercase', marginBottom: 12 }}>
            Introducing
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.8rem', color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' }}>
            ParkEase <span style={{ background: 'linear-gradient(90deg, #ea580c, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Premium</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 32, maxWidth: 420 }}>
            Unlock the ultimate frictionless parking experience. Skip the individual payments and enjoy seamless entry to all partner lots.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { title: '150 Parkings', sub: 'Generous monthly allowance for daily commuters.' },
              { title: '30-Day Validity', sub: 'Valid for a full 30 days from the moment of purchase.' },
              { title: 'Any Vehicle', sub: 'No per-vehicle restrictions. Park any car you drive.' },
              { title: 'Automated Receipts', sub: 'Detailed ledger and downloadable invoices for your business expenses.' }
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Checkout Card */}
        <div style={{ flex: '0 0 340px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            background: 'var(--bg)', borderRadius: 20, padding: 32, 
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
              One-Time Purchase
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--muted)', marginTop: 8 }}>₹</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '4rem', color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' }}>5,000</span>
            </div>
            
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 24 }}>
              Just <strong>₹33</strong> per parking session.
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '0 -32px 24px', opacity: 0.5 }} />

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Instant digital delivery
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Zero hidden fees
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                No auto-renewal
              </li>
            </ul>

            <button
              onClick={handleBuy}
              disabled={buying}
              style={{
                width: '100%', padding: '16px',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#fff', fontWeight: 800, fontSize: '1rem',
                borderRadius: 12, border: 'none', cursor: buying ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(234,88,12,0.3)',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
              onMouseEnter={e => { if(!buying) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(234,88,12,0.4)'; }}
              onMouseLeave={e => { if(!buying) e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 8px 24px rgba(234,88,12,0.3)'; }}
            >
              {buying ? (
                <>
                  <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                  Processing...
                </>
              ) : 'Get Premium Pass'}
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.4, textAlign: 'center' }}>
              ParkEase Pass is non-refundable once purchased. Valid for 30 days or 150 parkings.
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Secured by Razorpay
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function Subscription() {
  const [pass,         setPass]         = useState(null);   // null = loading, false = no pass
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [buying,       setBuying]       = useState(false);
  const [error,        setError]        = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const loadData = useCallback(() => {
    Promise.allSettled([
      api.get('/api/pass/my'),
      api.get('/api/pass/transactions/current'),
    ]).then(([passRes, txnRes]) => {
      if (passRes.status === 'fulfilled') {
        setPass(passRes.value);
      } else {
        // 404 = no pass at all; other errors surface as error banner
        const msg = passRes.reason?.message || '';
        if (!msg.includes('No pass') && !msg.includes('404') && !msg.includes('not found')) {
          setError(msg);
        }
        setPass(false);
      }
      if (txnRes.status === 'fulfilled') {
        setTransactions(txnRes.value);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* Keyframe injection */
  useEffect(() => {
    if (document.getElementById('subscription-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'subscription-keyframes';
    style.textContent = `
      @keyframes heroShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes cardShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes slideUp { from{opacity:0;transform:translateY(32px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      @keyframes popIn { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
      @keyframes progressBar { from{width:0%} to{width:100%} }
    `;
    document.head.appendChild(style);
  }, []);

  const onPurchaseSuccess = (newPass) => {
    setPass(newPass);
    setTransactions([]);
  };

  const handleCancelPass = async () => {
    setCancelling(true);
    try {
      await api.post('/api/pass/cancel');
      setShowCancelModal(false);
      setCancelSuccess(true);
      // After 2.5 seconds, switch to the Buy Pass view
      setTimeout(() => {
        setCancelSuccess(false);
        setPass(false);
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to cancel pass');
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const isActive    = pass && pass.status === 'ACTIVE';
  const isInactive  = pass && (pass.status === 'DEPLETED' || pass.status === 'EXPIRED' || pass.status === 'CANCELLED');

  return (
    <DriverLayout
      title="My Subscription"
      subtitle="Manage your ParkEase Premium Pass"
    >
      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Cancellation Success Screen */}
      {cancelSuccess && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
            maxWidth: 380,
            width: '100%',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '1.4rem', color: 'var(--text)', marginBottom: 8,
            }}>Pass Cancelled</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 24 }}>
              Your premium pass has been successfully cancelled. Redirecting you...
            </p>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: '#10b981',
                borderRadius: 2,
                animation: 'progressBar 2.5s linear forwards',
              }} />
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <>
          {/* No pass or inactive → show buy page */}
          {(!pass || isInactive) && (
            <BuyPassView
              expiredPass={isInactive ? pass : null}
              onPurchaseSuccess={onPurchaseSuccess}
              buying={buying}
              setBuying={setBuying}
              error={error}
              setError={setError}
            />
          )}

          {/* Active pass → show card + history */}
          {isActive && (
            <>
              <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontWeight: 900, 
                    fontSize: '1.6rem', 
                    marginBottom: 6,
                    color: 'var(--text)',
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Your Premium Pass <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))' }}>💎</span>
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                    Active and ready to use at checkout.
                  </p>
                </div>
                {pass.status === 'ACTIVE' && (
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.08)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      color: '#ef4444', 
                      padding: '10px 20px', 
                      borderRadius: '8px', 
                      fontSize: '0.9rem', 
                      fontWeight: 600,
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'; }}
                  >
                    Cancel Pass
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
                <PassCard pass={pass} />
              </div>



              <div style={{ padding: '0 8px', marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20, color: 'var(--text)' }}>
                  Usage History
                </div>
                <TransactionHistory transactions={transactions} />
              </div>
            </>
          )}
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 24px 48px rgba(0,0,0,0.4)', position: 'relative' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>Cancel Premium Pass?</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 24 }}>
              Are you sure you want to cancel your pass? Your pass will remain active until <strong>{new Date(pass.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> or until your 150 parkings are used — whichever comes first. 
              <br/><br/>
              No refund will be issued. You can purchase a new pass once this one expires or is fully used.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={handleCancelPass}
                disabled={cancelling}
                style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--muted)', fontWeight: 600, fontSize: '0.9rem', cursor: cancelling ? 'not-allowed' : 'pointer', borderRadius: 8 }}
                onMouseEnter={e => { if(!cancelling) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if(!cancelling) e.currentTarget.style.background = 'transparent' }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Anyway'}
              </button>
              <button 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.9rem', borderRadius: 8, cursor: cancelling ? 'not-allowed' : 'pointer' }}
              >
                Keep My Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </DriverLayout>
  );
}
