const axios = require('axios');
require('dotenv').config();

// Reddit API credentials
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = 'creator-dashboard/1.0.0';

// Get OAuth token for Reddit API
const getRedditToken = async () => {
  try {
    console.log('Attempting to get Reddit OAuth token...');
    
    // Check if credentials are available
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
      throw new Error('Reddit API credentials are missing. Check your .env file.');
    }
    
    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        auth: {
          username: REDDIT_CLIENT_ID,
          password: REDDIT_CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': REDDIT_USER_AGENT,
        },
      }
    );
    
    console.log('Successfully retrieved Reddit OAuth token');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Reddit OAuth token:', error.message);
    if (error.response) {
      console.error('Reddit API response error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
};

const getRedditPosts = async (query = 'javascript', limit = 10) => {
  try {
    // Get OAuth token
    const token = await getRedditToken();
    
    // Determine the endpoint based on the query
    let url;
    
    // If query looks like a subreddit name (no spaces), search within that subreddit
    if (/^[a-zA-Z0-9_]+$/.test(query)) {
      url = `https://oauth.reddit.com/r/${query}/hot?limit=${limit}`;
    } else {
      // Otherwise, use the search endpoint
      url = `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&limit=${limit}&sort=hot`;
    }
    
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT 
      }
    });
    
    if (!res.data || !res.data.data || !res.data.data.children) {
      throw new Error('Invalid data format received from Reddit API');
    }
    
    const posts = res.data.data.children.map(child => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        ups: post.ups,
        downs: post.downs,
        num_comments: post.num_comments,
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        selftext: post.selftext ? (post.selftext.length > 200 ? post.selftext.substring(0, 200) + '...' : post.selftext) : '',
        thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
        source: 'reddit',
        created_at: new Date(post.created_utc * 1000)
      };
    });
    
    return posts;
  } catch (error) {
    console.error('Error fetching Reddit posts:', error.message);
    // Only use mock data in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using mock Reddit data for development');
      return getMockRedditPosts(query, limit);
    }
    return [];
  }
};

/**
 * Get comments for a specific Reddit post
 * @param {string} postId - Reddit post ID
 * @param {string} subreddit - Subreddit name where the post is located
 * @param {number} limit - Maximum number of comments to retrieve (default: 25)
 * @returns {Promise<Array>} Array of comment objects
 */
const getRedditComments = async (postId, subreddit, limit = 25) => {
  try {
    // Get OAuth token
    const token = await getRedditToken();
    
    // Reddit API endpoint for post comments
    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}?limit=${limit}&sort=top`;
    
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT
      }
    });
    
    // Reddit comments API returns an array with 2 elements:
    // [0] is the original post, [1] is the comment tree
    if (!res.data || !Array.isArray(res.data) || res.data.length < 2 || !res.data[1].data || !res.data[1].data.children) {
      throw new Error('Invalid comment data format received from Reddit API');
    }
    
    // Parse and flatten comments
    const comments = parseRedditComments(res.data[1].data.children);
    
    return comments;
  } catch (error) {
    console.error('Error fetching Reddit comments:', error.message);
    // Only use mock data in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using mock Reddit comment data for development');
      return getMockRedditComments(postId, limit);
    }
    return [];
  }
};

/**
 * Parse and flatten Reddit comment tree
 * @param {Array} commentTree - Reddit comment tree
 * @param {number} depth - Current depth level of comments (for nested comments)
 * @returns {Array} Flattened array of comments
 */
const parseRedditComments = (commentTree, depth = 0) => {
  let comments = [];
  
  for (const item of commentTree) {
    // Skip non-comment items (e.g. "more" items)
    if (item.kind !== 't1') continue;
    
    const comment = item.data;
    
    // Format the comment data
    const parsedComment = {
      id: comment.id,
      author: comment.author,
      body: comment.body,
      ups: comment.ups,
      downs: comment.downs,
      depth: depth,
      created_at: new Date(comment.created_utc * 1000)
    };
    
    comments.push(parsedComment);
    
    // Process replies if they exist
    if (comment.replies && comment.replies.data && comment.replies.data.children) {
      const childComments = parseRedditComments(comment.replies.data.children, depth + 1);
      comments = [...comments, ...childComments];
    }
  }
  
  return comments;
};

// Generate mock Reddit comments - only for development
const getMockRedditComments = (postId, limit = 25) => {
  const now = new Date();
  const comments = [];
  
  // Generate top-level comments
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const commentId = `c-${postId}-${i}`;
    comments.push({
      id: commentId,
      author: 'redditUser' + (Math.floor(Math.random() * 1000) + 1),
      body: `This is a mock top-level comment #${i + 1} with some sample text for development purposes.`,
      ups: Math.floor(Math.random() * 500),
      downs: Math.floor(Math.random() * 20),
      depth: 0,
      created_at: new Date(now.getTime() - i * 30000)
    });
    
    // Add some replies for certain comments
    if (i < 5) {
      const replyCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < replyCount; j++) {
        comments.push({
          id: `c-${postId}-${i}-${j}`,
          author: 'redditUser' + (Math.floor(Math.random() * 1000) + 1),
          body: `This is a reply #${j + 1} to comment #${i + 1}.`,
          ups: Math.floor(Math.random() * 200),
          downs: Math.floor(Math.random() * 10),
          depth: 1,
          created_at: new Date(now.getTime() - i * 30000 - j * 5000)
        });
        
        // Add nested replies for some replies
        if (j === 0 && i < 3) {
          comments.push({
            id: `c-${postId}-${i}-${j}-nested`,
            author: 'redditUser' + (Math.floor(Math.random() * 1000) + 1),
            body: `This is a nested reply to comment #${i + 1}, reply #${j + 1}.`,
            ups: Math.floor(Math.random() * 100),
            downs: Math.floor(Math.random() * 5),
            depth: 2,
            created_at: new Date(now.getTime() - i * 30000 - j * 5000 - 2000)
          });
        }
      }
    }
  }
  
  return comments;
};

// Generate mock Reddit data - only for development
const getMockRedditPosts = (query = 'javascript', limit = 10) => {
  const now = new Date();
  const posts = [];
  const subreddits = ['programming', 'javascript', 'webdev', 'reactjs', 'coding'];
  
  for (let i = 0; i < limit; i++) {
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
    posts.push({
      id: `reddit-${query}-${Date.now()}-${i}`,
      title: `${subreddit}: ${query} - This is sample post #${i + 1} with interesting discussion and comments.`,
      author: 'redditUser' + (Math.floor(Math.random() * 1000) + 1),
      subreddit: subreddit,
      ups: Math.floor(Math.random() * 2000),
      downs: Math.floor(Math.random() * 100),
      num_comments: Math.floor(Math.random() * 500),
      url: `https://reddit.com/r/${subreddit}/${i}`,
      permalink: `/r/${subreddit}/comments/${i}/sample_post_${i}`,
      selftext: `This is a mock post about ${query} with some sample content for development purposes.`,
      thumbnail: `https://via.placeholder.com/150x150.png?text=${subreddit}`,
      source: 'reddit',
      created_at: new Date(now.getTime() - i * 90000) // Stagger times
    });
  }
  return posts;
};

module.exports = { getRedditPosts, getRedditComments };