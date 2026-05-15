import React, { useEffect, useState } from 'react';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { api, GATEWAY_URL, getToken } from '../../utils/api';

export default function ReceiptsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/payments/my'),
      api.get('/api/pass/transactions'),
    ]).then(([paymentsRes, passRes]) => {
      const payments = paymentsRes.status === 'fulfilled'
        ? paymentsRes.value.filter(p => p.status === 'PAID').map(p => ({ ...p, _type: 'RAZORPAY' }))
        : [];
      const passTxns = passRes.status === 'fulfilled'
        ? passRes.value.map(t => ({ ...t, _type: 'PASS' }))
        : [];
      // Merge: sort by paidAt / createdAt descending
      const combined = [
        ...payments.map(p => ({ ...p, _sortKey: p.paidAt })),
        ...passTxns.map(t => ({ ...t, _sortKey: t.createdAt })),
      ].sort((a, b) => new Date(b._sortKey) - new Date(a._sortKey));
      setPayments(combined);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const triggerDownload = async (url, filename) => {
    const response = await api.download(url);
    if (!response.ok) throw new Error('Receipt not available. Please try again.');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  const downloadReceipt = async (paymentId) => {
    setDownloading(`pay-${paymentId}`);
    try {
      await triggerDownload(`/api/payments/${paymentId}/receipt`, `ParkEase_Receipt_${paymentId}.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const downloadPassReceipt = async (txnId) => {
    setDownloading(`pass-${txnId}`);
    try {
      await triggerDownload(`/api/pass/transactions/${txnId}/receipt`, `ParkEase_PassReceipt_${txnId}.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DriverLayout title="My Receipts" subtitle="Download PDF receipts for completed payments 🧾">

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : payments.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No receipts yet"
          message="Receipts appear here after a completed payment."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {payments.map((p, i) => {
            const isPass   = p._type === 'PASS';
            const cardKey  = isPass ? `pass-${p.transactionId}` : `pay-${p.paymentId}`;
            const txnId    = isPass ? p.passTransactionRef : p.razorpayPaymentId;
            const dateStr  = isPass ? p.createdAt : p.paidAt;
            const amount   = p.amount;
            const bookingId = p.bookingId;
            const dlId     = isPass ? `pass-${p.transactionId}` : p.paymentId;

            return (
              <div key={cardKey} className="card" style={{ padding: '24px 32px' }}>

                {/* Top Row */}
                <div className="row-between" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>BOOKING #{bookingId}</span>
                      <span style={{ color: 'var(--muted)' }}>•</span>
                      {isPass ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          🎫 PASS TXN #{p.transactionId}
                          <span style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.08em' }}>PASS</span>
                        </span>
                      ) : (
                        <span>PAYMENT #{p.paymentId}</span>
                      )}
                    </div>
                    {txnId && (
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--muted)', marginTop: 4, letterSpacing: '0.05em' }}>
                        TXN: {txnId}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>
                    {dateStr ? new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '0 -32px 16px -32px' }} />

                {/* Bottom Row */}
                <div className="row-between" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: 'var(--accent)', letterSpacing: '-0.03em' }}>
                      ₹{amount}
                    </div>
                    <div style={{ background: isPass ? '#fefce8' : '#f0fdf4', color: isPass ? '#D97706' : '#22c55e', padding: '4px 10px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%' }}></span>
                      {isPass ? '🎫 PASS' : 'PAID'}
                    </div>
                  </div>

                  <button
                    className="btn btn-outline btn-sm"
                    style={{ borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, padding: '8px 24px', letterSpacing: '0.05em' }}
                    onClick={() => isPass ? downloadPassReceipt(p.transactionId) : downloadReceipt(p.paymentId)}
                    disabled={downloading === `pass-${p.transactionId}` || downloading === `pay-${p.paymentId}`}
                  >
                    {downloading === (isPass ? `pass-${p.transactionId}` : `pay-${p.paymentId}`)
                      ? '⏳ DOWNLOADING...'
                      : isPass ? '🎫 ↓ DOWNLOAD PDF' : '↓ DOWNLOAD PDF'}
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
