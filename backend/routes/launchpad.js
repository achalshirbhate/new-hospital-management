const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const LaunchPad = require('../models/LaunchPad');

// GET /api/launchpad - MAIN_DOCTOR views all with submitter role info
router.get('/', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  const ideas = await LaunchPad.find()
    .populate('submittedBy', 'name email role')
    .sort({ createdAt: -1 });
  res.json(ideas);
});

// POST /api/launchpad - any authenticated user submits
router.post('/', protect, async (req, res) => {
  const idea = await LaunchPad.create({ ...req.body, submittedBy: req.user._id });
  res.status(201).json(idea);
});

// DELETE /api/launchpad/:id
router.delete('/:id', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  await LaunchPad.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
