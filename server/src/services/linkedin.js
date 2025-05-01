const axios = require('axios');
require('dotenv').config();

const getLinkedinPosts = async (query = 'javascript', limit = 10) => {
  // Check if LinkedIn API credentials are configured
  if (process.env.LINKEDIN_CLIENT_ID && 
      process.env.LINKEDIN_CLIENT_SECRET && 
      process.env.LINKEDIN_ACCESS_TOKEN) {
    
    try {
      // This would be the real LinkedIn API implementation
      // LinkedIn API has strict limitations and requires proper OAuth 2.0 flow
      // For a real implementation, you would:
      // 1. Use the access token to call the LinkedIn API
      // 2. Format the response to match your application's needs
      
      console.log('LinkedIn API credentials found, but using enhanced mock data');
      return getEnhancedMockLinkedInPosts(query, limit);
      
    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error.message);
      if (process.env.NODE_ENV !== 'production') {
        return getEnhancedMockLinkedInPosts(query, limit);
      }
      return [];
    }
  } else {
    // If no credentials are available, use mock data
    console.log('LinkedIn API credentials not found, using mock data');
    return getEnhancedMockLinkedInPosts(query, limit);
  }
};

// Enhanced mock LinkedIn data with more realistic properties
const getEnhancedMockLinkedInPosts = (query = 'javascript', limit = 10) => {
  const now = new Date();
  const posts = [];
  
  // LinkedIn authors with realistic profiles
  const authors = [
    { name: 'Sarah Johnson', title: 'Senior Software Engineer at TechCorp', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { name: 'Michael Chen', title: 'Tech Lead at InnovateSoft', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { name: 'Emma Williams', title: 'CTO at StartupGenius', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
    { name: 'David Rodriguez', title: 'Full Stack Developer & Instructor', avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
    { name: 'Priya Patel', title: 'Engineering Manager at GlobalTech', avatar: 'https://randomuser.me/api/portraits/women/5.jpg' }
  ];
  
  // Sample LinkedIn post titles based on common professional topics
  const samplePosts = [
    {
      title: `New opportunities for ${query} developers in remote work`,
      content: `The landscape for ${query} development has changed dramatically in the past year. Remote opportunities have increased by 150%, with companies now more willing to hire talent regardless of location. #${query} #remotework`
    },
    {
      title: `Breaking: Major tech company announces new ${query} framework`,
      content: `Just announced at TechConf 2025: A new framework for ${query} that promises to improve performance by 40%. Early access will be available next month. Who's excited to try it? #${query}framework #techinnovation`
    },
    {
      title: `How mastering ${query} helped me land my dream job`,
      content: `After six months of intensive learning and building projects with ${query}, I'm excited to announce I've accepted an offer from DreamTech Inc! The key was focusing on real-world applications rather than just theory. #careerjourney #${query}`
    },
    {
      title: `The future of ${query} in enterprise applications`,
      content: `Enterprise adoption of ${query} has grown 80% year over year. The key drivers: improved developer productivity, robust ecosystem, and strong community support. What's your organization's experience? #enterprise${query} #techtrends`
    },
    {
      title: `${query} certification paths that will boost your career in 2025`,
      content: `I've reviewed the top ${query} certifications for 2025. The most valuable ones focus on architecture patterns, performance optimization, and integration with AI systems. Worth the investment! #${query}certification #careeradvancement`
    },
    {
      title: `Why companies are investing heavily in ${query} talent`,
      content: `According to our latest industry survey, companies are allocating 30% more budget to ${query} talent acquisition. The demand far exceeds supply, creating excellent opportunities for developers. #${query}jobs #techhiring`
    },
    {
      title: `Mentoring junior ${query} developers - my experience`,
      content: `After mentoring 20+ junior ${query} developers, I've noticed a pattern: those who focus on understanding core principles rather than memorizing syntax progress much faster. What's your mentoring experience? #${query}mentoring #techeducation`
    },
    {
      title: `Latest trends in ${query} that every professional should know`,
      content: `The ${query} ecosystem is evolving rapidly. Current trends include: serverless architectures, AI integration, and improved type systems. Stay competitive by experimenting with these in your projects. #${query}trends #professionaldevelopment`
    },
    {
      title: `From beginner to expert: My journey learning ${query}`,
      content: `Three years ago I wrote my first line of ${query} code. Today, I'm leading a team of developers at a Fortune 500 company. The key milestones in my journey: consistent practice, contributing to open source, and learning from failures. #${query}journey #learninpublic`
    },
    {
      title: `Conference announcement: ${query} Summit 2025 dates confirmed`,
      content: `Save the date! ${query} Summit 2025 will be held Sept 15-17 in San Francisco. Early bird tickets available now. Our company will be sponsoring - come visit our booth! #${query}Summit #techconference`
    }
  ];
  
  for (let i = 0; i < limit; i++) {
    const authorIndex = i % authors.length;
    const postIndex = i % samplePosts.length;
    
    posts.push({
      id: `linkedin-${query}-${Date.now()}-${i}`,
      title: samplePosts[postIndex].title,
      content: samplePosts[postIndex].content,
      author: authors[authorIndex].name,
      authorTitle: authors[authorIndex].title,
      authorAvatar: authors[authorIndex].avatar,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 5,
      shares: Math.floor(Math.random() * 80) + 2,
      source: 'linkedin',
      created_at: new Date(now.getTime() - i * 120000) // Different timing from other services
    });
  }
  
  return posts;
};

module.exports = { getLinkedinPosts };