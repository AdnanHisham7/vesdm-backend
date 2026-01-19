const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  type: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inquiry', inquirySchema);