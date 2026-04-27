const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Revenue = require('./models/Revenue');
const Expense = require('./models/Expense');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await Promise.all([User.deleteMany(), Doctor.deleteMany(), Patient.deleteMany(), Revenue.deleteMany(), Expense.deleteMany()]);

  // Main Doctor
  const mainDoc = await User.create({ name: 'Dr. Admin', email: 'admin@hospital.com', password: 'password123', role: 'MAIN_DOCTOR' });

  // Doctors
  const doc1User = await User.create({ name: 'Dr. Sarah Johnson', email: 'sarah@hospital.com', password: 'password123', role: 'DOCTOR' });
  const doc2User = await User.create({ name: 'Dr. Mike Chen', email: 'mike@hospital.com', password: 'password123', role: 'DOCTOR' });
  await Doctor.create({ userId: doc1User._id, specialization: 'Cardiology' });
  await Doctor.create({ userId: doc2User._id, specialization: 'Neurology' });

  // Patients
  const pat1User = await User.create({ name: 'John Smith', email: 'john@patient.com', password: 'password123', role: 'PATIENT' });
  const pat2User = await User.create({ name: 'Emily Davis', email: 'emily@patient.com', password: 'password123', role: 'PATIENT' });
  await Patient.create({ userId: pat1User._id, age: 45, medicalHistory: 'Hypertension, Type 2 Diabetes', assignedDoctor: doc1User._id });
  await Patient.create({ userId: pat2User._id, age: 32, medicalHistory: 'Migraine, Anxiety', assignedDoctor: doc2User._id });

  // Revenue & Expenses
  await Revenue.insertMany([
    { amount: 15000, source: 'Consultation Fees', date: new Date() },
    { amount: 8500, source: 'Lab Tests', date: new Date() },
    { amount: 12000, source: 'Surgery', date: new Date() },
  ]);
  await Expense.insertMany([
    { amount: 5000, description: 'Medical Supplies', date: new Date() },
    { amount: 3000, description: 'Staff Salaries', date: new Date() },
    { amount: 1500, description: 'Utilities', date: new Date() },
  ]);

  console.log('\n✅ Seed data created:');
  console.log('  Main Doctor: admin@hospital.com / password123');
  console.log('  Doctor 1:    sarah@hospital.com / password123');
  console.log('  Doctor 2:    mike@hospital.com  / password123');
  console.log('  Patient 1:   john@patient.com   / password123');
  console.log('  Patient 2:   emily@patient.com  / password123');

  await mongoose.disconnect();
}

seed().catch(console.error);
