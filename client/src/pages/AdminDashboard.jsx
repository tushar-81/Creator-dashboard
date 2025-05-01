import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import NavBar from '../components/NavBar';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// Fetch high-level admin dashboard stats
const fetchAdminStats = async () => {
  try {
    const [usersStats, feedStats, reportsCount] = await Promise.all([
      api.get('/admin/stats/users'),
      api.get('/admin/stats/feed'),
      api.get('/admin/stats/reports')
    ]);
    
    return {
      users: usersStats.data,
      feed: feedStats.data,
      reports: reportsCount.data
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    throw error;
  }
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Admin sections with their routes
  const adminSections = [
    {
      title: 'User Management',
      description: 'View and manage user accounts, adjust credits, and monitor user activity',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      route: '/admin/users',
      color: 'bg-blue-100 text-blue-700',
      stats: stats?.users?.totalUsers || '—'
    },
    {
      title: 'Content Analytics',
      description: 'Review feed performance, engagement metrics, and content popularity',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      route: '/admin/analytics',
      color: 'bg-green-100 text-green-700',
      stats: stats?.feed?.totalPosts || '—'
    },
    {
      title: 'Reported Content',
      description: 'Review and moderate flagged content from users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      route: '/admin/reports',
      color: 'bg-orange-100 text-orange-700',
      stats: stats?.reports?.count || '—'
    },
    {
      title: 'System Settings',
      description: 'Configure application settings, API connections, and system parameters',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      route: '/admin/settings',
      color: 'bg-purple-100 text-purple-700',
      stats: ''
    }
  ];

  const handleNavigate = (route) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome, {user?.name || user?.email || 'Administrator'}! Manage your platform from here.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Key Stats Overview */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Platform Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.users?.totalUsers || '—'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-2">
                    <div className="text-sm text-right">
                      <span className="text-green-600 font-medium">↑ {stats?.users?.newUsers || 0} new</span> this week
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.users?.activeUsers || '—'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-2">
                    <div className="text-sm text-right">
                      <span className="text-blue-600 font-medium">{stats?.users?.activeUsersRate || 0}%</span> engagement
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Content Items</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.feed?.totalPosts || '—'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-2">
                    <div className="text-sm text-right">
                      <span className="text-green-600 font-medium">{stats?.feed?.engagement || 0}%</span> engagement rate
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">Open Reports</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.reports?.count || '—'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-2">
                    <div className="text-sm text-right">
                      <span className={stats?.reports?.count > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                        {stats?.reports?.count > 0 ? "Needs attention" : "All clear"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminSections.map((section, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleNavigate(section.route)}
                >
                  <div className="p-6">
                    <div className="flex items-start">
                      <div className={`p-3 rounded-md ${section.color} mr-4`}>
                        {section.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                        <p className="mt-1 text-gray-600">{section.description}</p>
                      </div>
                      {section.stats && (
                        <div className="text-3xl font-bold text-gray-700 ml-4">
                          {section.stats}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-end">
                      <span>View details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;