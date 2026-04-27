import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import MainDoctorDashboard from './pages/MainDoctorDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/main-doctor/*" element={
        <ProtectedRoute roles={['MAIN_DOCTOR']}><MainDoctorDashboard /></ProtectedRoute>
      } />
      <Route path="/doctor/*" element={
        <ProtectedRoute roles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>
      } />
      <Route path="/patient/*" element={
        <ProtectedRoute roles={['PATIENT']}><PatientDashboard /></ProtectedRoute>
      } />
      <Route path="*" element={
        user ? (
          user.role === 'MAIN_DOCTOR' ? <Navigate to="/main-doctor" /> :
          user.role === 'DOCTOR' ? <Navigate to="/doctor" /> :
          <Navigate to="/patient" />
        ) : <Navigate to="/login" />
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
