import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../Modal';
import { useAuth } from '../../context/AuthContext';

export default function DoctorReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientId: '', toDoctor: '', reason: '' });
  const [msg, setMsg] = useState('');

  const load = () => api.get('/referrals').then(r => setReferrals(r.data)).catch(() => {});

  useEffect(() => {
    load();
    api.get('/patients').then(r => setPatients(r.data)).catch(() => {});
    // Fetch doctors and exclude self
    api.get('/doctors').then(r => {
      setDoctors(r.data.filter(d => d.userId?._id !== user?.id));
    }).catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/referrals', form);
      setMsg('Referral submitted — awaiting Main Doctor approval');
      setShowModal(false);
      setForm({ patientId: '', toDoctor: '', reason: '' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const statusColor = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Referrals</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          + Request Referral
        </button>
      </div>

      {msg && <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-sm text-yellow-700 flex items-center gap-2">
        ⚠️ All referrals must be approved by the Main Doctor before taking effect.
      </div>

      <div className="space-y-4">
        {referrals.map(r => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm p-5">
            <p className="font-semibold text-gray-800">Patient: {r.patientId?.name}</p>
            <p className="text-sm text-gray-500">Referring to: Dr. {r.toDoctor?.name}</p>
            {r.reason && <p className="text-sm text-gray-600 mt-1">Reason: {r.reason}</p>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${statusColor[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
        {referrals.length === 0 && <p className="text-gray-400 text-sm">No referrals yet.</p>}
      </div>

      {showModal && (
        <Modal title="Request Referral" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <select
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.patientId}
                onChange={e => setForm({ ...form, patientId: e.target.value })}
              >
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p.userId?._id}>{p.userId?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refer To Doctor</label>
              <select
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.toDoctor}
                onChange={e => setForm({ ...form, toDoctor: e.target.value })}
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map(d => (
                  <option key={d._id} value={d.userId?._id}>
                    Dr. {d.userId?.name} — {d.specialization}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No other doctors available.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the reason for referral..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Submit Referral
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
