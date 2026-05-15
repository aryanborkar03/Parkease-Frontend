import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert } from '../../components/common/UI';
import { api } from '../../utils/api';
import { LOGO_BASE64 } from '../../assets/logoBase64';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve; s.onerror = reject;
    document.body.appendChild(s);
  });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking,  setBooking]  = useState(null);
  const [payment,  setPayment]  = useState(null);
  const [pass,     setPass]     = useState(null);   // null = loading, false = no pass
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);
  const [error,    setError]    = useState('');
  const [method,   setMethod]   = useState('RAZORPAY'); // 'RAZORPAY' | 'PASS'

  const [passTxn,  setPassTxn]  = useState(null);  // existing pass transaction for this booking

  useEffect(() => {
    Promise.allSettled([
      api.get(`/api/bookings/${bookingId}`),
      api.get(`/api/payments/booking/${bookingId}`),
      api.get('/api/pass/my'),
      api.get(`/api/pass/transactions/booking/${bookingId}`),
    ]).then(([bookRes, payRes, passRes, passTxnRes]) => {
      if (bookRes.status === 'fulfilled') setBooking(bookRes.value);
      else setError(bookRes.reason?.message || 'Failed to load booking.');

      if (payRes.status === 'fulfilled') setPayment(payRes.value);

      if (passRes.status === 'fulfilled') setPass(passRes.value);
      else setPass(false);

      if (passTxnRes.status === 'fulfilled') setPassTxn(passTxnRes.value);

      setLoading(false);
    });
  }, [bookingId]);

  // Paid if either a Razorpay payment OR a pass transaction exists for this booking
  const alreadyPaid = payment?.status === 'PAID' || !!passTxn;

  /* ── Pass option meta ── */
  const now = Date.now();
  const passIsActive = pass
    && (pass.status === 'ACTIVE' || pass.status === 'CANCELLED')
    && new Date(pass.expiresAt).getTime() > now
    && pass.parkingCountUsed < pass.parkingCountLimit;

  const passBlockReason = !pass
    ? 'no-pass'
    : pass.status === 'EXPIRED'
      ? 'expired'
      : pass.status === 'DEPLETED'
        ? 'depleted'
        : !passIsActive
          ? 'expired'
          : null;

  /* ── Razorpay pay ── */
  const handleRazorpay = async () => {
    setPaying(true); setError('');
    try {
      const order = await api.post('/api/payments/order', {
        bookingId: Number(bookingId),
        amount:    booking.totalAmount,
        description: `Parking Booking #${bookingId}`,
      });

      await loadRazorpayScript();

      const options = {
        key:      order.razorpayKeyId,
        amount:   order.amount * 100,
        currency: 'INR',
        name:     'ParkEase',
        description: `Parking Booking #${bookingId}`,
        order_id: order.razorpayOrderId,

        handler: async (response) => {
          try {
            await api.post('/api/payments/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate('/driver/bookings', {
              state: { success: '✅ Payment successful! Your receipt will be emailed to you.' }
            });
          } catch (err) {
            setError('Payment verification failed: ' + err.message);
          }
        },

        prefill: { name: '', email: localStorage.getItem('email') || '' },
        theme:   { color: '#2563eb' },
        image: LOGO_BASE64,
        modal:   { ondismiss: () => setPaying(false) },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  /* ── Pass pay ── */
  const handlePassPay = async () => {
    setPaying(true); setError('');
    try {
      const txn = await api.post('/api/pass/pay', {
        bookingId: Number(bookingId),
        amount:    booking.totalAmount,
      });
      navigate('/driver/bookings', {
        state: {
          success: `✅ Pass payment successful! Transaction ID: ${txn.passTransactionRef}. Parkings remaining: ${pass.parkingCountLimit - txn.countAfter} / 150.`,
        },
      });
    } catch (err) {
      setError(err.message);
      // Auto-fallback: if server rejects pass payment, switch to Razorpay
      setMethod('RAZORPAY');
      setPaying(false);
    }
  };

  const handlePay = () => {
    if (method === 'PASS') handlePassPay();
    else handleRazorpay();
  };

  /* ── Already paid state ── */
  if (!loading && alreadyPaid) {
    const txnRef = passTxn?.passTransactionRef || payment?.razorpayPaymentId || '—';
    const method = passTxn ? '🎫 ParkEase Pass' : '💳 Razorpay';
    return (
      <DriverLayout title="Payment Receipt"
        topbarRight={<button className="btn btn-outline btn-sm" onClick={() => navigate('/driver/bookings')}>← My Bookings</button>}
      >
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 4 }}>Payment Complete ✅</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>This booking has already been paid.</p>
        </div>
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Booking #{bookingId} is paid</h3>
            <p style={{ marginTop: 8 }}>Amount: <strong>₹{booking?.totalAmount}</strong></p>
            <p style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--muted)' }}>Method: {method}</p>
            <p style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--muted)' }}>
              Transaction: {txnRef}
            </p>
          </div>
          <button className="btn btn-primary mt-3" style={{ width: '100%' }} onClick={() => navigate('/driver/bookings')}>
            Back to My Bookings
          </button>
        </div>
      </DriverLayout>
    );
  }

  if (loading) return <DriverLayout title="Payment"><Spinner /></DriverLayout>;

  /* ── Payment method option card ── */
  const MethodCard = ({ id, selected, disabled, onClick, children }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 12,
        background: selected ? 'rgba(37,99,235,0.04)' : 'var(--card)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'flex', alignItems: 'flex-start', gap: 12,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--muted)'}`,
        background: selected ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );

  return (
    <DriverLayout title="Complete Payment"
      topbarRight={<button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 4 }}>
          Complete Your Payment
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Choose how you'd like to pay for Booking #{bookingId}.
        </p>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {/* Booking summary card */}
      <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 14 }}>Booking Summary</h3>
        {[
          ['Booking ID',  `#${booking?.bookingId}`],
          ['Spot',        `#${booking?.spotId}`],
          ['Vehicle',     booking?.vehiclePlate],
          ['Check-in',    booking?.checkInTime  ? new Date(booking.checkInTime).toLocaleString()  : '—'],
          ['Check-out',   booking?.checkOutTime ? new Date(booking.checkOutTime).toLocaleString() : '—'],
        ].map(([label, value]) => (
          <div key={label} className="row-between"
            style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</span>
            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{value}</span>
          </div>
        ))}
        <div className="row-between mt-3" style={{ padding: '14px 0', borderTop: '2px solid var(--border)' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Total Amount</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--accent)' }}>
            ₹{booking?.totalAmount}
          </span>
        </div>
      </div>

      {/* Payment method selector */}
      <div className="card" style={{ maxWidth: 520 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', marginBottom: 16 }}>
          Choose Payment Method
        </h3>

        {/* Reserve Pay option */}
        <MethodCard
          id="razorpay"
          selected={method === 'RAZORPAY'}
          disabled={false}
          onClick={() => setMethod('RAZORPAY')}
        >
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>💳 Razorpay</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 2 }}>
            Card, UPI, Net Banking — powered by Razorpay
          </div>
        </MethodCard>

        {/* Pass option */}
        <MethodCard
          id="pass"
          selected={method === 'PASS'}
          disabled={!passIsActive}
          onClick={() => setMethod('PASS')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🎫 ParkEase Pass</span>
            {passIsActive && (
              <span style={{
                background: 'linear-gradient(135deg,#F59E0B,#D97706)',
                color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                padding: '2px 8px', borderRadius: 999, letterSpacing: '0.05em',
              }}>ACTIVE</span>
            )}
          </div>

          {passBlockReason === 'no-pass' && (
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>
              No active pass.{' '}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontWeight: 600 }}
                onClick={() => navigate('/driver/subscription')}
              >→ Buy one in Subscriptions</button>
            </div>
          )}
          {passBlockReason === 'expired' && (
            <div style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: 4 }}>
              Pass expired on {fmtDate(pass?.expiresAt)}.{' '}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontWeight: 600 }}
                onClick={() => navigate('/driver/subscription')}
              >Buy a new one →</button>
            </div>
          )}
          {passBlockReason === 'depleted' && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4 }}>
              Pass fully used (150 / 150).{' '}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontWeight: 600 }}
                onClick={() => navigate('/driver/subscription')}
              >Buy a new one →</button>
            </div>
          )}
          {passIsActive && (
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>
              {pass.parkingCountLimit - pass.parkingCountUsed} parkings remaining · Valid till {fmtDate(pass.expiresAt)}
            </div>
          )}
        </MethodCard>

        {/* Submit button */}
        <button
          className="btn btn-primary mt-3"
          style={{
            width: '100%', padding: '13px', fontSize: '1rem',
            background: method === 'PASS'
              ? 'linear-gradient(135deg, #4c1d95, #7c3aed)'
              : undefined,
          }}
          onClick={handlePay}
          disabled={paying}
        >
          {paying
            ? 'Processing…'
            : method === 'PASS'
              ? `🎫 Pay ₹${booking?.totalAmount} with Pass`
              : `💳 Pay ₹${booking?.totalAmount} via Razorpay`}
        </button>

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.72rem', color: 'var(--muted)' }}>
          {method === 'PASS'
            ? '🎫 Instant deduction from your ParkEase Pass balance.'
            : '🔒 Secured by Razorpay. Your payment info is never stored on our servers.'}
        </p>
      </div>
    </DriverLayout>
  );
}
