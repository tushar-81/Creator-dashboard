/**
 * Script to create admin users from the command line
 * Usage: node src/scripts/create-admin.js --email admin@example.com --password securepassword
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('email', {
    alias: 'e',
    description: 'Admin email address',
    type: 'string',
    demandOption: true
  })
  .option('password', {
    alias: 'p',
    description: 'Admin password',
    type: 'string',
    demandOption: true
  })
  .option('name', {
    alias: 'n',
    description: 'Admin name',
    type: 'string',
    default: 'Admin User'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/creator-dashboard');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Validate email format
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Validate password strength
const validatePassword = (password) => {
  return password.length >= 8; // Basic validation, enhance as needed
};

// Create admin user
const createAdmin = async () => {
  try {
    // Validate inputs
    if (!validateEmail(argv.email)) {
      console.error('Error: Invalid email format');
      process.exit(1);
    }

    if (!validatePassword(argv.password)) {
      console.error('Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: argv.email });
    if (existingUser) {
      console.log(`User with email ${argv.email} already exists.`);
      
      // If user exists but is not an admin, update role
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`Updated user ${argv.email} to admin role.`);
      } else {
        console.log('This user is already an admin.');
      }
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(argv.password, salt);

    // Create new admin user
    const newAdmin = new User({
      email: argv.email,
      password: hashedPassword,
      name: argv.name,
      role: 'admin',
      profileCompleted: true
    });

    await newAdmin.save();
    console.log(`Admin user created successfully: ${argv.email}`);

  } catch (error) {
    console.error(`Error creating admin user: ${error.message}`);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
connectDB().then(() => {
  createAdmin();
});