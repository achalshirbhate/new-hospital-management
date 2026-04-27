import React, { useState } from 'react';
import api from '../../api/axios';

export default function DoctorLaunchPad() {
  const [form, setForm] = useState({ title: '', description: '', domain: '', contact: '' });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/launchpad', form);
      setMsg('Idea submitted successfully! The Main Doctor will review it.');
      setForm({ title: '', description: '', domain: '', contact: '' });
    } catch {
      setMsg('Submission failed. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">LaunchPad</h2>
      <p className="text-gray-500 text-sm mb-6">Submit your ideas or suggestions to the Main Doctor.</p>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {msg && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idea Title</label>
            <input
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Telemedicine Integration"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your idea in detail..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Technology"
                value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your email or phone"
                value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
            🚀 Submit Idea
          </button>
        </form>
      </div>
    </div>
  );
}
