const { getRedditPosts, getRedditComments } = require('../services/reddit');
const { getLinkedinPosts } = require('../services/linkedin');
const SavedPost = require('../models/SavedPost');
const Report = require('../models/Report');
const CreditTransaction = require('../models/CreditTransaction');
const User = require('../models/User');

// @desc    Get aggregated feed from Reddit and LinkedIn
exports.getFeed = async (req, res) => {
  try {
    const { q = 'javascript', page = 1, limit = 10, source } = req.query;
    
    // Initialize empty arrays for each platform
    let redditPosts = [], linkedinPosts = [];
    
    // Fetch posts based on source filter
    if (!source || source === 'all' || source === 'reddit') {
      redditPosts = await getRedditPosts(q, limit);
    }
    
    if (!source || source === 'all' || source === 'linkedin') {
      linkedinPosts = await getLinkedinPosts(q, limit);
    }
    
    const feed = [...redditPosts, ...linkedinPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paged = feed.slice(start, start + parseInt(limit));
    
    res.json(paged);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get comments for a specific Reddit post
exports.getPostComments = async (req, res) => {
  const { source, postId } = req.params;
  const { subreddit, limit = 25 } = req.query;
  
  try {
    // Currently only implemented for Reddit
    if (source !== 'reddit') {
      return res.status(400).json({ msg: 'Comments are only available for Reddit posts' });
    }
    
    if (!subreddit) {
      return res.status(400).json({ msg: 'Subreddit parameter is required for Reddit comments' });
    }
    
    const comments = await getRedditComments(postId, subreddit, parseInt(limit));
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Save or unsave a post and adjust credits
exports.savePost = async (req, res) => {
  const { source, postId } = req.params;
  const metadata = req.body.metadata || {};
  try {
    // Check if the post is already saved by this user
    const existingSavedPost = await SavedPost.findOne({
      userId: req.user._id,
      source,
      postId
    });

    if (existingSavedPost) {
      // Post is already saved, so unsave it and reduce credits
      await existingSavedPost.deleteOne();
      req.user.credits -= 1;
      await CreditTransaction.create({ 
        userId: req.user._id, 
        type: 'interact', 
        amount: -1,
        note: 'Unsaved post'
      });
      await req.user.save();
      res.json({ msg: 'Post unsaved', credits: req.user.credits, saved: false });
    } else {
      // Post is not saved, save it and add credits
      await SavedPost.create({ userId: req.user._id, source, postId, metadata });
      req.user.credits += 1;
      await CreditTransaction.create({ 
        userId: req.user._id, 
        type: 'interact', 
        amount: 1,
        note: 'Saved post'
      });
      await req.user.save();
      res.json({ msg: 'Post saved', credits: req.user.credits, saved: true });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Share a post (simulate) and award credit
exports.sharePost = async (req, res) => {
  const { source, postId } = req.params;
  try {
    const shareLink = `${source}://post/${postId}`;
    req.user.credits += 1;
    await CreditTransaction.create({ userId: req.user._id, type: 'interact', amount: 1 });
    await req.user.save();
    res.json({ shareLink, credits: req.user.credits });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Report a post and award credit
exports.reportPost = async (req, res) => {
  const { source, postId } = req.params;
  const { reason } = req.body;
  try {
    await Report.create({ userId: req.user._id, source, postId, reason });
    req.user.credits += 1;
    await CreditTransaction.create({ userId: req.user._id, type: 'interact', amount: 1 });
    await req.user.save();
    res.json({ msg: 'Post reported', credits: req.user.credits });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete a saved post
exports.deleteSavedPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await SavedPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ msg: 'Saved post not found' });
    }
    
    // Check if the post belongs to the user
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'User not authorized to delete this post' });
    }
    
    await post.deleteOne();
    res.json({ msg: 'Post removed from saved items' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Check if a post is saved by the current user
exports.checkSavedPost = async (req, res) => {
  const { source, postId } = req.params;
  
  try {
    const savedPost = await SavedPost.findOne({
      userId: req.user._id,
      source,
      postId
    });
    
    res.json({ saved: !!savedPost });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
