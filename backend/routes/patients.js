const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Patient = require('../models/Patient');

// GET /api/patients - MAIN_DOCTOR sees all, DOCTOR sees only their patients (approved)
router.get('/', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'DOCTOR') {
      query.assignedDoctor = req.user._id;
      query.approvalStatus = 'APPROVED';
    }
    const patients = await Patient.find(query)
      .populate('userId', 'name email')
      .populate('assignedDoctor', 'name email')
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/pending - MAIN_DOCTOR sees pending approvals
router.get('/pending', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const patients = await Patient.find({ approvalStatus: 'PENDING' })
      .populate('userId', 'name email')
      .populate('assignedDoctor', 'name email')
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });
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
      .populate('assignedDoctor', 'name email')
      .populate('prescriptions.addedBy', 'name');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/patients - DOCTOR adds patient (pending admin approval), MAIN_DOCTOR adds directly (approved)
router.post('/', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    const { name, email, password, age, medicalHistory } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, role: 'PATIENT' });
    const isMainDoctor = req.user.role === 'MAIN_DOCTOR';
    const patient = await Patient.create({
      userId: user._id,
      age,
      medicalHistory,
      assignedDoctor: req.user._id,
      addedBy: req.user._id,
      approvalStatus: isMainDoctor ? 'APPROVED' : 'PENDING',
    });
    const populated = await Patient.findById(patient._id)
      .populate('userId', 'name email')
      .populate('assignedDoctor', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/patients/:id/approve - MAIN_DOCTOR approves patient addition
router.put('/:id/approve', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'APPROVED' },
      { new: true }
    ).populate('userId', 'name email').populate('assignedDoctor', 'name email');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/patients/:id/reject - MAIN_DOCTOR rejects patient addition
router.put('/:id/reject', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'REJECTED' },
      { new: true }
    ).populate('userId', 'name email');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/patients/:id - update patient info
router.put('/:id', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('userId', 'name email').populate('assignedDoctor', 'name email');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/patients/:id/prescription - DOCTOR adds prescription
router.post('/:id/prescription', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $push: { prescriptions: { title, description, addedBy: req.user._id } } },
      { new: true }
    ).populate('prescriptions.addedBy', 'name');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/patients/:id/refer - MAIN_DOCTOR reassigns patient to another doctor
router.put('/:id/refer', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const { newDoctorId } = req.body;
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { assignedDoctor: newDoctorId },
      { new: true }
    ).populate('userId', 'name email').populate('assignedDoctor', 'name email');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/patients/:id - MAIN_DOCTOR removes patient
router.delete('/:id', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Not found' });
    await User.findByIdAndDelete(patient.userId);
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
