const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (user) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      throw new Error('Server configuration error');
    }
    
    return jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// @desc    Register a new user
exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Enhanced input validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    console.log(`Attempting to register user with email: ${email}`);
    
    let user = await User.findOne({ email });
    if (user) {
      console.log(`User already exists with email: ${email}`);
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({ email, password: hashed });
    await user.save();
    console.log(`User registered successfully: ${email}`);

    const token = generateToken(user);
    res.status(201).json({ token, user: { email: user.email, role: user.role, credits: user.credits } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @desc    Login user and issue token
exports.login = async (req, res) => {
  const { email, password, loginType } = req.body;
  try {
    // Enhanced input validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    console.log(`Attempting to login user with email: ${email}, loginType: ${loginType || 'regular'}`);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    console.log(user.role);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check if trying to login as admin but user doesn't have admin role
    if (loginType === 'admin' && user.role !== 'admin') {
      console.log(`Unauthorized admin login attempt by: ${email}`);
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    // Award daily login credit (for regular users only)
    if (user.role !== 'admin') {
      const today = new Date();
      const last = user.lastLogin || 0;
      if (!user.lastLogin || last.toDateString() !== today.toDateString()) {
        user.credits += 5;
        console.log(`Daily login credit awarded to: ${email}`);
      }
    }
    
    user.lastLogin = new Date();
    await user.save();
    console.log(`User logged in successfully: ${email}`);

    const token = generateToken(user);
    res.json({ 
      token, 
      user: { 
        _id: user._id,
        email: user.email, 
        role: user.role, 
        credits: user.credits,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        profileCompleted: user.profileCompleted
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @desc    Verify user's token
exports.verify = async (req, res) => {
  try {
    // The auth middleware will already have verified the token
    // and attached the user to the request
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ 
      user: { 
        _id: user._id,
        email: user.email, 
        role: user.role, 
        credits: user.credits,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        profileCompleted: user.profileCompleted
      } 
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
