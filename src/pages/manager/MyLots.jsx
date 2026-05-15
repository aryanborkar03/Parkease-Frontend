import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Modal, Alert, EmptyState, StatusBadge } from '../../components/common/UI';
import { api, getUserName } from '../../utils/api';

const EMPTY_FORM = {
  name: '', address: '', city: '',
  latitude: '', longitude: '',
  totalSpots: '', openTime: '08:00', closeTime: '22:00', imageUrl: '',
  vehicleTypes: ['FOUR_WHEELER'],
  isEv: false,
  isHandicapped: false
};

export default function MyLots() {
  const navigate = useNavigate();
  const [lots, setLots]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

const load = () => {
  api.get('/api/lots/my-lots')
    .then(setLots)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
};

  useEffect(load, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (lot) => {
    setEditing(lot.lotId);
    setForm({
      name: lot.name, address: lot.address, city: lot.city,
      latitude: lot.latitude, longitude: lot.longitude,
      totalSpots: lot.totalSpots,
      openTime: lot.openTime || '08:00',
      closeTime: lot.closeTime || '22:00',
      imageUrl: lot.imageUrl || '',
      vehicleTypes: lot.vehicleTypes || ['FOUR_WHEELER'],
      isEv: lot.isEv || false,
      isHandicapped: lot.isHandicapped || false
    });
    setShowModal(true);
  };

  const save = async () => {
    setError('');
    try {
      const payload = { 
        ...form, 
        latitude: Number(form.latitude), 
        longitude: Number(form.longitude), 
        totalSpots: Number(form.totalSpots),
        managerName: getUserName()
      };
      if (editing) {
        await api.put(`/api/lots/${editing}`, payload);
        setSuccess('Lot updated successfully.');
      } else {
        await api.post('/api/lots', payload);
        setSuccess('Lot registered! Awaiting admin approval.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (lotId) => {
    try {
      await api.put(`/api/lots/${lotId}/toggle`);
      setSuccess('Lot status updated.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleVehicleType = (type) => {
    setForm(prev => {
      const types = prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type];
      return { ...prev, vehicleTypes: types };
    });
  };

  return (
    <ManagerLayout
      title="My Parking Lots"
      subtitle="Register and manage your parking facilities 🏢"
      topbarRight={
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          + Register Lot
        </button>
      }
    >

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : lots.length === 0 ? (
        <EmptyState icon="🏢" title="No lots registered"
          message="Register your first parking facility to get started."
          action={<button className="btn btn-primary" onClick={openAdd}>Register Lot</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {lots.map(lot => (
            <div key={lot.lotId} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              {lot.imageUrl && (
                <div style={{ margin: '-24px -24px 16px -24px', height: 160, overflow: 'hidden', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)' }}>
                  <img src={lot.imageUrl} alt={lot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {/* Header */}
              <div className="row-between mb-16">
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>{lot.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
                    📍 {lot.address}, {lot.city}
                  </p>
                </div>
                <span className={`badge ${lot.approved ? 'badge-success' : 'badge-warning'}`}>
                  {lot.approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                <span>🅿 {lot.availableSpots}/{lot.totalSpots} spots</span>
                <span>🕐 {lot.openTime} – {lot.closeTime}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                 {lot.vehicleTypes?.includes('TWO_WHEELER') && <span className="badge badge-outline">🏍️ Two Wheeler</span>}
                 {lot.vehicleTypes?.includes('FOUR_WHEELER') && <span className="badge badge-outline">🚗 Four Wheeler</span>}
                 {lot.vehicleTypes?.includes('HEAVY') && <span className="badge badge-outline">🚛 Heavy Vehicle</span>}
                 {lot.isEv && <span className="badge badge-success">⚡ EV</span>}
                 {lot.isHandicapped && <span className="badge badge-info">♿ Accessible</span>}
              </div>

              {/* Status toggle */}
              <div className="row-between mb-16" style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Status:&nbsp;
                  <span style={{ color: lot.open ? 'var(--success)' : 'var(--danger)' }}>
                    {lot.open ? '● Open' : '● Closed'}
                  </span>
                </span>
                <button
                  className={`btn btn-sm ${lot.open ? 'btn-outline' : 'btn-primary'}`}
                  style={lot.open ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}}
                  onClick={() => toggle(lot.lotId)}
                  disabled={!lot.approved}
                  title={!lot.approved ? 'Awaiting admin approval' : ''}
                >
                  {lot.open ? 'Close Lot' : 'Open Lot'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(lot)}>Edit</button>
                <button className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/manager/lots/${lot.lotId}/spots`)}>Spots</button>
                <button className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/manager/lots/${lot.lotId}/bookings`)}>Bookings</button>
                <button className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/manager/lots/${lot.lotId}/analytics`)}>Analytics</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Parking Lot' : 'Register Parking Lot'}
      >
        <form onSubmit={(e) => { e.preventDefault(); save(); }}>
          {error && <Alert type="danger">{error}</Alert>}
          <div className="form-group">
            <label className="form-label">Lot Name</label>
            <input className="form-control" name="name" placeholder="MG Road Parking"
              value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-control" name="address" placeholder="123 MG Road"
              value={form.address} onChange={handle} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-control" name="city" placeholder="Mumbai"
                value={form.city} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Total Spots</label>
              <input className="form-control" name="totalSpots" type="number" min="1"
                placeholder="50" value={form.totalSpots} onChange={handle} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-control" name="latitude" type="number" step="any"
                placeholder="19.0760" value={form.latitude} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-control" name="longitude" type="number" step="any"
                placeholder="72.8777" value={form.longitude} onChange={handle} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Open Time</label>
              <input className="form-control" name="openTime" type="time"
                value={form.openTime} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Close Time</label>
              <input className="form-control" name="closeTime" type="time"
                value={form.closeTime} onChange={handle} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Image URL (optional)</label>
            <input className="form-control" name="imageUrl" placeholder="https://..."
              value={form.imageUrl} onChange={handle} />
          </div>
          
          {/* Attributes */}
          <div style={{ marginBottom: 16 }}>
             <label className="form-label">Supported Vehicle Types</label>
             <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                <div className="checkbox-row" onClick={() => handleVehicleType('TWO_WHEELER')}>
                   <div className={`checkbox-box ${form.vehicleTypes.includes('TWO_WHEELER') ? 'checked' : ''}`}>
                     {form.vehicleTypes.includes('TWO_WHEELER') && '✓'}
                   </div>
                   Two Wheeler
                </div>
                <div className="checkbox-row" onClick={() => handleVehicleType('FOUR_WHEELER')}>
                   <div className={`checkbox-box ${form.vehicleTypes.includes('FOUR_WHEELER') ? 'checked' : ''}`}>
                     {form.vehicleTypes.includes('FOUR_WHEELER') && '✓'}
                   </div>
                   Four Wheeler
                </div>
                <div className="checkbox-row" onClick={() => handleVehicleType('HEAVY')}>
                   <div className={`checkbox-box ${form.vehicleTypes.includes('HEAVY') ? 'checked' : ''}`}>
                     {form.vehicleTypes.includes('HEAVY') && '✓'}
                   </div>
                   Heavy Vehicle
                </div>
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: 24, marginBottom: 24, marginTop: 16 }}>
             <div className="checkbox-row" onClick={() => setForm({...form, isEv: !form.isEv})}>
                <div className={`checkbox-box ${form.isEv ? 'checked' : ''}`}>
                  {form.isEv && '✓'}
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--warning)' }}>⚡</span> EV Charging Available
                </span>
             </div>
             <div className="checkbox-row" onClick={() => setForm({...form, isHandicapped: !form.isHandicapped})}>
                <div className={`checkbox-box ${form.isHandicapped ? 'checked' : ''}`}>
                  {form.isHandicapped && '✓'}
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--info)' }}>♿</span> Handicapped Accessible
                </span>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: 24 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {editing ? 'Save Changes' : 'Register Lot'}
            </button>
          </div>
        </form>
      </Modal>
    </ManagerLayout>
  );
}
