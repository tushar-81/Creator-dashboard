const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const SavedPost = require('../models/SavedPost');

// @desc    Get current user's profile
exports.getProfile = async (req, res) => {
  res.json(req.user);
};

// @desc    Update profile and award credits on first completion
exports.updateProfile = async (req, res) => {
  const { name, bio, avatarUrl } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.avatarUrl = avatarUrl || user.avatarUrl;

    if (!user.profileCompleted && (name || bio || avatarUrl)) {
      user.credits += 20;
      user.profileCompleted = true;
      await CreditTransaction.create({
        userId: user._id,
        type: 'profile',
        amount: 20
      });
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get user's credit balance and history
exports.getCredits = async (req, res) => {
  try {
    const transactions = await CreditTransaction.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ credits: req.user.credits, transactions });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get user's saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const savedPosts = await SavedPost.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(savedPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};