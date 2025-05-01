const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { 
  getAllUsers, 
  updateUserCredits, 
  getReportedPosts, 
  deleteReport,
  getUserAnalytics,
  getFeedAnalytics,
  getUserDetail
} = require('../controllers/admin');

const router = express.Router();

// Admin-only endpoints
router.use(auth, authorize('admin'));
// GET /api/admin/users
router.get('/users', getAllUsers);
// GET /api/admin/users/:id - Get detailed user information
router.get('/users/:id', getUserDetail);
// PATCH /api/admin/users/:id/credits
router.patch('/users/:id/credits', updateUserCredits);
// GET /api/admin/reports
router.get('/reports', getReportedPosts);
// DELETE /api/admin/reports/:id
router.delete('/reports/:id', deleteReport);
// GET /api/admin/analytics/users - New route for user analytics
router.get('/analytics/users', getUserAnalytics);
// GET /api/admin/analytics/feed - New route for feed activity analytics
router.get('/analytics/feed', getFeedAnalytics);

module.exports = router;