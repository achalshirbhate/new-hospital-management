import React from 'react';
import Layout from '../components/Layout';
import Overview from '../components/main/Overview';
import ManageDoctors from '../components/main/ManageDoctors';
import ManageReferrals from '../components/main/ManageReferrals';
import ManageChatTokens from '../components/main/ManageChatTokens';
import FinanceManager from '../components/main/FinanceManager';
import LaunchPadView from '../components/main/LaunchPadView';
import ViewPatients from '../components/main/ViewPatients';
import ViewReports from '../components/main/ViewReports';
import SocialFeedManager from '../components/main/SocialFeedManager';

const navItems = [
  { key: 'overview',    label: 'Overview',        icon: '📊', component: <Overview /> },
  { key: 'doctors',     label: 'Manage Doctors',   icon: '👨‍⚕️', component: <ManageDoctors /> },
  { key: 'patients',    label: 'View Patients',    icon: '👥', component: <ViewPatients /> },
  { key: 'referrals',   label: 'Referrals',        icon: '🔄', component: <ManageReferrals /> },
  { key: 'chat-tokens', label: 'Chat Tokens',      icon: '💬', component: <ManageChatTokens /> },
  { key: 'finance',     label: 'Finance',          icon: '💰', component: <FinanceManager /> },
  { key: 'reports',     label: 'Reports',          icon: '📄', component: <ViewReports /> },
  { key: 'social',      label: 'Social Feed',      icon: '📢', component: <SocialFeedManager /> },
  { key: 'launchpad',   label: 'LaunchPad',        icon: '🚀', component: <LaunchPadView /> },
];

export default function MainDoctorDashboard() {
  return <Layout navItems={navItems} title="Main Doctor" />;
}
