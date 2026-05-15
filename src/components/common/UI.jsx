import React from 'react';

/* ── Topbar ──────────────────────────────────────────── */
export function Topbar({ title, subtitle, children, onMenuToggle }) {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onMenuToggle && (
          <button
            className="hamburger-btn"
            onClick={onMenuToggle}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-sub">{subtitle}</div>}
        </div>
      </div>
      {children && <div className="topbar-actions">{children}</div>}
    </header>
  );
}

/* ── Modal ───────────────────────────────────────────── */
export function Modal({ isOpen, onClose, title, subtitle, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────── */
export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner"></div>
    </div>
  );
}

/* ── Alert ───────────────────────────────────────────── */
export function Alert({ type = 'info', children, onClose }) {
  return (
    <div className={`alert alert-${type}`}>
      <span>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'none', border: 'none',
                   cursor: 'pointer', fontSize: '1rem', opacity: 0.6 }}
        >✕</button>
      )}
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────── */
export function StatusBadge({ status, dot = true }) {
  const config = {
    RESERVED:   { cls: 'badge-info',     label: 'Reserved'  },
    ACTIVE:     { cls: 'badge-success',  label: 'Active'    },
    COMPLETED:  { cls: 'badge-accent',   label: 'Completed' },
    CANCELLED:  { cls: 'badge-danger',   label: 'Cancelled' },
    PENDING:    { cls: 'badge-warning',  label: 'Pending'   },
    PAID:       { cls: 'badge-success',  label: 'Paid'      },
    REFUNDED:   { cls: 'badge-info',     label: 'Refunded'  },
    FAILED:     { cls: 'badge-danger',   label: 'Failed'    },
    AVAILABLE:  { cls: 'badge-success',  label: 'Available' },
    true:       { cls: 'badge-success',  label: 'Active'   },
    false:      { cls: 'badge-danger',   label: 'Inactive' },
  };
  const { cls, label } = config[status] || { cls: 'badge-muted', label: status };
  return (
    <span className={`badge ${cls}`}>
      {dot && <span className="badge-dot"></span>}
      {label}
    </span>
  );
}

/* ── Empty State ─────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ── Confirm Dialog ──────────────────────────────────── */
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="row gap-12" style={{ justifyContent: 'flex-end', width: '100%' }}>
          <button className="btn btn-outline btn-md" onClick={onClose}>Cancel</button>
          <button
            className={`btn btn-md ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            Confirm
          </button>
        </div>
      }
    >
      <div style={{ fontSize: '0.95rem', color: 'var(--text-soft)' }}>{message}</div>
    </Modal>
  );
}

/* ── Suspension Overlay ──────────────────────────────── */
export function SuspensionOverlay() {
  return (
    <div className="modal-backdrop" style={{ zIndex: 9999, background: 'rgba(15, 12, 9, 0.95)', backdropFilter: 'blur(8px)' }}>
      <div className="card" style={{ backgroundColor: '#1a1816', maxWidth: 440, textAlign: 'center', padding: '48px 32px', border: '1px solid var(--danger)', boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>🚫</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem', color: '#ffffff', marginBottom: 12 }}>Account Suspended</h2>
        <p style={{ color: '#b0ada8', fontSize: '1rem', lineHeight: 1.6, marginBottom: 32 }}>
          Your account has been suspended by an administrator. You do not have permission to access the platform at this time.
        </p>
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ffb3b3', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '12px', marginBottom: 32, fontSize: '0.9rem', fontWeight: 500 }}>
          "You are suspended. Please contact your admin."
        </div>
        <button className="btn btn-danger" style={{ width: '100%', border: 'none' }} onClick={() => {
          localStorage.clear();
          window.location.href = '/login';
        }}>
          Logout
        </button>
      </div>
    </div>
  );
}
