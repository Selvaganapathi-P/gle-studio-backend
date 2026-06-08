// Run ONCE to create the first admin account
// Command: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email    = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name     = process.env.ADMIN_NAME || 'GLE Admin';

    if (!email || !password) {
      console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first');
      process.exit(1);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${email}`);
      console.log('   Delete the user from MongoDB and run again to reset.');
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hashed, role: 'admin' });

    console.log('');
    console.log('🎉 Admin created successfully!');
    console.log('──────────────────────────────────');
    console.log(`   Name     : ${name}`);
    console.log(`   Email    : ${email}`);
    console.log(`   Password : ${password}`);
    console.log(`   Role     : admin`);
    console.log('──────────────────────────────────');
    console.log('   Login at http://localhost:3000/login');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();