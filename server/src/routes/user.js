const express = require('express');
const { auth } = require('../middleware/auth');
const { getProfile, updateProfile, getCredits, getSavedPosts } = require('../controllers/user');

const router = express.Router();

// Protected user endpoints
router.use(auth);
router.get('/me', getProfile);
router.put('/me/profile', updateProfile);
router.get('/me/credits', getCredits);
router.get('/me/saved', getSavedPosts);

module.exports = router;