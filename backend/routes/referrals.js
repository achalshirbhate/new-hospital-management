const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Referral = require('../models/Referral');

// GET /api/referrals
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'DOCTOR') query.fromDoctor = req.user._id;
    if (req.user.role === 'PATIENT') query.patientId = req.user._id;

    const referrals = await Referral.find(query)
      .populate('patientId', 'name email')
      .populate('fromDoctor', 'name email')
      .populate('toDoctor', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/referrals - DOCTOR requests referral (cannot go directly to another doctor)
router.post('/', protect, authorize('DOCTOR'), async (req, res) => {
  try {
    const { patientId, toDoctor, reason } = req.body;
    // Strict rule: referral goes through MAIN_DOCTOR (status PENDING)
    const referral = await Referral.create({
      patientId,
      fromDoctor: req.user._id,
      toDoctor,
      reason,
      status: 'PENDING'
    });
    res.status(201).json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/referrals/:id/approve - MAIN_DOCTOR only
router.put('/:id/approve', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const referral = await Referral.findByIdAndUpdate(
      req.params.id,
      { status: 'APPROVED', approvedBy: req.user._id },
      { new: true }
    );
    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/referrals/:id/reject - MAIN_DOCTOR only
router.put('/:id/reject', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const referral = await Referral.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED', approvedBy: req.user._id },
      { new: true }
    );
    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
