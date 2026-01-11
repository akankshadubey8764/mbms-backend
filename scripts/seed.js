require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../mbmsModels/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const defaultUsers = [
    { email: 'admin@example.com', username: 'admin', password: 'admin1', role: 'admin' },
    { email: 'mess1@hostel.com', password: 'mess123', role: 'warden1' },
    { email: 'mess2@hostel.com', password: 'mess456', role: 'warden2' }
  ];

  for (const u of defaultUsers) {
    await User.findOneAndUpdate({ email: u.email }, u, { upsert: true });
  }

  console.log('✅ Default Admin and Wardens seeded successfully!');
  process.exit();
}

seed().catch(console.error);