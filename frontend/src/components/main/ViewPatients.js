import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function ViewPatients() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/patients').then(r => setPatients(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">All Patients</h2>
      <div className="grid gap-4">
        {patients.map(p => (
          <div key={p._id} className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition" onClick={() => setSelected(selected?._id === p._id ? null : p)}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">{p.userId?.name}</p>
                <p className="text-sm text-gray-500">{p.userId?.email}</p>
                <p className="text-xs text-gray-400 mt-1">Age: {p.age} | Doctor: {p.assignedDoctor?.name || 'Unassigned'}</p>
              </div>
              <span className="text-gray-400 text-sm">{selected?._id === p._id ? '▲' : '▼'}</span>
            </div>
            {selected?._id === p._id && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700">Medical History:</p>
                <p className="text-sm text-gray-600 mt-1">{p.medicalHistory || 'No history recorded.'}</p>
              </div>
            )}
          </div>
        ))}
        {patients.length === 0 && <p className="text-gray-400 text-sm">No patients found.</p>}
      </div>
    </div>
  );
}
