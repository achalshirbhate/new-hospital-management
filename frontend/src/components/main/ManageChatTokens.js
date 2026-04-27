import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function ManageChatTokens() {
  const [tokens, setTokens] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [assignMap, setAssignMap] = useState({});

  const load = () => api.get('/chat-token').then(r => setTokens(r.data)).catch(() => {});
  useEffect(() => {
    load();
    api.get('/doctors').then(r => setDoctors(r.data)).catch(() => {});
  }, []);

  const handleApprove = async (id) => {
    const doctorId = assignMap[id];
    if (!doctorId) return alert('Please assign a doctor before approving.');
    await api.put(`/chat-token/${id}/approve`, { doctorId });
    load();
  };

  const handleReject = async (id) => {
    await api.put(`/chat-token/${id}/reject`);
    load();
  };

  const statusColor = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
    REJECTED: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Chat / Video Requests</h2>
      <p className="text-sm text-gray-500 mb-6">Assign a doctor to each request, then approve. Sessions are valid for 30 minutes.</p>
      <div className="space-y-4">
        {tokens.map(t => (
          <div key={t._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span>{t.type === 'VIDEO' ? '📹' : '💬'}</span>
                  <p className="font-semibold text-gray-800">Patient: {t.patientId?.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.type}</span>
                </div>
                <p className="text-sm text-gray-500">
                  Doctor: {t.doctorId?.name ? `Dr. ${t.doctorId.name}` : <span className="text-yellow-600">Not assigned yet</span>}
                </p>
                {t.status === 'ACTIVE' && (
                  <p className="text-xs text-gray-400 mt-1">Expires: {new Date(t.endTime).toLocaleTimeString()}</p>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${statusColor[t.status]}`}>
                  {t.status}
                </span>
              </div>

              {t.status === 'PENDING' && (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <select
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={assignMap[t._id] || ''}
                    onChange={e => setAssignMap({ ...assignMap, [t._id]: e.target.value })}
                  >
                    <option value="">-- Assign Doctor --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d.userId?._id}>
                        Dr. {d.userId?.name} — {d.specialization}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(t._id)}
                      className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(t._id)}
                      className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {tokens.length === 0 && <p className="text-gray-400 text-sm">No chat/video requests yet.</p>}
      </div>
    </div>
  );
}
