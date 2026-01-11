const mongoose = require('mongoose');

// Menu Schema
const menuSchema = new mongoose.Schema({
  day: { type: String, required: true }, // Monday, Tuesday...
  mealTime: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'] },
  items: [String] // Array of food items
});

// Query/Complaint Schema
const querySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  area: { type: String, required: true }, // query_area
  text: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' }
}, { timestamps: true });

module.exports = {
  Menu: mongoose.model('Menu', menuSchema),
  Query: mongoose.model('Query', querySchema)
};