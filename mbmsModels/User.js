const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  username: { type: String },
  role: {
    type: String,
    enum: ['admin', 'mess_admin', 'student'],
    default: 'student'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);