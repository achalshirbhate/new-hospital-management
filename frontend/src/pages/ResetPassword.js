import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState('otp'); // 'otp' or 'link'
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If user clicked the email link, pre-fill token + email
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (token && email) {
      setMode('link');
      setForm(f => ({ ...f, email: decodeURIComponent(email), token }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword)
      return setError('Passwords do not match');
    if (form.newPassword.length < 6)
      return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      const payload = {
        email: form.email,
        newPassword: form.newPassword,
        ...(mode === 'otp' ? { otp: form.otp } : { token: form.token })
      };
      await api.post('/auth/reset-password', payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Password Reset!</h2>
          <p className="text-gray-500 text-sm">Your password has been updated. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the OTP from your email</p>
        </div>

        {/* Mode toggle */}
        {mode !== 'link' && (
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('otp')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'otp' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              Use OTP Code
            </button>
            <button
              onClick={() => setMode('link')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'link' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              Use Reset Link
            </button>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              readOnly={mode === 'link'}
            />
          </div>

          {mode === 'otp' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP</label>
              <input
                type="text" required maxLength={6}
                placeholder="Enter OTP from email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-bold tracking-widest"
                value={form.otp}
                onChange={e => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password" required minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password" required
              placeholder="Repeat new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="flex justify-between mt-4 text-sm">
          <Link to="/forgot-password" className="text-gray-500 hover:text-blue-600">Resend email</Link>
          <Link to="/login" className="text-gray-500 hover:text-blue-600">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
