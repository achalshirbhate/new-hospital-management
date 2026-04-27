import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatCard from '../StatCard';

export default function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="text-gray-500">Loading dashboard...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon="💰" label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="green" />
        <StatCard icon="💸" label="Total Expenses" value={`$${stats.totalExpense.toLocaleString()}`} color="red" />
        <StatCard icon="📈" label="Profit / Loss" value={`$${stats.profit.toLocaleString()}`} color={stats.profit >= 0 ? 'green' : 'red'} />
        <StatCard icon="👥" label="Total Patients" value={stats.totalPatients} color="blue" />
        <StatCard icon="👨‍⚕️" label="Total Doctors" value={stats.totalDoctors} color="indigo" />
        <StatCard icon="📅" label="Appointments" value={stats.totalAppointments} color="purple" />
        <StatCard icon="🔄" label="Pending Referrals" value={stats.pendingReferrals} color="yellow" />
        <StatCard icon="💬" label="Pending Chat Requests" value={stats.pendingTokens} color="yellow" />
      </div>
    </div>
  );
}
