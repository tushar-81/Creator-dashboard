const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  getFeed, 
  savePost, 
  sharePost, 
  reportPost, 
  deleteSavedPost, 
  getPostComments,
  checkSavedPost
} = require('../controllers/feed');

const router = express.Router();

// Protected feed endpoints
router.use(auth);
router.get('/', getFeed);
router.get('/:source/:postId/comments', getPostComments);
router.get('/:source/:postId/saved', checkSavedPost);
router.post('/:source/:postId/save', savePost);
router.post('/:source/:postId/share', sharePost);
router.post('/:source/:postId/report', reportPost);
router.delete('/saved/:postId', deleteSavedPost);

module.exports = router;