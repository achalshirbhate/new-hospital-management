import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../Modal';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', medicalHistory: '' });
  const [msg, setMsg] = useState('');

  const load = () => api.get('/patients').then(r => setPatients(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients', form);
      setMsg('Patient added');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', age: '', medicalHistory: '' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Patients</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">+ Add Patient</button>
      </div>
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}
      <div className="grid gap-4">
        {patients.map(p => (
          <div key={p._id} className="bg-white rounded-xl shadow-sm p-5">
            <p className="font-semibold text-gray-800">{p.userId?.name}</p>
            <p className="text-sm text-gray-500">{p.userId?.email} · Age: {p.age}</p>
            <p className="text-sm text-gray-600 mt-2">{p.medicalHistory || 'No history'}</p>
          </div>
        ))}
        {patients.length === 0 && <p className="text-gray-400 text-sm">No patients yet.</p>}
      </div>

      {showModal && (
        <Modal title="Add Patient" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            {[
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'password', label: 'Password', type: 'password' },
              { key: 'age', label: 'Age', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type={f.type} required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
              <textarea rows={3} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.medicalHistory} onChange={e => setForm({ ...form, medicalHistory: e.target.value })} />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add Patient</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
