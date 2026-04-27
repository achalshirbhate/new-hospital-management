import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusColors = { PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red' };
const badge = (s) => {
  const c = { yellow: 'bg-yellow-100 text-yellow-700', green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-700' };
  return `text-xs px-2 py-0.5 rounded-full font-medium ${c[statusColors[s]]}`;
};

export default function ManageReferrals() {
  const [referrals, setReferrals] = useState([]);

  const load = () => api.get('/referrals').then(r => setReferrals(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handle = async (id, action) => {
    await api.put(`/referrals/${id}/${action}`);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Referral Requests</h2>
      <div className="space-y-4">
        {referrals.map(r => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">Patient: {r.patientId?.name}</p>
                <p className="text-sm text-gray-500">From: {r.fromDoctor?.name} → To: {r.toDoctor?.name}</p>
                {r.reason && <p className="text-sm text-gray-600 mt-1">Reason: {r.reason}</p>}
                <span className={badge(r.status)}>{r.status}</span>
              </div>
              {r.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => handle(r._id, 'approve')} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">Approve</button>
                  <button onClick={() => handle(r._id, 'reject')} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {referrals.length === 0 && <p className="text-gray-400 text-sm">No referrals found.</p>}
      </div>
    </div>
  );
}
