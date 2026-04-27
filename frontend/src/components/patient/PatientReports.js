import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function PatientReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get('/reports').then(r => setReports(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Reports</h2>
      <div className="space-y-4">
        {reports.map(r => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{r.fileName || 'Medical Report'}</p>
              <p className="text-sm text-gray-500">Uploaded by: {r.uploadedBy?.name}</p>
              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
            <a
              href={`http://localhost:5000${r.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              View / Download
            </a>
          </div>
        ))}
        {reports.length === 0 && <p className="text-gray-400 text-sm">No reports available yet.</p>}
      </div>
    </div>
  );
}
