const mongoose = require('mongoose');

const monthlyStockSchema = new mongoose.Schema({
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    items: [{
        itemName: { type: String, required: true },
        seller: { type: String, required: true },
        quantityBought: { type: Number, required: true },
        unit: { type: String, default: 'kg' },
        photo: { type: String }, // URL
        pricePerKg: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        quantityRemaining: { type: Number }, // To be filled on last day
        comments: { type: String } // To be filled on last day
    }]
}, { timestamps: true });

module.exports = mongoose.model('MonthlyStock', monthlyStockSchema);
