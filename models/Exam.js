const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String },
  date: { type: Date, required: true },
  deadline: { type: Date, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdByRole: {
    type: String,
    enum: ["admin", "franchisee"],
    required: true,
  },

  studentsRegistered: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  ],

  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Exam", examSchema);
