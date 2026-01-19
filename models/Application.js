const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  message: { type: String },
  documents: [{ type: String }],
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "rejected"],
  },
  appliedDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Application", applicationSchema);
