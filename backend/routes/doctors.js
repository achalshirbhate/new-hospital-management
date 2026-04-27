const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// GET /api/doctors - MAIN_DOCTOR and DOCTOR can list (needed for referral/chat dropdowns)
router.get('/', protect, authorize('MAIN_DOCTOR', 'DOCTOR', 'PATIENT'), async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/doctors/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/doctors - MAIN_DOCTOR adds doctor
router.post('/', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;
    const bcrypt = require('bcryptjs');
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, role: 'DOCTOR' });
    const doctor = await Doctor.create({ userId: user._id, specialization });
    res.status(201).json({ user, doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    await User.findByIdAndDelete(doctor.userId);
    res.json({ message: 'Doctor removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
