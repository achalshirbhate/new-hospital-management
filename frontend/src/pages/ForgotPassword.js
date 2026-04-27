import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <p className="text-green-700 font-semibold text-sm">Reset email sent!</p>
              <p className="text-green-600 text-sm mt-1">
                Check your inbox at <strong>{email}</strong>. The link and OTP are valid for <strong>15 minutes</strong>.
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-4">Didn't receive it? Check your spam folder.</p>
            <Link to="/reset-password" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-center transition text-sm">
              Enter OTP / Reset Password
            </Link>
            <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-blue-600 mt-3">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email" required
                  placeholder="Enter your registered email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-blue-600 mt-4">
              ← Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
