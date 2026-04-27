import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function PatientHistory() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/patients/me').then(r => setProfile(r.data)).catch(() => {});
  }, []);

  if (!profile) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Health Profile</h2>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">👤</div>
          <div>
            <p className="text-xl font-semibold text-gray-800">{profile.userId?.name}</p>
            <p className="text-gray-500">{profile.userId?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500">Age</p>
            <p className="font-semibold text-gray-800">{profile.age || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assigned Doctor</p>
            <p className="font-semibold text-gray-800">{profile.assignedDoctor?.name || 'Not assigned'}</p>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Medical History</p>
          <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm">{profile.medicalHistory || 'No medical history recorded.'}</p>
        </div>
      </div>
    </div>
  );
}
