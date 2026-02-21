const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['training', 'forms', 'guides'], default: 'guides' },
  type: { type: String, required: true }, // PDF, DOCX, XLSX, VIDEO, etc.
  fileUrl: { type: String, required: true },
  size: { type: String },
  uploadDate: { type: Date, default: Date.now },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }
});

module.exports = mongoose.model('Resource', resourceSchema);