const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Patient = require('../models/Patient');

// GET /api/patients
router.get('/', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('userId', 'name email')
      .populate('assignedDoctor', 'name email');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/me - patient views own profile
router.get('/me', protect, authorize('PATIENT'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id })
      .populate('userId', 'name email')
      .populate('assignedDoctor', 'name email');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/:id
router.get('/:id', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('assignedDoctor', 'name email');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/patients - DOCTOR or MAIN_DOCTOR adds patient
router.post('/', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    const { name, email, password, age, medicalHistory } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, role: 'PATIENT' });
    const patient = await Patient.create({
      userId: user._id,
      age,
      medicalHistory,
      assignedDoctor: req.user.role === 'DOCTOR' ? req.user._id : undefined
    });
    res.status(201).json({ user, patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
