const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  duration: { type: String },
  fee: { type: Number },
  eligibility: { type: String }
});

module.exports = mongoose.model('Course', courseSchema);