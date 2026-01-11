const mongoose = require('mongoose');

// Menu Schema
const menuSchema = new mongoose.Schema({
  week: { type: String, required: true }, // e.g., "2024-W12" or "March-Week1"
  menuItems: [{
    day: { type: String, required: true }, // Monday, Tuesday...
    mealTime: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'], required: true },
    items: [String] // Array of food items
  }],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Query/Complaint Schema
const querySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  queryArea: { type: String, required: true },
  queryText: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  response: { type: String }
}, { timestamps: true });

module.exports = {
  Menu: mongoose.model('Menu', menuSchema),
  Query: mongoose.model('Query', querySchema)
};