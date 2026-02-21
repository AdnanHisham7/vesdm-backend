const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  registrationNumber: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  password: { type: String },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    sparse: true,
  },
  enrollmentDate: { type: Date, default: Date.now },
  enrolledCourses: [
    {
      course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      enrollmentDate: { type: Date, default: Date.now },
      progress: { type: Number, default: 0 },
      status: { type: String, default: "ongoing" }, // ongoing, completed
      completedDate: { type: Date },
      certificate: {
        file: String,
        issueDate: Date,
        number: String,
      },
    },
  ],
  year: { type: Number },
  franchisee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  documents: [{ type: String }],
  exams: [
    {
      examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
      marks: { type: Number },
      grade: { type: String },
      publishedDate: { type: Date },
      course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    },
  ],
});

module.exports = mongoose.model("Student", studentSchema);