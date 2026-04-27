import React from 'react';
import Layout from '../components/Layout';
import PatientHistory from '../components/patient/PatientHistory';
import PatientReports from '../components/patient/PatientReports';
import RequestChat from '../components/patient/RequestChat';
import SubmitIdea from '../components/patient/SubmitIdea';
import SocialFeed from '../components/shared/SocialFeed';

const navItems = [
  { key: 'history',  label: 'My Profile',   icon: '👤', component: <PatientHistory /> },
  { key: 'reports',  label: 'My Reports',   icon: '📄', component: <PatientReports /> },
  { key: 'chat',     label: 'Chat / Video', icon: '💬', component: <RequestChat /> },
  { key: 'idea',     label: 'LaunchPad',    icon: '🚀', component: <SubmitIdea /> },
  { key: 'social',   label: 'Social Feed',  icon: '📢', component: <SocialFeed /> },
];

export default function PatientDashboard() {
  return <Layout navItems={navItems} title="Patient Panel" />;
}
