const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, specialization, age } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, role });

    if (role === 'DOCTOR') {
      await Doctor.create({ userId: user._id, specialization: specialization || 'General' });
    } else if (role === 'PATIENT') {
      await Patient.create({ userId: user._id, age: age || 0 });
    }

    res.status(201).json({ token: signToken(user._id), user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot-password — sends reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    // Generate a 6-digit OTP + a secure token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail(user.email, user.name, otp, resetUrl);

    // Store OTP hashed too (reuse resetToken field for simplicity, store otp separately)
    user.resetToken = crypto.createHash('sha256').update(otp).digest('hex') + '|' + hashedToken;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Failed to send email. Check server email config.' });
  }
});

// POST /api/auth/reset-password — reset with token or OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { token, otp, email, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    let user;

    if (token) {
      // Link-based reset
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      user = await User.findOne({
        email,
        resetTokenExpiry: { $gt: new Date() }
      });
      if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });

      const [, storedHash] = user.resetToken.split('|');
      if (storedHash !== hashedToken)
        return res.status(400).json({ message: 'Reset link is invalid or expired' });

    } else if (otp) {
      // OTP-based reset
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      user = await User.findOne({
        email,
        resetTokenExpiry: { $gt: new Date() }
      });
      if (!user) return res.status(400).json({ message: 'OTP is invalid or expired' });

      const [storedOtpHash] = user.resetToken.split('|');
      if (storedOtpHash !== hashedOtp)
        return res.status(400).json({ message: 'Invalid OTP' });
    } else {
      return res.status(400).json({ message: 'Provide token or OTP' });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
