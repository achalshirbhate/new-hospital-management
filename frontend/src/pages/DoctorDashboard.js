import React from 'react';
import Layout from '../components/Layout';
import DoctorPatients from '../components/doctor/DoctorPatients';
import DoctorReports from '../components/doctor/DoctorReports';
import DoctorReferrals from '../components/doctor/DoctorReferrals';
import DoctorLaunchPad from '../components/doctor/DoctorLaunchPad';
import SocialFeed from '../components/shared/SocialFeed';

const navItems = [
  { key: 'patients',  label: 'My Patients',    icon: '👥', component: <DoctorPatients /> },
  { key: 'reports',   label: 'Upload Reports', icon: '📄', component: <DoctorReports /> },
  { key: 'referrals', label: 'Referrals',      icon: '🔄', component: <DoctorReferrals /> },
  { key: 'launchpad', label: 'LaunchPad',      icon: '🚀', component: <DoctorLaunchPad /> },
  { key: 'social',    label: 'Social Feed',    icon: '📢', component: <SocialFeed /> },
];

export default function DoctorDashboard() {
  return <Layout navItems={navItems} title="Doctor Panel" />;
}
