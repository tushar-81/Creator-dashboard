const express = require('express');
const { register, login, verify } = require('../controllers/auth');
const { auth } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user and get token
router.post('/login', login);

// @route   GET /api/auth/verify
// @desc    Verify user's token and return user data
router.get('/verify', auth, verify);

module.exports = router;
