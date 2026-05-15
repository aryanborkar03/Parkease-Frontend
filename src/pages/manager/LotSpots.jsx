import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Spinner, Modal, Alert, EmptyState } from '../../components/common/UI';
import { api } from '../../utils/api';

const EMPTY_SPOT = { lotId: '', spotNumber: '', floor: 0, vehicleType: 'FOUR_WHEELER', spotType: 'STANDARD', pricePerHour: 50 };
const EMPTY_BULK = { lotId: '', count: 10, prefix: 'A', floor: 0, vehicleType: 'FOUR_WHEELER', spotType: 'STANDARD', pricePerHour: 50 };

// Helper to convert enum values to friendly labels
const getFriendlyVehicleLabel = (type) => {
  if (!type) return '';
  const upper = type.toUpperCase();
  if (upper === 'TWO_WHEELER') return '2-WHEELER';
  if (upper === 'FOUR_WHEELER') return '4-WHEELER';
  if (upper === 'HEAVY') return 'HEAVY VEHICLE';
  return type;
};

export default function LotSpots() {
  const { lotId }  = useParams();
  const navigate   = useNavigate();
  const [spots, setSpots]       = useState([]);
  const [lot, setLot]          = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm]         = useState({ ...EMPTY_SPOT, lotId });
  const [bulk, setBulk]         = useState({ ...EMPTY_BULK, lotId });
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [singleSpotError, setSingleSpotError] = useState('');
  const [bulkSpotError, setBulkSpotError] = useState('');

  // Get allowed vehicle types based on lot's supported types
  const allowedVehicleTypes = lot?.vehicleTypes || [];

  const load = () => {
    Promise.all([
      api.get(`/api/bookings/slots/${lotId}/drive-in`),
      api.get(`/api/lots/${lotId}`)
    ])
      .then(([spotsData, lotData]) => {
        setSpots(spotsData);
        setLot(lotData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lotId]);

  const handle = e => {
    const v = e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: v }));
  };
  const handleBulk = e => {
    const v = e.target.value;
    setBulk(prev => ({ ...prev, [e.target.name]: v }));
  };

  const addSpot = async () => {
    setError('');
    setSingleSpotError('');
    try {
      await api.post('/api/spots', { ...form, lotId: Number(lotId), floor: Number(form.floor), pricePerHour: Number(form.pricePerHour) });
      setSuccess('Spot added.'); setShowAdd(false); load();
    } catch (err) {
      // Only show validation errors (400 with "Cannot create spot:") inside the modal
      if (err.status === 400 && err.message.includes('Cannot create spot:')) {
        setSingleSpotError(err.message);
      } else {
        setError(err.message);
        setSingleSpotError(err.message);
      }
    }
  };

  const addBulk = async () => {
    setError('');
    setBulkSpotError('');
    try {
      const res = await api.post('/api/spots/bulk', { ...bulk, lotId: Number(lotId), count: Number(bulk.count), floor: Number(bulk.floor), pricePerHour: Number(bulk.pricePerHour) });
      setSuccess(`${res.length} spots created.`); setShowBulk(false); load();
    } catch (err) {
      // Only show validation errors (400 with "Cannot create spot:") inside the modal
      if (err.status === 400 && err.message.includes('Cannot create spot:')) {
        setBulkSpotError(err.message);
      } else {
        setError(err.message);
        setBulkSpotError(err.message);
      }
    }
  };

  const deleteSpot = async (spotId) => {
    if (!window.confirm('Delete this spot?')) return;
    try { await api.delete(`/api/spots/${spotId}`); load(); } catch (err) { setError(err.message); }
  };

  // Group by floor
  const floors = {};
  spots.forEach(s => {
    const f = `Floor ${s.floor}`;
    if (!floors[f]) floors[f] = [];
    floors[f].push(s);
  });

  // Vehicle type options - always show all choices (backend enforces validation)
  const vehicleTypeOptions = [
    { value: 'TWO_WHEELER', label: 'Two Wheeler' },
    { value: 'FOUR_WHEELER', label: 'Four Wheeler' },
    { value: 'HEAVY', label: 'Heavy Vehicle' }
  ];

  const SpotForm = ({ data, onChange }) => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Spot Number</label>
          <input className="form-control" name="spotNumber" placeholder="A-01" value={data.spotNumber} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Floor</label>
          <input className="form-control" name="floor" type="number" min="0" value={data.floor} onChange={onChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Vehicle Type</label>
          <select className="form-control" name="vehicleType" value={data.vehicleType} onChange={onChange}>
            {vehicleTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {allowedVehicleTypes.length > 0 && (
            <small style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
              Lot supports: {allowedVehicleTypes.map(getFriendlyVehicleLabel).join(', ')}
            </small>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Spot Type</label>
          <select className="form-control" name="spotType" value={data.spotType} onChange={onChange}>
            <option value="STANDARD">Standard</option>
            <option value="EV">EV</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Price Per Hour (₹)</label>
        <input className="form-control" name="pricePerHour" type="number" min="1" value={data.pricePerHour} onChange={onChange} />
      </div>
    </>
  );

  return (
    <ManagerLayout
      title={`Parking Spots — Lot #${lotId}`}
      subtitle={`${spots.length} total spots · ${spots.filter(s => s.status === 'FREE').length} available 🅿️`}
      topbarRight={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <button className="btn btn-outline btn-sm" onClick={() => {
            setBulk({ ...EMPTY_BULK, lotId });
            setShowBulk(true);
          }}>+ Bulk Add</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            setForm({ ...EMPTY_SPOT, lotId });
            setShowAdd(true);
          }}>+ Add Spot</button>
        </div>
      }
    >

      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner /> : spots.length === 0 ? (
        <EmptyState icon="🅿" title="No spots yet"
          message="Add individual spots or use bulk create to add many at once."
          action={<button className="btn btn-primary" onClick={() => {
            setBulk({ ...EMPTY_BULK, lotId });
            setShowBulk(true);
          }}>Bulk Create Spots</button>}
        />
      ) : (
        Object.entries(floors).map(([floor, floorSpots]) => (
          <div key={floor} className="card" style={{ marginBottom: 24 }}>
            <div className="row-between mb-16">
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>{floor}</h4>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 700 }}>
                {floorSpots.filter(s => s.status === 'FREE').length} / {floorSpots.length} available
              </span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Spot #</th><th>Vehicle</th>
                    <th>Price/hr</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {floorSpots.map(s => (
                    <tr key={s.spotId}>
                      <td><strong>{s.spotNumber}</strong></td>
                      <td>{s.vehicleType.replace('_', ' ')}</td>
                      <td>₹{s.pricePerHour}</td>
                      <td>
                        <span className={`badge ${s.status === 'FREE' ? 'badge-success' : 'badge-info'}`}>
                          {s.status === 'FREE' ? 'Available' : s.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => deleteSpot(s.spotId)}
                          disabled={s.status !== 'FREE'}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setSingleSpotError(''); }} title="Add Single Spot"
        footer={<div className="row gap-12" style={{ justifyContent: 'flex-end', width: '100%' }}><button className="btn btn-outline" onClick={() => { setShowAdd(false); setSingleSpotError(''); }}>Cancel</button><button className="btn btn-primary" onClick={addSpot}>Add Spot</button></div>}>
        {singleSpotError && (
          <div className="alert alert-danger mb-3" style={{ fontSize: '0.85rem' }}>
            {singleSpotError}
          </div>
        )}
        <SpotForm data={form} onChange={handle} />
      </Modal>

      {/* Bulk Modal */}
      <Modal isOpen={showBulk} onClose={() => { setShowBulk(false); setBulkSpotError(''); }} title="Bulk Create Spots"
        footer={<div className="row gap-12" style={{ justifyContent: 'flex-end', width: '100%' }}><button className="btn btn-outline" onClick={() => { setShowBulk(false); setBulkSpotError(''); }}>Cancel</button><button className="btn btn-primary" onClick={addBulk}>Create Spots</button></div>}>
        {bulkSpotError && (
          <div className="alert alert-danger mb-3" style={{ fontSize: '0.85rem' }}>
            {bulkSpotError}
          </div>
        )}
        <div className="alert alert-info mb-3">
          Spots will be named: <strong>{bulk.prefix}{bulk.floor}-01, {bulk.prefix}{bulk.floor}-02 ...</strong>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prefix (e.g. A, B, GF)</label>
            <input className="form-control" name="prefix" value={bulk.prefix} onChange={handleBulk} />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Spots</label>
            <input className="form-control" name="count" type="number" min="1" max="200" value={bulk.count} onChange={handleBulk} />
          </div>
        </div>
        <SpotForm data={bulk} onChange={handleBulk} />
      </Modal>
    </ManagerLayout>
  );
}
