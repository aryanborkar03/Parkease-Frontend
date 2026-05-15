import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert, EmptyState } from '../../components/common/UI';
import { api, getToken } from '../../utils/api';

export default function ManageLots() {
  const [pending, setPending]   = useState([]);
  const [allLots, setAllLots]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [tab, setTab]           = useState('pending');

  const token = getToken();

  const load = () => {
    if (!token) return;
    Promise.all([
      api.get('/api/lots/admin/pending'),
      api.get('/api/lots'),
      api.get('/api/admin/users')
    ])
      .then(([p, a, u]) => { setPending(p); setAllLots(a); setUsers(u); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const approve = async (id) => {
    try { await api.put(`/api/lots/admin/${id}/approve`); setSuccess('Lot approved!'); load(); }
    catch (err) { setError(err.message); }
  };
  const reject = async (id) => {
    try { await api.put(`/api/lots/admin/${id}/reject`); setSuccess('Lot rejected.'); load(); }
    catch (err) { setError(err.message); }
  };

  const userMap = users.reduce((map, u) => {
    map[u.email] = u.fullName;
    return map;
  }, {});

  const LotRow = ({ lot, showActions }) => {
    const managerName = lot.managerName || userMap[lot.managerEmail] || lot.managerEmail.split('@')[0];
    return (
      <tr>
        <td><strong>#{lot.lotId}</strong></td>
        <td>{lot.name}</td>
        <td>{lot.city}</td>
        <td>{lot.totalSpots}</td>
        <td>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{managerName}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{lot.managerEmail}</div>
        </td>
        <td>
          <span className={`badge ${lot.approved ? 'badge-success' : 'badge-warning'}`}>
            {lot.approved ? '✓ Approved' : '⏳ Pending'}
          </span>
        </td>
        <td>
          <span className={`badge ${lot.open ? 'badge-success' : 'badge-muted'}`}>
            {lot.open ? '● Open' : '● Closed'}
          </span>
        </td>
        {showActions && (
          <td style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => approve(lot.lotId)}>Approve</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => reject(lot.lotId)}>Reject</button>
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <AdminLayout
      title="Manage Parking Lots"
      subtitle={`${pending.length} lots pending approval 🏢`}
    >

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24, maxWidth: 360 }}>
        {[['pending', `Pending (${pending.length})`], ['all', `All Lots (${allLots.length})`]].map(([key, label]) => (
          <div key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="card">
          {tab === 'pending' ? (
            pending.length === 0 ? (
              <EmptyState icon="✅" title="No pending lots" message="All lot registrations have been reviewed." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ID</th><th>Name</th><th>City</th><th>Spots</th><th>Manager</th><th>Status</th><th>Open</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                  <tbody>{pending.map(l => <LotRow key={l.lotId} lot={l} showActions />)}</tbody>
                </table>
              </div>
            )
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>ID</th><th>Name</th><th>City</th><th>Spots</th><th>Manager</th><th>Approval</th><th>Open</th></tr></thead>
                <tbody>{allLots.map(l => <LotRow key={l.lotId} lot={l} showActions={false} />)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
