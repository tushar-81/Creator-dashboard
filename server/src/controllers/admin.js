const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const Report = require('../models/Report');

// @desc    List all users (admin only) with pagination and search
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipAmount = (pageNumber - 1) * limitNumber;
    
    let query = {};
    
    // Add search functionality
    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Get paginated results
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(limitNumber);
    
    console.log(`Found ${users.length} users for page ${page}, with total of ${total} users.`);
    
    res.json({
      users,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber)
    });
    
  } catch (err) {
    console.error('Error in getAllUsers:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update a user's credit balance (admin only)
exports.updateUserCredits = async (req, res) => {
  const { id } = req.params;
  const { credits: newBalance, reason } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const diff = newBalance - user.credits;
    user.credits = newBalance;
    await user.save();

    // Create a credit transaction record with the reason
    await CreditTransaction.create({
      userId: user._id,
      type: 'admin',
      amount: diff,
      reason: reason || 'Administrative adjustment'
    });

    console.log(`Updated credits for user ${user.email}: ${user.credits} (${diff > 0 ? '+' : ''}${diff}) - Reason: ${reason}`);

    res.json({ userId: user._id, credits: user.credits });
  } catch (err) {
    console.error('Error in updateUserCredits:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all reported posts (admin only)
exports.getReportedPosts = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'email name')
      .sort({ date: -1 });
    
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete a report (admin only)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    
    await report.deleteOne();
    res.json({ msg: 'Report removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get user analytics data (admin only)
exports.getUserAnalytics = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get users who logged in within the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });
    
    // Get average credits per user
    const creditStats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgCredits: { $avg: "$credits" },
          totalCredits: { $sum: "$credits" }
        }
      }
    ]);
    
    // Get profile completion rate
    const completedProfiles = await User.countDocuments({ profileCompleted: true });
    const profileCompletionRate = totalUsers > 0 ? Math.round((completedProfiles / totalUsers) * 100) : 0;
    
    // Get new user registrations for the past 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const newUsersQuery = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twoWeeksAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const newUsers = newUsersQuery.map(item => ({
      date: item._id,
      count: item.count
    }));
    
    // Get most active users based on login frequency
    const mostActiveUsersData = await User.find()
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('email name lastLogin -_id');
    
    // Get user activity counts from credit transactions
    const userActivityCounts = await CreditTransaction.aggregate([
      {
        $group: {
          _id: "$userId",
          activityCount: { $sum: 1 },
          lastActive: { $max: "$date" }
        }
      },
      {
        $sort: { activityCount: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Combine with user data
    const userIds = userActivityCounts.map(item => item._id);
    const userDetails = await User.find({ _id: { $in: userIds } })
      .select('email name');
    
    const userMap = {};
    userDetails.forEach(user => {
      userMap[user._id] = user;
    });
    
    const activeUsersWithDetails = userActivityCounts.map(item => {
      const user = userMap[item._id];
      return {
        email: user?.email || 'Unknown',
        name: user?.name || null,
        activityCount: item.activityCount,
        lastActive: item.lastActive
      };
    });
    
    res.json({
      userStats: {
        totalUsers,
        activeUsers,
        avgCredits: Math.round(creditStats[0]?.avgCredits || 0),
        profileCompletionRate
      },
      newUsers,
      activeUsers: activeUsersWithDetails
    });
    
  } catch (err) {
    console.error('Error in getUserAnalytics:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get feed activity analytics (admin only)
exports.getFeedAnalytics = async (req, res) => {
  try {
    const SavedPost = require('../models/SavedPost');
    
    // Get saved posts count
    const savedPostsCount = await SavedPost.countDocuments();
    
    // Get reported posts count
    const reportedPostsCount = await Report.countDocuments();
    
    // Placeholder for API-sourced content
    // In a real implementation, you would track these in your database
    const totalPosts = 1000; // Example value
    const sharedPosts = 150;  // Example value
    
    // Get posts by source
    const savedPostsBySource = await SavedPost.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate engagement rates
    const sources = ['twitter', 'reddit', 'linkedin'];
    const sourceCounts = {
      twitter: 400, // Example values - in production would be from DB
      reddit: 350,
      linkedin: 250
    };
    
    const engagementRate = sources.map(source => {
      const saved = savedPostsBySource.find(item => item._id === source)?.count || 0;
      const total = sourceCounts[source] || 0;
      return {
        source,
        rate: total > 0 ? saved / total : 0
      };
    });
    
    // Sample popular content
    // In production, this would be fetched from your database with proper aggregation
    const popularContent = [
      {
        source: 'twitter',
        title: 'Exciting new developments in AI',
        author: 'TechGuru',
        date: new Date(),
        saves: 42,
        shares: 18
      },
      {
        source: 'reddit',
        title: 'Discussion: Future of remote work',
        author: 'WorkLifeBalance',
        date: new Date(),
        saves: 35,
        shares: 12
      },
      {
        source: 'linkedin',
        title: '5 tips for productivity in 2025',
        author: 'Career Expert',
        date: new Date(),
        saves: 28,
        shares: 9
      },
      {
        source: 'twitter',
        title: 'Breaking tech news: New product launch',
        author: 'TechNews',
        date: new Date(),
        saves: 23,
        shares: 15
      },
      {
        source: 'reddit',
        title: 'Ask Me Anything: Senior Developer Edition',
        author: 'CodeMaster',
        date: new Date(),
        saves: 19,
        shares: 7
      }
    ];
    
    res.json({
      postStats: {
        totalPosts,
        savedPosts: savedPostsCount,
        sharedPosts,
        reportedPosts: reportedPostsCount
      },
      engagementRate,
      popularContent
    });
    
  } catch (err) {
    console.error('Error in getFeedAnalytics:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get detailed info for a specific user (admin only)
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get the user's credit transactions
    const transactions = await CreditTransaction.find({ userId: id })
      .sort({ date: -1 })
      .limit(20);
    
    // Get the user's saved posts
    const SavedPost = require('../models/SavedPost');
    const savedPosts = await SavedPost.find({ userId: id })
      .sort({ date: -1 })
      .limit(20);
    
    console.log(`Admin fetched detailed info for user: ${user.email}`);
    
    res.json({
      user,
      transactions,
      savedPosts
    });
    
  } catch (err) {
    console.error('Error in getUserDetail:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Test Reddit API connection
exports.testRedditConnection = async (req, res) => {
  try {
    // Import the Reddit service
    const { getRedditPosts } = require('../services/reddit');
    
    // Attempt to fetch a small number of posts as a test
    const testQuery = 'test';
    const limit = 2;
    console.log(`Testing Reddit API connection with query: ${testQuery}, limit: ${limit}`);
    
    const posts = await getRedditPosts(testQuery, limit);
    
    res.json({
      success: true,
      message: 'Reddit API connection successful',
      postsCount: posts.length,
      environment: process.env.NODE_ENV,
      clientIdExists: !!process.env.REDDIT_CLIENT_ID,
      clientSecretExists: !!process.env.REDDIT_CLIENT_SECRET,
      // Only send first post as sample if available
      samplePost: posts.length > 0 ? posts[0] : null
    });
  } catch (err) {
    console.error('Test Reddit connection error:', err);
    res.status(500).json({
      success: false, 
      message: 'Reddit API connection failed',
      error: err.message,
      environment: process.env.NODE_ENV
    });
  }
};