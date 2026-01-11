const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  regNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  roomDetails: {
    roomNo: { type: Number, required: true },
    block: { type: String, required: true }
  },
  phone: { type: String, required: true },
  photo: { type: String }, // URL to the image storage
  isApproved: { type: Boolean, default: false }, // Replaces the two-table system
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Link to login credentials
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);