const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Report = require('../models/Report');

// GET /api/reports
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'PATIENT') query.patientId = req.user._id;

    const reports = await Report.find(query)
      .populate('patientId', 'name email')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reports - DOCTOR or MAIN_DOCTOR uploads
router.post('/', protect, authorize('MAIN_DOCTOR', 'DOCTOR'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { patientId } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;
    const report = await Report.create({
      patientId,
      fileUrl,
      fileName: req.file.originalname,
      uploadedBy: req.user._id
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', protect, authorize('MAIN_DOCTOR'), async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
