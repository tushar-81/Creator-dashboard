/**
 * Database seeding script to create initial admin user
 * Run with: node src/scripts/seed-admin.js
 * 
 * This script checks if an admin user exists and creates one if none is found
 * using credentials from environment variables.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Get credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/creator-dashboard');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to database: ${error.message}`);
    process.exit(1);
  }
};

// Seed admin user
const seedAdminUser = async () => {
  try {
    // Validate environment variables
    if (!ADMIN_PASSWORD) {
      console.error('Error: ADMIN_PASSWORD environment variable is required');
      process.exit(1);
    }

    // Check if any admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('An admin user already exists. Skipping admin creation.');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create default admin user
    const adminUser = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: 'admin',
      profileCompleted: true
    });

    await adminUser.save();
    console.log(`Default admin user created: ${ADMIN_EMAIL}`);

  } catch (error) {
    console.error(`Error seeding admin user: ${error.message}`);
  }
};

// Main execution
(async () => {
  const connection = await connectDB();
  await seedAdminUser();
  await mongoose.disconnect();
  console.log('Database seeding completed');
  process.exit(0);
})();