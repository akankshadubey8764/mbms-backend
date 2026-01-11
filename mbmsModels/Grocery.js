const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema({
  itemName: { type: String, required: true, unique: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' }, // kg, liter, packets etc.
  stock: {
    remaining: { type: Number, default: 0 },
    issued: { type: Number, default: 0 }
  },
  purchaseHistory: [{
    seller: String,
    quantity: Number,
    rate: Number,
    totalPrice: Number,
    invoiceUrl: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Grocery', grocerySchema);