const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ChatToken = require('../models/ChatToken');
const { v4: uuidv4 } = require('uuid');

// GET /api/chat-token - list tokens
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'PATIENT') query.patientId = req.user._id;
    if (req.user.role === 'DOCTOR') query.doctorId = req.user._id;

    const tokens = await ChatToken.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat-token/request - PATIENT requests chat or video token
router.post('/request', protect, authorize('PATIENT'), async (req, res) => {
  try {
    const { doctorId, type = 'CHAT' } = req.body;
    const token = await ChatToken.create({
      patientId: req.user._id,
      doctorId,
      token: uuidv4(),
      type,
      status: 'PENDING'
    });
    res.status(201).json(token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/chat-token/:id/approve - MAIN_DOCTOR approves, sets 30-min window
router.put('/:id/approve', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    const token = await ChatToken.findByIdAndUpdate(
      req.params.id,
      { status: 'ACTIVE', startTime, endTime, approvedBy: req.user._id },
      { new: true }
    );
    res.json(token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/chat-token/:id/reject - MAIN_DOCTOR rejects
router.put('/:id/reject', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    const token = await ChatToken.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED' },
      { new: true }
    );
    res.json(token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat-token/validate/:token - validate active token
router.get('/validate/:token', protect, async (req, res) => {
  try {
    const chatToken = await ChatToken.findOne({ token: req.params.token, status: 'ACTIVE' });
    if (!chatToken) return res.status(403).json({ message: 'Token invalid or expired' });
    res.json({ valid: true, chatToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
