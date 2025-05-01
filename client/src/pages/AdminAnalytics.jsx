import React from 'react';
import { useQuery } from '@tanstack/react-query';
import NavBar from '../components/NavBar';
import api from '../api/axios';

// Fetch content analytics data
const fetchAnalyticsData = async () => {
  try {
    const response = await api.get('/admin/stats/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

const AdminAnalytics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: fetchAnalyticsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Placeholder data for demonstration
  const placeholderData = {
    postsBySource: [
      { source: 'Twitter', count: 856, engagement: 76 },
      { source: 'LinkedIn', count: 543, engagement: 58 },
      { source: 'Reddit', count: 357, engagement: 42 }
    ],
    trendsData: {
      daily: [65, 59, 80, 81, 56, 55, 40, 45, 60, 75, 63, 48, 52, 70],
      weekly: [28, 48, 40, 19, 86, 27, 90, 65, 59, 80, 81, 56],
      monthly: [31, 38, 33, 19, 26, 37, 40, 51, 44, 35, 41]
    },
    topContent: [
      { title: 'How to Increase Your Social Media Presence', views: 1453, saves: 245, source: 'LinkedIn' },
      { title: 'Top 10 Creator Economy Trends for 2025', views: 1286, saves: 198, source: 'Twitter' },
      { title: 'Monetization Strategies for Digital Creators', views: 1117, saves: 176, source: 'Reddit' },
      { title: 'Building Your Personal Brand Online', views: 986, saves: 154, source: 'Twitter' },
      { title: 'The Future of Content Creation', views: 842, saves: 122, source: 'LinkedIn' }
    ],
    userEngagement: {
      activeUsers: 2345,
      avgSessionTime: '6:32',
      avgContentViewed: 8.3,
      savesPerUser: 2.7
    }
  };

  // Use placeholder data if the API is not yet implemented
  const analyticsData = data || placeholderData;

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Content Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track performance metrics and user engagement across all content sources
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> Failed to load analytics data. Please try again later.</span>
          </div>
        ) : (
          <>
            {/* Content Source Distribution */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Content Source Distribution</h2>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analyticsData.postsBySource.map((source, index) => (
                    <div key={index} className="bg-gray-50 p-5 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{source.source}</h3>
                          <p className="text-gray-500 text-sm">Content items</p>
                        </div>
                        <span className="text-2xl font-bold">{source.count}</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Engagement rate</span>
                          <span className="font-medium">{source.engagement}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${source.engagement}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trends Overview */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Content Engagement Trends</h2>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex flex-wrap mb-4">
                  <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md text-sm font-medium mr-2">Daily</button>
                  <button className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium mr-2">Weekly</button>
                  <button className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium">Monthly</button>
                </div>
                
                {/* Chart placeholder - in a real app, use a chart library like Chart.js or Recharts */}
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">Chart visualization would be displayed here</p>
                    <p className="text-gray-400 text-sm mt-2">Using real data from your analytics API</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Content */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Performing Content</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Content Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saves
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.topContent.map((content, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {content.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.saves.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Engagement Stats */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">User Engagement</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow px-6 py-5">
                  <div className="text-sm font-medium text-gray-500 truncate">Active Users</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{analyticsData.userEngagement.activeUsers}</div>
                </div>
                <div className="bg-white rounded-lg shadow px-6 py-5">
                  <div className="text-sm font-medium text-gray-500 truncate">Avg. Session Time</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{analyticsData.userEngagement.avgSessionTime}</div>
                </div>
                <div className="bg-white rounded-lg shadow px-6 py-5">
                  <div className="text-sm font-medium text-gray-500 truncate">Avg. Content Viewed</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{analyticsData.userEngagement.avgContentViewed}</div>
                </div>
                <div className="bg-white rounded-lg shadow px-6 py-5">
                  <div className="text-sm font-medium text-gray-500 truncate">Saves Per User</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{analyticsData.userEngagement.savesPerUser}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;