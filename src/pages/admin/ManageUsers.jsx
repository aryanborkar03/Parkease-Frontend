import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Spinner, Alert, EmptyState, ConfirmModal } from '../../components/common/UI';
import { api } from '../../utils/api';

export default function ManageUsers() {
  const [users, setUsers]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [confirmId, setConfirmId]   = useState(null);

  const load = () => {
    setLoading(true);
    return api.get('/api/admin/users')
      .then(data => { setUsers(data); setFiltered(data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'ALL') result = result.filter(u => u.role === roleFilter);
    if (search.trim()) result = result.filter(u =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase())
    );
    
    // Ensure ADMIN always appears at the top, then sort alphabetically
    result.sort((a, b) => {
      if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
      if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });
    
    setFiltered(result);
  }, [search, roleFilter, users]);

  const suspend = async (id) => {
    try { await api.put(`/api/admin/users/${id}/suspend`); setSuccess('User suspended.'); load(); }
    catch (err) { setError(err.message); }
  };
  const activate = async (id) => {
    try { await api.put(`/api/admin/users/${id}/activate`); setSuccess('User activated.'); load(); }
    catch (err) { setError(err.message); }
  };

  // Step 1 — open the confirm modal
  const requestDelete = (id) => setConfirmId(id);

  // Step 2 — called when admin clicks Confirm inside the modal
  const confirmDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await api.delete(`/api/admin/users/${id}`);
      // Immediately remove from local state — instant UI update
      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccess('User deleted.');
    } catch (err) {
      setError(err.message);
    }
  };



  return (
    <AdminLayout
      title="Manage Users"
      subtitle={`${users.length} total users on the platform 👥`}
    >

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="form-control" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select className="form-control" value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)} style={{ width: 160 }}>
            <option value="ALL">All Roles</option>
            <option value="DRIVER">Drivers</option>
            <option value="LOT_MANAGER">Managers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="👥" title="No users found" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Provider</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'LOT_MANAGER' ? 'badge-info' : 'badge-muted'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td><span className="badge badge-muted">{u.provider}</span></td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? '● Active' : '● Suspended'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'ADMIN' ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          {u.active
                            ? <button className="btn btn-outline btn-sm" style={{ color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => suspend(u.id)}>Suspend</button>
                            : <button className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => activate(u.id)}>Activate</button>
                          }
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => requestDelete(u.id)}>Delete</button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600, display: 'block', textAlign: 'right' }}>Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="This will permanently delete the user and all their data. This action cannot be undone."
        danger={true}
      />
    </AdminLayout>
  );
}
