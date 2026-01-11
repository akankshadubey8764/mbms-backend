const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  username: { type: String },
  role: {
    type: String,
    enum: ['admin', 'warden1', 'warden2', 'student'],
    default: 'student'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);