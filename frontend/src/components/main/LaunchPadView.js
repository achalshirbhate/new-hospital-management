import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function LaunchPadView() {
  const [ideas, setIdeas] = useState([]);
  const [filter, setFilter] = useState('ALL');

  const load = () => api.get('/launchpad').then(r => setIdeas(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this idea?')) return;
    await api.delete(`/launchpad/${id}`);
    load();
  };

  const roleColor = {
    DOCTOR: 'bg-blue-100 text-blue-700',
    PATIENT: 'bg-green-100 text-green-700',
    MAIN_DOCTOR: 'bg-purple-100 text-purple-700'
  };

  const filtered = filter === 'ALL' ? ideas : ideas.filter(i => i.submittedBy?.role === filter);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">LaunchPad Ideas</h2>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['ALL', 'DOCTOR', 'PATIENT'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:border-blue-300'}`}
          >
            {f === 'ALL' ? `All (${ideas.length})` : f === 'DOCTOR' ? `Doctors (${ideas.filter(i => i.submittedBy?.role === 'DOCTOR').length})` : `Patients (${ideas.filter(i => i.submittedBy?.role === 'PATIENT').length})`}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map(idea => (
          <div key={idea._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{idea.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[idea.submittedBy?.role] || 'bg-gray-100 text-gray-600'}`}>
                    {idea.submittedBy?.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{idea.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  {idea.domain && <span>🌐 {idea.domain}</span>}
                  {idea.contact && <span>📧 {idea.contact}</span>}
                  <span>👤 {idea.submittedBy?.name}</span>
                  <span>📅 {new Date(idea.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(idea._id)}
                className="text-red-400 hover:text-red-600 text-sm ml-4"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 text-sm">No ideas found.</p>}
      </div>
    </div>
  );
}
