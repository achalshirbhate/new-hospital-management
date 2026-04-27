import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function DoctorReports() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get('/reports').then(r => setReports(r.data)).catch(() => {});
  useEffect(() => {
    load();
    api.get('/patients').then(r => setPatients(r.data)).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !patientId) return setMsg('Select patient and file');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('patientId', patientId);
    try {
      await api.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Report uploaded');
      setFile(null);
      setPatientId('');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Reports</h2>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
            <select className="w-full border rounded-lg px-3 py-2" value={patientId} onChange={e => setPatientId(e.target.value)}>
              <option value="">-- Select Patient --</option>
              {patients.map(p => <option key={p._id} value={p.userId?._id}>{p.userId?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF/Image)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} className="w-full text-sm" />
          </div>
          {msg && <p className="text-sm text-blue-600">{msg}</p>}
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">Upload</button>
        </form>
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-3">Uploaded Reports</h3>
      <div className="space-y-3">
        {reports.map(r => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800">{r.fileName}</p>
              <p className="text-sm text-gray-500">Patient: {r.patientId?.name}</p>
            </div>
            <a href={`http://localhost:5000${r.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">Download</a>
          </div>
        ))}
      </div>
    </div>
  );
}
