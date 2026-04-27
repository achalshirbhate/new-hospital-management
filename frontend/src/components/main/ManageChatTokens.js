import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function ManageChatTokens() {
  const [tokens, setTokens] = useState([]);

  const load = () => api.get('/chat-token').then(r => setTokens(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handle = async (id, action) => {
    await api.put(`/chat-token/${id}/${action}`);
    load();
  };

  const statusColor = { PENDING: 'bg-yellow-100 text-yellow-700', ACTIVE: 'bg-green-100 text-green-700', EXPIRED: 'bg-gray-100 text-gray-600', REJECTED: 'bg-red-100 text-red-700' };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Chat Token Requests</h2>
      <p className="text-sm text-gray-500 mb-4">Approved tokens are valid for 30 minutes and auto-expire.</p>
      <div className="space-y-4">
        {tokens.map(t => (
          <div key={t._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span>{t.type === 'VIDEO' ? '📹' : '💬'}</span>
                  <p className="font-semibold text-gray-800">Patient: {t.patientId?.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.type || 'CHAT'}</span>
                </div>
                <p className="text-sm text-gray-500">Doctor: {t.doctorId?.name}</p>
                {t.status === 'ACTIVE' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Expires: {new Date(t.endTime).toLocaleTimeString()}
                  </p>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${statusColor[t.status]}`}>
                  {t.status}
                </span>
              </div>
              {t.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => handle(t._id, 'approve')} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">Approve</button>
                  <button onClick={() => handle(t._id, 'reject')} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {tokens.length === 0 && <p className="text-gray-400 text-sm">No chat token requests.</p>}
      </div>
    </div>
  );
}
