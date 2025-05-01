import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NavBar from '../components/NavBar';
import api from '../api/axios';

// Fetch reported content
const fetchReportedContent = async () => {
  try {
    const response = await api.get('/admin/reports');
    return response.data;
  } catch (error) {
    console.error('Error fetching reported content:', error);
    throw error;
  }
};

const AdminReportedContent = () => {
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('pending'); // 'pending', 'reviewed', 'all'
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Use React Query to fetch reported content
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reportedContent'],
    queryFn: fetchReportedContent,
    staleTime: 60 * 1000, // 1 minute
    retry: 1
  });

  // Placeholder data for demonstration
  const placeholderReports = [
    {
      id: '1',
      contentType: 'post',
      contentId: '12345',
      contentPreview: 'This post contains misleading information about...',
      source: 'Twitter',
      reportedBy: 'user123',
      reason: 'Misinformation',
      timestamp: '2025-04-28T15:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      contentType: 'comment',
      contentId: '67890',
      contentPreview: 'This comment contains offensive language...',
      source: 'LinkedIn',
      reportedBy: 'user456',
      reason: 'Harassment',
      timestamp: '2025-04-29T10:15:00Z',
      status: 'pending'
    },
    {
      id: '3',
      contentType: 'post',
      contentId: '54321',
      contentPreview: 'This post contains spam content promoting...',
      source: 'Reddit',
      reportedBy: 'user789',
      reason: 'Spam',
      timestamp: '2025-04-27T08:45:00Z',
      status: 'reviewed',
      resolution: 'removed',
      reviewedBy: 'admin1',
      reviewTimestamp: '2025-04-27T09:30:00Z'
    }
  ];

  // Use placeholder data if API is not yet implemented
  const reportData = reports || placeholderReports;

  // Filter reports based on current tab
  const filteredReports = reportData.filter(report => {
    if (currentTab === 'all') return true;
    return report.status === currentTab;
  });
  
  // Handle resolving a report
  const resolveReport = useMutation({
    mutationFn: ({ reportId, resolution, notes }) => 
      api.patch(`/admin/reports/${reportId}`, { status: 'reviewed', resolution, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportedContent'] });
      setSelectedReport(null);
    }
  });

  // Handle report resolution submission
  const handleResolveReport = (resolution, notes = '') => {
    if (!selectedReport) return;
    resolveReport.mutate({
      reportId: selectedReport.id,
      resolution,
      notes
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResolutionBadgeClass = (resolution) => {
    switch (resolution) {
      case 'removed':
        return 'bg-red-100 text-red-800';
      case 'ignored':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reported Content</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage content that has been reported by users
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setCurrentTab('pending')}
                className={`px-4 py-2 text-sm font-medium ${
                  currentTab === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('reviewed')}
                className={`px-4 py-2 text-sm font-medium ${
                  currentTab === 'reviewed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Reviewed
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('all')}
                className={`px-4 py-2 text-sm font-medium ${
                  currentTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                All
              </button>
            </div>
          </div>
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
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            {/* Reported content list */}
            <div className="md:w-2/3">
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {filteredReports.length === 0 ? (
                    <li className="px-6 py-12 text-center text-gray-500">
                      No reported content found for this filter.
                    </li>
                  ) : (
                    filteredReports.map((report) => (
                      <li 
                        key={report.id} 
                        className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                          selectedReport?.id === report.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <div className="mb-2 sm:mb-0">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {report.contentPreview.substring(0, 50)}
                                {report.contentPreview.length > 50 ? '...' : ''}
                              </p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                                {report.status}
                              </span>
                              {report.resolution && (
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResolutionBadgeClass(report.resolution)}`}>
                                  {report.resolution}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Reported by: {report.reportedBy} • Source: {report.source}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(report.timestamp)}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            {/* Report details and action panel */}
            <div className="md:w-1/3">
              {selectedReport ? (
                <div className="bg-white shadow overflow-hidden rounded-lg divide-y divide-gray-200">
                  <div className="px-6 py-4">
                    <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
                  </div>
                  
                  <div className="px-6 py-4">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Content Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedReport.contentType}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Source</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedReport.source}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Reason</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedReport.reason}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Content Preview</dt>
                        <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                          {selectedReport.contentPreview}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Reported On</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedReport.timestamp)}</dd>
                      </div>
                      {selectedReport.reviewTimestamp && (
                        <>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Reviewed By</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedReport.reviewedBy}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Reviewed On</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedReport.reviewTimestamp)}</dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </div>

                  {selectedReport.status === 'pending' && (
                    <div className="px-6 py-4 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Take Action</h4>
                      <div className="flex flex-col space-y-2">
                        <button
                          type="button"
                          onClick={() => handleResolveReport('removed')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Remove Content
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport('warning')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          Warn User
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport('ignored')}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Ignore Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                  Select a report to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportedContent;