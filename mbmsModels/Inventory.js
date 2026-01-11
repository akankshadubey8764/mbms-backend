const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true, unique: true },
  category: { type: String }, // e.g., Veggies, Grains
  stock: {
    current: { type: Number, default: 0 },
    threshold: { type: Number, default: 10 }
  },
  purchaseHistory: [{
    sellerName: String,
    quantity: Number,
    rate: Number,
    totalPrice: Number,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);