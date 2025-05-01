import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import Avatar from '../components/Avatar';

const fetchUsers = async ({ queryKey }) => {
  const [_, params] = queryKey;
  const { page, search } = params;
  const queryParams = { page, limit: 10 };
  if (search) queryParams.search = search;
  
  const res = await api.get('/admin/users', { params: queryParams });
  return res.data;
};

const fetchReportedPosts = async () => {
  const res = await api.get('/admin/reports');
  return res.data;
};

const fetchUserAnalytics = async () => {
  const res = await api.get('/admin/analytics/users');
  return res.data;
};

const fetchFeedAnalytics = async () => {
  const res = await api.get('/admin/analytics/feed');
  return res.data;
};

const fetchUserDetail = async (userId) => {
  if (!userId) return null;
  const res = await api.get(`/admin/users/${userId}`);
  return {
    ...res.data.user,
    transactions: res.data.transactions || [],
    savedPosts: res.data.savedPosts || []
  };
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [edits, setEdits] = useState({});
  const [activeTab, setActiveTab] = useState('users');
  const [creditModal, setCreditModal] = useState({ open: false, user: null });
  const [analyticsView, setAnalyticsView] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);

  const { 
    data: usersData = { users: [], total: 0 }, 
    isLoading: usersLoading 
  } = useQuery({
    queryKey: ['adminUsers', { page, search }],
    queryFn: fetchUsers,
    keepPreviousData: true
  });

  const { 
    data: userDetail,
    isLoading: userDetailLoading 
  } = useQuery({
    queryKey: ['userDetail', selectedUser?._id],
    queryFn: () => fetchUserDetail(selectedUser?._id),
    enabled: !!selectedUser,
    staleTime: 30000
  });

  const {
    data: reports = [],
    isLoading: reportsLoading
  } = useQuery({
    queryKey: ['adminReports'],
    queryFn: fetchReportedPosts,
    enabled: activeTab === 'reports'
  });

  const {
    data: userAnalytics = { newUsers: [], activeUsers: [], userStats: {} },
    isLoading: userAnalyticsLoading
  } = useQuery({
    queryKey: ['userAnalytics'],
    queryFn: fetchUserAnalytics,
    enabled: activeTab === 'analytics' && analyticsView === 'users'
  });

  const {
    data: feedAnalytics = { postStats: {}, popularContent: [], engagementRate: [] },
    isLoading: feedAnalyticsLoading
  } = useQuery({
    queryKey: ['feedAnalytics'],
    queryFn: fetchFeedAnalytics,
    enabled: activeTab === 'analytics' && analyticsView === 'feed'
  });

  const updateCredits = useMutation({
    mutationFn: ({ id, credits, reason }) => api.patch(`/admin/users/${id}/credits`, { credits, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      if (selectedUser && selectedUser._id === creditModal.user?._id) {
        queryClient.invalidateQueries({ queryKey: ['userDetail', selectedUser._id] });
      }
      setCreditModal({ open: false, user: null });
    }
  });

  const removeReport = useMutation({
    mutationFn: (reportId) => api.delete(`/admin/reports/${reportId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreditSubmit = (e) => {
    e.preventDefault();
    if (!creditModal.user) return;
    
    const newCredits = parseInt(edits[creditModal.user._id] || creditModal.user.credits);
    const reason = e.target.reason.value;
    
    updateCredits.mutate({ 
      id: creditModal.user._id, 
      credits: newCredits,
      reason
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
  };

  const totalPages = Math.ceil(usersData.total / 10);

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          
          <div className="border-b border-gray-200 mb-6">
            <ul className="flex flex-wrap -mb-px">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'users' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setActiveTab('users');
                    setSelectedUser(null);
                  }}
                >
                  User Management
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'analytics' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setActiveTab('analytics');
                    setSelectedUser(null);
                  }}
                >
                  Analytics
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'reports' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setActiveTab('reports');
                    setSelectedUser(null);
                  }}
                >
                  Reported Content
                </button>
              </li>
            </ul>
          </div>
          
          {activeTab === 'users' && !selectedUser ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search by email or name"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                  >
                    Search
                  </button>
                </form>
                
                <div className="text-sm text-gray-500 self-end">
                  Showing {usersData.users.length} of {usersData.total} users
                </div>
              </div>
              
              {usersLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : usersData.users.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-left font-medium text-gray-600">User</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600">Role</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600">Profile Status</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600">Credits</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600">Last Login</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {usersData.users.map(user => (
                          <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewUser(user)}>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Avatar 
                                  src={user.avatarUrl}
                                  name={user.name || user.email}
                                  size="sm"
                                  className="mr-3"
                                />
                                <div>
                                  <div className="font-medium">{user.name || 'No Name'}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.profileCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.profileCompleted ? 'Complete' : 'Incomplete'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium">{user.credits}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCreditModal({ open: true, user });
                                  setEdits({ ...edits, [user._id]: user.credits });
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Adjust Credits
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <button 
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className={`px-4 py-2 rounded ${
                        page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="text-sm text-gray-600">
                      Page {page} of {totalPages || 1}
                    </div>
                    
                    <button 
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages}
                      className={`px-4 py-2 rounded ${
                        page >= totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
                </div>
              )}
            </>
          ) : activeTab === 'users' && selectedUser ? (
            <div>
              <div className="flex items-center mb-6">
                <button 
                  onClick={handleBackToUsers}
                  className="mr-2 flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to User List
                </button>
                <h2 className="text-xl font-bold flex-grow">User Details</h2>
              </div>

              {userDetailLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Profile Information</h3>
                    
                    <div className="flex items-start">
                      <div className="mr-4">
                        <Avatar 
                          src={selectedUser.avatarUrl}
                          name={selectedUser.name || selectedUser.email}
                          size="lg"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Name</h4>
                            <p>{selectedUser.name || 'Not provided'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Email</h4>
                            <p>{selectedUser.email}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Role</h4>
                            <p className="capitalize">{selectedUser.role}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Credits</h4>
                            <div className="flex items-center">
                              <p className="mr-2">{selectedUser.credits}</p>
                              <button 
                                onClick={() => {
                                  setCreditModal({ open: true, user: selectedUser });
                                  setEdits({ ...edits, [selectedUser._id]: selectedUser.credits });
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Adjust
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Profile Status</h4>
                            <p>{selectedUser.profileCompleted ? 'Complete' : 'Incomplete'}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Last Login</h4>
                            <p>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</p>
                          </div>
                        </div>
                        
                        {selectedUser.bio && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                            <p className="text-gray-700 mt-1">{selectedUser.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Account Activity</h3>
                    
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Credit Transactions</h4>
                      {userDetail?.transactions?.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userDetail.transactions.map((tx, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 capitalize">{tx.type}</td>
                                <td className={`px-4 py-2 ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">{tx.note || '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{new Date(tx.date).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 text-sm">No credit transactions found</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Saved Content</h4>
                      {userDetail?.savedPosts?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userDetail.savedPosts.map((post) => (
                            <div key={post._id} className="border rounded p-3">
                              <div className="flex justify-between items-start">
                                <span className="inline-block px-2 py-1 text-xs capitalize rounded bg-blue-100 text-blue-800 mb-2">
                                  {post.source}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(post.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-medium text-sm">{post.metadata?.title || 'Saved content'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No saved content</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'analytics' ? (
            <>
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAnalyticsView('users')}
                    className={`px-4 py-2 rounded-md ${
                      analyticsView === 'users'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    User Analytics
                  </button>
                  <button
                    onClick={() => setAnalyticsView('feed')}
                    className={`px-4 py-2 rounded-md ${
                      analyticsView === 'feed'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Feed Activity
                  </button>
                </div>
              </div>

              {analyticsView === 'users' ? (
                <>
                  {userAnalyticsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
                          <p className="text-2xl font-bold">{userAnalytics.userStats.totalUsers || 0}</p>
                          <p className="text-xs text-blue-600 mt-1">All time</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h3 className="text-sm font-medium text-green-800">Active Users</h3>
                          <p className="text-2xl font-bold">{userAnalytics.userStats.activeUsers || 0}</p>
                          <p className="text-xs text-green-600 mt-1">Last 7 days</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h3 className="text-sm font-medium text-purple-800">Average Credits</h3>
                          <p className="text-2xl font-bold">{userAnalytics.userStats.avgCredits || 0}</p>
                          <p className="text-xs text-purple-600 mt-1">Per user</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h3 className="text-sm font-medium text-orange-800">Profile Completion</h3>
                          <p className="text-2xl font-bold">{userAnalytics.userStats.profileCompletionRate || 0}%</p>
                          <p className="text-xs text-orange-600 mt-1">Rate</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">New User Registrations</h3>
                        <div className="h-64 bg-gray-50 rounded p-4 flex items-end space-x-2">
                          {userAnalytics.newUsers.map((data, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div 
                                className="bg-blue-500 rounded-t w-8" 
                                style={{ height: `${(data.count / Math.max(...userAnalytics.newUsers.map(d => d.count))) * 100}%` }}
                              ></div>
                              <p className="text-xs mt-1 text-gray-600">{data.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">Most Active Users</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {userAnalytics.activeUsers.map((user, index) => (
                                <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                  const fullUserRecord = usersData.users.find(u => u.email === user.email);
                                  if (fullUserRecord) {
                                    handleViewUser(fullUserRecord);
                                  }
                                }}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-700">
                                        {user.email && user.email[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-medium">{user.name || 'No Name'}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">{user.activityCount}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {new Date(user.lastActive).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {feedAnalyticsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h3 className="text-sm font-medium text-blue-800">Total Posts</h3>
                          <p className="text-2xl font-bold">{feedAnalytics.postStats.totalPosts || 0}</p>
                          <p className="text-xs text-blue-600 mt-1">All sources</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h3 className="text-sm font-medium text-green-800">Saved Posts</h3>
                          <p className="text-2xl font-bold">{feedAnalytics.postStats.savedPosts || 0}</p>
                          <p className="text-xs text-green-600 mt-1">By all users</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h3 className="text-sm font-medium text-purple-800">Shares</h3>
                          <p className="text-2xl font-bold">{feedAnalytics.postStats.sharedPosts || 0}</p>
                          <p className="text-xs text-purple-600 mt-1">Total shares</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h3 className="text-sm font-medium text-orange-800">Reports</h3>
                          <p className="text-2xl font-bold">{feedAnalytics.postStats.reportedPosts || 0}</p>
                          <p className="text-xs text-orange-600 mt-1">Content reports</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">Content Engagement by Source</h3>
                        <div className="h-64 bg-gray-50 rounded p-4 flex items-end space-x-6 justify-center">
                          {feedAnalytics.engagementRate.map((data, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div 
                                className={`rounded-t w-20 ${
                                  data.source === 'twitter' ? 'bg-blue-500' : 
                                  data.source === 'reddit' ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ height: `${data.rate * 200}px` }}
                              ></div>
                              <p className="text-sm mt-2 font-medium capitalize">{data.source}</p>
                              <p className="text-xs text-gray-600">{(data.rate * 100).toFixed(1)}% engagement</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">Most Popular Content</h3>
                        <div className="space-y-4">
                          {feedAnalytics.popularContent.map((post, index) => (
                            <div key={index} className="border border-gray-100 rounded p-3 bg-gray-50">
                              <div className="flex justify-between">
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                                    post.source === 'twitter' ? 'bg-blue-100 text-blue-800' : 
                                    post.source === 'reddit' ? 'bg-orange-100 text-orange-800' : 
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {post.source}
                                  </span>
                                </div>
                                <div className="flex space-x-3 text-sm">
                                  <div className="flex items-center text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    {post.saves || 0}
                                  </div>
                                  <div className="flex items-center text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    {post.shares || 0}
                                  </div>
                                </div>
                              </div>
                              <h4 className="font-medium mt-2">{post.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                By {post.author} • {new Date(post.date).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Reported Content</h2>
              
              {reportsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                            report.source === 'twitter' ? 'bg-blue-100 text-blue-800' : 
                            report.source === 'reddit' ? 'bg-orange-100 text-orange-800' : 
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {report.source}
                          </span>
                          <span className="text-sm text-gray-600">
                            Reported on {new Date(report.date).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => removeReport.mutate(report._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                      
                      <div className="mt-2">
                        <p className="font-medium">Post ID: {report.postId}</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Reason:</span> {report.reason || 'No reason provided'}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Reported by:</span> {report.user?.email || 'Unknown user'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No reported content</h3>
                  <p className="mt-1 text-sm text-gray-500">All content is appropriate</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {creditModal.open && creditModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Adjust Credits</h3>
            <p className="mb-4">
              <span className="font-medium">User:</span> {creditModal.user.email}
            </p>
            
            <form onSubmit={handleCreditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  value={edits[creditModal.user._id] ?? creditModal.user.credits}
                  onChange={(e) => setEdits({ 
                    ...edits, 
                    [creditModal.user._id]: Number(e.target.value) 
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Current balance: {creditModal.user.credits} credits
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  name="reason"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="bonus">Bonus</option>
                  <option value="correction">Correction</option>
                  <option value="penalty">Penalty</option>
                  <option value="admin">Administrative adjustment</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreditModal({ open: false, user: null })}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateCredits.isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {updateCredits.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;