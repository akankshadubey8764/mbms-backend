const mongoose = require('mongoose');

const messBillSchema = new mongoose.Schema({
  month: { type: Number, required: true }, // 1–12
  year: { type: Number, required: true }, // YYYY
  daysPresent: { type: Number, default: 0 },
  daysAbsent: { type: Number, default: 0 },
  amountIssued: { type: Number, default: 0 }, // total calculated bill
  amountPaid: { type: Number, default: 0 }, // paid amount
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PARTIAL', 'UNPAID'],
    default: 'UNPAID'
  },
  receiptUrl: { type: String },
  isVerified: { type: Boolean, default: false },
  calculatedAt: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  regNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  roomNo: { type: Number, required: true },
  block: { type: String, required: true },
  phone: { type: String, required: true },
  photo: { type: String },
  status: {
    type: String,
    enum: ['APPROVED', 'PENDING', 'REJECTED'],
    default: 'PENDING'
  },
  is_Approved: { type: Boolean, default: false }, // For easier query matching with API list
  is_rejected: { type: Boolean, default: false }, // For easier query matching with API list
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messBills: [messBillSchema]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);