const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true, // Convert to lowercase when saving
    index: true // Ensure it's indexed for faster queries
  },
  password: { type: String, required: true },
  name: { type: String },
  bio: { type: String },
  avatarUrl: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  credits: { type: Number, default: 0 },
  lastLogin: { type: Date },
  profileCompleted: { type: Boolean, default: false }
});

// Pre-save hook to ensure emails are consistently stored
UserSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
