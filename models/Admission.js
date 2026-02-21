const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  qualification: { type: String, required: true },
  institution: { type: String, required: true },
  yearOfPassing: { type: Number, required: true },
  percentage: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studyMode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  startDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admission', admissionSchema);