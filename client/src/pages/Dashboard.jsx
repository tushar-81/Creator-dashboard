import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import Avatar from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Helper function to validate URLs - accepts any valid URL format
const isValidImageUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url); // Try to create a URL object to validate the URL format
    return true;
  } catch (e) {
    return false; // If URL constructor throws an error, the URL is invalid
  }
};

const fetchDashboardData = async () => {
  try {
    const [profileRes, creditsRes, savedRes] = await Promise.all([
      api.get('/users/me'),
      api.get('/users/me/credits'),
      api.get('/users/me/saved')
    ]);
    
    return {
      profile: profileRes.data,
      credits: creditsRes.data.credits,
      transactions: creditsRes.data.transactions,
      saved: savedRes.data
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  
  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === 'admin') {
      setRedirecting(true);
      // Short timeout to ensure the loading state is shown before redirecting
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 100);
    }
  }, [user, navigate]);
  
  // Show loading indicator while redirecting
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Don't load dashboard data for admin users
  if (user && user.role === 'admin') {
    return null;
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    // Don't fetch data if user is admin
    enabled: !(user && user.role === 'admin')
  });
  
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    avatarUrl: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const updateProfile = useMutation({
    mutationFn: (updatedProfile) => api.put('/users/me/profile', updatedProfile),
    onSuccess: (response) => {
      updateUser(response.data);
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      setIsEditing(false);
      setImageError(false);
    }
  });
  
  const removeSavedPost = useMutation({
    mutationFn: (postId) => api.delete(`/feed/saved/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  });

  if (isLoading) return <p className="p-4">Loading dashboard...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading dashboard: {error.message}</p>;

  const { profile, credits, transactions, saved } = data;
  
  const startEditing = () => {
    setProfileForm({
      name: profile.name || '',
      bio: profile.bio || '',
      avatarUrl: profile.avatarUrl || ''
    });
    setIsEditing(true);
    setImageError(false);
  };
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
    
    // Reset image error when user changes the URL
    if (name === 'avatarUrl') {
      setImageError(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate(profileForm);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div>
      <NavBar />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Credit Stats */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Your Credits: {credits}</h2>
            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-sm">Complete your profile to earn more credits!</p>
              <p className="text-xs text-gray-500 mt-1">
                Profile completion status: {profile.profileCompleted ? 'Complete' : 'Incomplete'}
              </p>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
            <div className="max-h-60 overflow-y-auto">
              {transactions && transactions.length > 0 ? (
                <ul className="space-y-2">
                  {transactions.slice(0, 10).map(tx => (
                    <li key={tx._id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium capitalize">{tx.type}</span>
                        <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
          
          {/* Profile Section */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Profile</h2>
              {!isEditing && (
                <button 
                  onClick={startEditing}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="w-full border p-2 rounded mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    className="w-full border p-2 rounded mt-1 h-20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Image URL</label>
                  <input
                    type="text"
                    name="avatarUrl"
                    value={profileForm.avatarUrl}
                    onChange={handleProfileChange}
                    className={`w-full border p-2 rounded mt-1 ${
                      isValidImageUrl(profileForm.avatarUrl) || !profileForm.avatarUrl ? '' : 'border-red-500'
                    }`}
                    placeholder="https://example.com/your-image.jpg"
                  />
                  {profileForm.avatarUrl && !isValidImageUrl(profileForm.avatarUrl) && (
                    <p className="text-red-500 text-xs mt-1">
                      Please enter a valid URL (e.g., https://example.com/image)
                    </p>
                  )}
                  {profileForm.avatarUrl && isValidImageUrl(profileForm.avatarUrl) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <Avatar 
                        src={profileForm.avatarUrl}
                        name={profileForm.name}
                        size="lg"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                    disabled={updateProfile.isLoading || (profileForm.avatarUrl && !isValidImageUrl(profileForm.avatarUrl)) || imageError}
                  >
                    {updateProfile.isLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center mb-4">
                  <Avatar 
                    src={profile.avatarUrl}
                    name={profile.name || profile.email}
                    size="lg"
                    className="mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{profile.name || 'Anonymous Creator'}</h3>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Bio</h4>
                  <p className="text-gray-600 text-sm">{profile.bio || 'No bio provided yet.'}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Saved Posts */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Saved Content</h2>
            <div className="max-h-96 overflow-y-auto">
              {saved && saved.length > 0 ? (
                <ul className="space-y-3">
                  {saved.map(post => (
                    <li key={post._id} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm capitalize">{post.source}</span>
                        <button 
                          onClick={() => removeSavedPost.mutate(post._id)}
                          className="text-red-500 text-xs hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-sm mt-1">{post.metadata?.title || 'Saved content'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Saved on {new Date(post.date).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No saved content yet</p>
                  <p className="text-sm text-gray-400 mt-1">Items you save from the feed will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;