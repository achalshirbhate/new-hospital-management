const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  age: { type: Number },
  medicalHistory: { type: String, default: '' },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // doctor who added
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  prescriptions: [{
    title: String,
    description: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
