import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NavBar from '../components/NavBar';
import api from '../api/axios';

// Fetch reported content data
const fetchReportedContent = async () => {
  try {
    const response = await api.get('/admin/reports');
    return response.data;
  } catch (error) {
    console.error('Error fetching reported content:', error);
    throw error;
  }
};

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminReports'],
    queryFn: fetchReportedContent,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Placeholder data for demonstration
  const placeholderData = {
    reports: [
      {
        id: '1',
        content: {
          id: 'post123',
          title: 'How to Game the System',
          excerpt: 'This post contains suspicious content about exploiting platform policies...',
          source: 'Twitter',
          postDate: '2025-04-25T15:32:00.000Z'
        },
        reportDate: '2025-04-26T09:15:00.000Z',
        reportType: 'inappropriate',
        reportedBy: 'user456',
        status: 'pending',
        reason: 'This post contains information on how to violate platform policies and should be removed.'
      },
      {
        id: '2',
        content: {
          id: 'post234',
          title: 'Affiliate Marketing Secrets',
          excerpt: 'The best way to make money online is through these hidden techniques...',
          source: 'LinkedIn',
          postDate: '2025-04-23T12:05:00.000Z'
        },
        reportDate: '2025-04-24T16:45:00.000Z',
        reportType: 'spam',
        reportedBy: 'user789',
        status: 'pending',
        reason: 'This post is clearly spam and contains misleading information about making money.'
      },
      {
        id: '3',
        content: {
          id: 'post345',
          title: 'Content Creator Monetization',
          excerpt: 'Learn how successful creators monetize their content across platforms...',
          source: 'Reddit',
          postDate: '2025-04-20T10:12:00.000Z'
        },
        reportDate: '2025-04-20T14:30:00.000Z',
        reportType: 'copyright',
        reportedBy: 'user101',
        status: 'resolved',
        reason: 'This content was stolen from my website without permission.',
        resolution: {
          action: 'removed',
          date: '2025-04-21T08:20:00.000Z',
          by: 'admin.user'
        }
      },
      {
        id: '4',
        content: {
          id: 'post456',
          title: 'Get Rich Quick with Crypto',
          excerpt: 'Invest in these coins now and become a millionaire by next month...',
          source: 'Twitter',
          postDate: '2025-04-18T16:40:00.000Z'
        },
        reportDate: '2025-04-19T08:12:00.000Z',
        reportType: 'scam',
        reportedBy: 'user202',
        status: 'resolved',
        reason: 'This is a scam post promoting questionable investment advice.',
        resolution: {
          action: 'removed',
          date: '2025-04-19T10:45:00.000Z',
          by: 'admin.user'
        }
      },
      {
        id: '5',
        content: {
          id: 'post567',
          title: 'Ultimate Guide to Social Media Growth',
          excerpt: 'The secret tactics used by influencers to grow their following...',
          source: 'LinkedIn',
          postDate: '2025-04-15T09:30:00.000Z'
        },
        reportDate: '2025-04-16T14:20:00.000Z',
        reportType: 'misleading',
        reportedBy: 'user303',
        status: 'pending',
        reason: 'This post makes false promises and unrealistic claims about follower growth.'
      }
    ]
  };

  // Use placeholder data if the API is not yet implemented
  const reportsData = data || placeholderData;

  // Filter reports based on selected filter
  const filteredReports = filter === 'all' 
    ? reportsData.reports 
    : reportsData.reports.filter(report => report.status === filter);

  // Action mutation for handling reports (approve, reject, remove)
  const handleReport = useMutation({
    mutationFn: ({ reportId, action }) => api.post(`/admin/reports/${reportId}/action`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
    }
  });

  // Function to get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reported Content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and moderate content that has been flagged by users
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> Failed to load reported content. Please try again later.</span>
          </div>
        ) : (
          <>
            {/* Filter Controls */}
            <div className="mb-6">
              <div className="flex space-x-2">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setFilter('all')}
                >
                  All Reports
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'resolved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setFilter('resolved')}
                >
                  Resolved
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white shadow rounded-lg">
              {filteredReports.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">No reported content matching your filter</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Report Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReports.map(report => (
                        <tr key={report.id}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{report.content.title}</span>
                              <span className="text-xs text-gray-500">{report.content.excerpt}</span>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-gray-500 mr-2">Source: {report.content.source}</span>
                                <span className="text-xs text-gray-500">Posted: {formatDate(report.content.postDate)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-900 uppercase">{report.reportType}</span>
                              <span className="text-xs text-gray-500">Reported on {formatDate(report.reportDate)}</span>
                              <span className="text-xs text-gray-500">By user: {report.reportedBy}</span>
                              <p className="text-xs text-gray-700 mt-1">{report.reason}</p>
                              {report.resolution && (
                                <div className="mt-1 text-xs">
                                  <span className="text-green-600">
                                    {report.resolution.action} by {report.resolution.by} on {formatDate(report.resolution.date)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {report.status === 'pending' ? (
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => handleReport.mutate({ reportId: report.id, action: 'remove' })}
                                  className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium py-1 px-2 rounded"
                                  disabled={handleReport.isLoading}
                                >
                                  Remove
                                </button>
                                <button 
                                  onClick={() => handleReport.mutate({ reportId: report.id, action: 'ignore' })}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium py-1 px-2 rounded"
                                  disabled={handleReport.isLoading}
                                >
                                  Ignore
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Handled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReports;