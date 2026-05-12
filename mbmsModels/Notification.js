const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['BILL_PUBLISHED', 'QUERY_UPDATE', 'GENERAL'], default: 'GENERAL' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
