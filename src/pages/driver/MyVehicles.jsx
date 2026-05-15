import React, { useEffect, useState } from 'react';
import DriverLayout from '../../components/driver/DriverLayout';
import { Spinner, Modal, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

const EMPTY_FORM = { licensePlate: '', make: '', model: '', color: '', vehicleType: 'FOUR_WHEELER', isEV: false };

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const load = () => {
    api.get('/api/vehicles/my')
      .then(setVehicles)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (v) => {
    setEditing(v.vehicleId);
    // Backend serializes Java boolean 'isEV' as 'EV' (Jackson strips 'is' prefix)
    const evValue = !!(v.EV ?? v.isEV ?? v.isEv ?? false);
    setForm({
      licensePlate: v.licensePlate,
      make: v.make,
      model: v.model,
      color: v.color || '',
      vehicleType: v.vehicleType,
      isEV: evValue,
    });
    setShowModal(true);
  };

  const save = async () => {
    setError('');
    try {
      // To ensure correct backend serialization mapping for boolean attributes, provide all potential property name variants.
      const payload = {
        licensePlate: form.licensePlate,
        make: form.make,
        model: form.model,
        color: form.color,
        vehicleType: form.vehicleType,
        isEV: form.isEV, 
        ev: form.isEV,
        EV: form.isEV,
      };
      if (editing) {
        await api.put(`/api/vehicles/${editing}`, payload);
      } else {
        await api.post('/api/vehicles', payload);
      }
      setSuccess(editing ? 'Vehicle updated.' : 'Vehicle registered.');
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      setSuccess('Vehicle deleted.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handle = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  return (
    <DriverLayout title="My Vehicles"
      subtitle="Register and manage your vehicles for quick booking 🚗"
      topbarRight={
        <button className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px', borderRadius: '999px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          onClick={openAdd}>
          + Add Vehicle
        </button>
      }
    >

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : vehicles.length === 0 ? (
        <EmptyState icon="🚗" title="No vehicles registered"
          message="Add your vehicle to speed up the booking process."
          action={<button className="btn btn-primary" onClick={openAdd}>Add Vehicle</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {vehicles.map(v => {
            const isTwo   = v.vehicleType === 'TWO_WHEELER';
            const isHeavy = v.vehicleType === 'HEAVY';
            const isElectric = !!(v.isEV || v.EV || v.isEv);  // Normalize backend boolean property variations
            const icon = isTwo ? '🏍️' : isHeavy ? '🚛' : '🚗';
            const typeConfig = isTwo
              ? { label: 'Two Wheeler',   bg: '#f0fdf4', color: '#16a34a' }
              : isHeavy
              ? { label: 'Heavy Vehicle', bg: '#fff7ed', color: '#ea580c' }
              : { label: 'Four Wheeler',  bg: '#eff6ff', color: '#3b82f6' };
            return (
              <div key={v.vehicleId} className="card" style={{ padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* Top: icon + action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>{icon}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: '999px', padding: '4px 14px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', color: 'var(--text-soft)', letterSpacing: '0.04em' }}
                      onClick={() => openEdit(v)}
                    >EDIT</button>
                    <button
                      style={{ background: 'rgba(198,40,40,0.08)', border: 'none', borderRadius: '999px', padding: '4px 14px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', color: 'var(--danger)', letterSpacing: '0.04em' }}
                      onClick={() => remove(v.vehicleId)}
                    >DEL</button>
                  </div>
                </div>

                {/* License plate */}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.03em', color: 'var(--text)', marginBottom: 4 }}>
                  {v.licensePlate}
                </div>

                {/* Make & Model */}
                <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 16 }}>
                  {v.make} {v.model}{v.color ? ` · ${v.color}` : ''}
                </div>

                {/* Type badge + EV badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: typeConfig.bg, color: typeConfig.color, padding: '5px 12px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    <span style={{ width: 5, height: 5, background: 'currentColor', borderRadius: '50%' }}></span>
                    {typeConfig.label}
                  </div>
                  {isElectric && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ecfdf5', color: '#059669', padding: '5px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      ⚡ EV
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Vehicle' : 'Register Vehicle'}
      >
        <form onSubmit={(e) => { e.preventDefault(); save(); }}>
          {error && <Alert type="danger">{error}</Alert>}
          <div className="form-group">
            <label className="form-label">License Plate</label>
            <input className="form-control" name="licensePlate" placeholder="MH01AB1234"
              value={form.licensePlate} onChange={handle} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Make</label>
              <input className="form-control" name="make" placeholder="Toyota"
                value={form.make} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="form-control" name="model" placeholder="Camry"
                value={form.model} onChange={handle} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-control" name="color" placeholder="White"
                value={form.color} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select className="form-control" name="vehicleType"
                value={form.vehicleType} onChange={handle}>
                <option value="TWO_WHEELER">Two Wheeler</option>
                <option value="FOUR_WHEELER">Four Wheeler</option>
                <option value="HEAVY">Heavy Vehicle</option>
              </select>
            </div>
          </div>
          {/* EV Toggle */}
          <div style={{ marginBottom: 16 }}>
            <div
              onClick={() => setForm(f => ({ ...f, isEV: !f.isEV }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                padding: '12px 16px',
                borderRadius: 12,
                background: form.isEV ? 'rgba(5,150,105,0.08)' : 'rgba(0,0,0,0.04)',
                border: `1.5px solid ${form.isEV ? '#059669' : 'transparent'}`,
                transition: 'all 0.2s',
                userSelect: 'none',
              }}
            >
              {/* Custom toggle */}
              <div style={{
                width: 40, height: 22, borderRadius: 999,
                background: form.isEV ? '#059669' : '#ccc',
                position: 'relative', flexShrink: 0,
                transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: form.isEV ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: form.isEV ? '#059669' : 'var(--text)' }}>
                  ⚡ Electric Vehicle (EV)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                  {form.isEV ? 'This vehicle is electric' : 'Tap to mark as electric'}
                </div>
              </div>
            </div>
          </div>
          <div className="row gap-12" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save Changes' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </DriverLayout>
  );
}
