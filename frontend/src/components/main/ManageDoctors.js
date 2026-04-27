import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../Modal';

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '' });
  const [msg, setMsg] = useState('');

  const load = () => api.get('/doctors').then(r => setDoctors(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctors', form);
      setMsg('Doctor added successfully');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', specialization: '' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this doctor?')) return;
    await api.delete(`/doctors/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Doctors</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          + Add Doctor
        </button>
      </div>
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}
      <div className="grid gap-4">
        {doctors.map(d => (
          <div key={d._id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{d.userId?.name}</p>
              <p className="text-sm text-gray-500">{d.userId?.email}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">{d.specialization}</span>
            </div>
            <button onClick={() => handleDelete(d._id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        ))}
        {doctors.length === 0 && <p className="text-gray-400 text-sm">No doctors found.</p>}
      </div>

      {showModal && (
        <Modal title="Add New Doctor" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            {['name', 'email', 'password', 'specialization'].map(f => (
              <div key={f}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{f}</label>
                <input
                  type={f === 'password' ? 'password' : 'text'} required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form[f]}
                  onChange={e => setForm({ ...form, [f]: e.target.value })}
                />
              </div>
            ))}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add Doctor</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
