const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  registrationNumber: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  year: { type: Number },
  enrollmentDate: { type: Date, default: Date.now },
  franchisee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: [{ type: String }],
  certificate: { type: String },
  marklist: { type: String },
  exams: [{
    examName: { type: String },
    registered: { type: Boolean, default: false },
    marks: { type: Number },
    grade: { type: String },
    publishedDate: { type: Date }
  }]
});

module.exports = mongoose.model('Student', studentSchema);