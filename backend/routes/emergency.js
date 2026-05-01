const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Emergency = require('../models/Emergency');

// POST /api/emergency - any logged in user triggers emergency
router.post('/', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const emergency = await Emergency.create({
      requestedBy: req.user._id,
      role: req.user.role === 'MAIN_DOCTOR' ? 'DOCTOR' : req.user.role,
      message: message || 'Emergency assistance needed!',
      status: 'ACTIVE',
    });
    const populated = await Emergency.findById(emergency._id).populate('requestedBy', 'name email role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/emergency - MAIN_DOCTOR sees all, DOCTOR sees patient emergencies only
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'DOCTOR') {
      // Doctor sees only patient emergencies
      query.role = 'PATIENT';
    }
    const emergencies = await Emergency.find(query)
      .populate('requestedBy', 'name email role')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(emergencies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/emergency/:id/resolve - MAIN_DOCTOR or DOCTOR resolves
router.put('/:id/resolve', protect, async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: 'RESOLVED', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    ).populate('requestedBy', 'name email role');
    res.json(emergency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
