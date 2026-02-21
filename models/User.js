const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['admin', 'franchisee', 'student'], default: 'franchisee' }
});

module.exports = mongoose.model('User', userSchema);