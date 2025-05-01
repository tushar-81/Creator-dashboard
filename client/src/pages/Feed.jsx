import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import { useAuth } from '../contexts/AuthContext';

const fetchFeedV5 = async ({ page, source }) => {
  try {
    const params = { limit: 10, page, q: 'javascript' };
    
    // Only add source param if it's not 'all'
    if (source !== 'all') {
      params.source = source;
    }
    
    const res = await api.get('/feed', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching feed:', error);
    throw error;
  }
};

const fetchPostComments = async ({ source, postId, subreddit }) => {
  try {
    if (source !== 'reddit') {
      throw new Error('Comments are only available for Reddit posts');
    }
    
    if (!subreddit) {
      throw new Error('Subreddit is required for fetching Reddit comments');
    }
    
    const res = await api.get(`/feed/${source}/${postId}/comments`, {
      params: { subreddit, limit: 50 }
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

const Feed = () => {
  const [page, setPage] = useState(1);
  const [source, setSource] = useState('all');
  const [shareModal, setShareModal] = useState({ open: false, post: null });
  const [reportModal, setReportModal] = useState({ open: false, post: null });
  const [reportReason, setReportReason] = useState('');
  const [commentsModal, setCommentsModal] = useState({ open: false, post: null });
  const [savedPosts, setSavedPosts] = useState({});
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  // Make sure we have auth token before fetching
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Ensure we have a valid user and token before making requests
    const token = localStorage.getItem('token');
    if (token && user) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setIsReady(true);
    }
  }, [user]);

  const { 
    data: posts = [], 
    isLoading, 
    isFetching, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['feed', { page, source }],
    queryFn: () => fetchFeedV5({ page, source }),
    enabled: isReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (err) => {
      console.error('Feed query error:', err);
    }
  });

  const { 
    data: comments = [], 
    isLoading: isLoadingComments,
    error: commentsError
  } = useQuery({
    queryKey: ['comments', commentsModal.post?.source, commentsModal.post?.id, commentsModal.post?.subreddit],
    queryFn: () => fetchPostComments({ 
      source: commentsModal.post?.source, 
      postId: commentsModal.post?.id,
      subreddit: commentsModal.post?.subreddit 
    }),
    enabled: isReady && commentsModal.open && commentsModal.post?.source === 'reddit',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Check saved status for all posts in the current view
  useEffect(() => {
    if (!isReady || posts.length === 0) return;
    
    // Check saved status for each post
    const checkSavedStatus = async () => {
      const savedStatus = {};
      
      for (const post of posts) {
        try {
          const res = await api.get(`/feed/${post.source}/${post.id}/saved`);
          savedStatus[`${post.source}-${post.id}`] = res.data.saved;
        } catch (err) {
          console.error(`Error checking saved status for post ${post.id}:`, err);
        }
      }
      
      setSavedPosts(savedStatus);
    };
    
    checkSavedStatus();
  }, [posts, isReady]);

  const savePost = useMutation({
    mutationFn: (post) => api.post(`/feed/${post.source}/${post.id}/save`, { metadata: { title: post.title } }),
    onSuccess: (data, post) => {
      if (data.data.credits) updateUser({ ...JSON.parse(localStorage.getItem('user')), credits: data.data.credits });
      
      // Update the saved status in local state
      setSavedPosts(prev => ({
        ...prev,
        [`${post.source}-${post.id}`]: data.data.saved
      }));
      
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  });

  const sharePost = useMutation({
    mutationFn: (post) => api.post(`/feed/${post.source}/${post.id}/share`),
    onSuccess: (data) => {
      if (data.data.credits) updateUser({ ...JSON.parse(localStorage.getItem('user')), credits: data.data.credits });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      setShareModal({ open: false, post: null });
    }
  });

  const reportPost = useMutation({
    mutationFn: ({ post, reason }) => api.post(`/feed/${post.source}/${post.id}/report`, { reason }),
    onSuccess: (data) => {
      if (data.data.credits) updateUser({ ...JSON.parse(localStorage.getItem('user')), credits: data.data.credits });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      setReportModal({ open: false, post: null });
      setReportReason('');
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Link copied to clipboard!');
        setShareModal({ open: false, post: null });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    reportPost.mutate({ post: reportModal.post, reason: reportReason });
  };

  const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'linkedin', label: 'LinkedIn' }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar />
      
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Content Feed</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
            <div>
              <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by source:</label>
              <select
                id="source-filter"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sourceOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-grow"></div>
            
            <div className="text-sm text-gray-500 self-end">
              Showing page {page}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Error loading feed</h3>
            <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            <button 
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex items-center mb-3">
                    {/* Source icon with platform-specific styling */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 
                      ${post.source === 'reddit' ? 'bg-orange-100 text-orange-600' : 
                        'bg-blue-200 text-blue-800'}`}>
                      {post.source === 'reddit' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.033 16.01c.564-1.789 1.632-3.932 1.821-4.474.273-.787-.211-1.136-1.74.209l-.34-.64c1.744-1.897 5.335-2.326 4.113.613-.763 1.835-1.309 3.074-1.621 4.03-.455 1.393.694.828 1.819-.211.153.25.203.331.356.619-2.498 2.378-5.271 2.588-4.408-.146zm4.742-8.169c-.532-.537-1.431-.545-1.969 0-.545.545-.545 1.417 0 1.953.538.537 1.434.545 1.969 0 .545-.545.545-1.417 0-1.953zm-8.242.953c-.545-.537-1.431-.545-1.969 0-.545.545-.545 1.417 0 1.953.538.537 1.434.545 1.969 0 .545-.545.545-1.417 0-1.953z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <span className="text-sm font-medium capitalize">{post.source}</span>
                        {post.subreddit && (
                          <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-2 py-0.5 ml-2">
                            r/{post.subreddit}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        Posted {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Author info when available */}
                  {(post.author || post.username || post.authorTitle) && (
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                        {(post.profileImage || post.authorAvatar) ? (
                          <img 
                            src={post.profileImage || post.authorAvatar} 
                            alt={post.author || "Author"} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const initialLetter = (post.author || post.username || 'A')[0].toUpperCase();
                              const initialSpan = document.createElement('span');
                              initialSpan.textContent = initialLetter;
                              initialSpan.className = 'font-medium text-gray-600';
                              e.target.parentNode.appendChild(initialSpan);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium">
                            {(post.author || post.username || 'A')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{post.author || post.username || "Anonymous"}</div>
                        {post.authorTitle && <div className="text-xs text-gray-500">{post.authorTitle}</div>}
                      </div>
                    </div>
                  )}
                  
                  {/* Post title and content */}
                  <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                  {post.content || post.selftext ? (
                    <p className="text-gray-700 mb-3 text-sm">
                      {post.content || post.selftext}
                    </p>
                  ) : null}
                  
                  {/* Post thumbnail if available */}
                  {post.thumbnail && (
                    <div className="mb-4 rounded overflow-hidden">
                      <img 
                        src={post.thumbnail} 
                        alt="Post thumbnail" 
                        className="w-full object-cover max-h-64"
                      />
                    </div>
                  )}
                  
                  {/* Engagement metrics */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                    {post.likes !== undefined && (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {post.likes} likes
                      </span>
                    )}
                    {post.comments !== undefined && (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {post.comments} comments
                      </span>
                    )}
                    {post.num_comments !== undefined && (
                      <button 
                        onClick={() => setCommentsModal({ open: true, post })}
                        className="flex items-center hover:text-blue-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {post.num_comments} comments
                      </button>
                    )}
                    {post.shares !== undefined && (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {post.shares} shares
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button 
                      onClick={() => savePost.mutate(post)}
                      disabled={savePost.isLoading}
                      className={`px-3 py-1 text-sm rounded-full transition ${
                        savedPosts[`${post.source}-${post.id}`] 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={savedPosts[`${post.source}-${post.id}`] ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {savedPosts[`${post.source}-${post.id}`] ? 'Saved' : 'Save'}
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => setShareModal({ open: true, post })}
                      className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition"
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => setReportModal({ open: true, post })}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition"
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Report
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-4 mb-8">
              <button 
                onClick={() => setPage(old => Math.max(old - 1, 1))} 
                disabled={page === 1 || isFetching}
                className={`px-4 py-2 rounded ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Previous
              </button>
              
              <button 
                onClick={() => setPage(old => old + 1)} 
                disabled={isFetching || posts.length < 10}
                className={`px-4 py-2 rounded ${posts.length < 10 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No posts found</h3>
            <p className="mt-1 text-sm text-gray-500">Try changing your filter or check back later for new content.</p>
          </div>
        )}
      </div>
      
      {/* Share Modal */}
      {shareModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Share this post</h3>
            <p className="text-sm text-gray-500 mb-4">Copy this link to share the content with others</p>
            
            <div className="flex mb-4">
              <input 
                type="text" 
                value={`https://creatorapp.com/share/${shareModal.post.source}/${shareModal.post.id}`}
                className="flex-grow border rounded-l py-2 px-3"
                readOnly
              />
              <button 
                onClick={() => copyToClipboard(`https://creatorapp.com/share/${shareModal.post.source}/${shareModal.post.id}`)}
                className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShareModal({ open: false, post: null })}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => sharePost.mutate(shareModal.post)}
                disabled={sharePost.isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {sharePost.isLoading ? 'Sharing...' : 'Share & Earn Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Report inappropriate content</h3>
            
            <form onSubmit={handleReportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for reporting</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border rounded py-2 px-3"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="spam">Spam</option>
                  <option value="violence">Violence</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setReportModal({ open: false, post: null })}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!reportReason || reportPost.isLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {reportPost.isLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Comments on "{commentsModal.post.title?.substring(0, 50)}..."
              </h3>
              <button 
                onClick={() => setCommentsModal({ open: false, post: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingComments ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : commentsError ? (
              <div className="text-center py-8 text-red-500">
                <p>Error loading comments: {commentsError.message}</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No comments available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className="border-l-2 border-orange-200 pl-4"
                    style={{ marginLeft: `${comment.depth * 20}px` }}
                  >
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm mb-1">{comment.body}</div>
                    <div className="flex space-x-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {comment.ups}
                      </span>
                      {comment.downs > 0 && (
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {comment.downs}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setCommentsModal({ open: false, post: null })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
