import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NavBar from '../components/NavBar';
import api from '../api/axios';

// Fetch system settings data
const fetchSystemSettings = async () => {
  try {
    const response = await api.get('/admin/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'content', 'users', 'api'
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: fetchSystemSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Placeholder data for demonstration
  const placeholderData = {
    general: {
      siteName: 'Creator Dashboard',
      maintenanceMode: false,
      adminEmail: 'admin@creatordashboard.com',
      defaultLanguage: 'en',
      systemVersion: '1.2.3'
    },
    content: {
      enableTwitter: true,
      enableLinkedIn: true,
      enableReddit: true,
      contentRefreshInterval: 30, // minutes
      maxSavedItemsPerUser: 100,
      autoRemoveInactiveContent: 30 // days
    },
    users: {
      registrationOpen: true,
      requireEmailVerification: true,
      defaultUserCredits: 50,
      maxLoginAttempts: 5,
      passwordExpiryDays: 90,
      sessionTimeout: 60 // minutes
    },
    api: {
      twitterApiKey: '********',
      linkedinApiKey: '********',
      redditApiKey: '********',
      enableRateLimiting: true,
      maxRequestsPerMinute: 60,
      webhookEndpoint: 'https://api.creatordashboard.com/webhooks/incoming'
    }
  };

  // Use placeholder data if the API is not yet implemented
  const settingsData = data || placeholderData;

  // State for form values
  const [formValues, setFormValues] = useState({});

  // Update form values when tab or data changes
  React.useEffect(() => {
    if (settingsData && activeTab) {
      setFormValues(settingsData[activeTab]);
    }
  }, [settingsData, activeTab]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const updateSettings = useMutation({
    mutationFn: (settings) => api.put(`/admin/settings/${activeTab}`, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      // You could add a success notification here
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      // You could add an error notification here
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings.mutate(formValues);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure and manage platform settings
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> Failed to load system settings. Please try again later.</span>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'general' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('general')}
                >
                  General
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'content' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('content')}
                >
                  Content
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'users' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('users')}
                >
                  User Management
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 text-sm font-medium ${
                    activeTab === 'api' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('api')}
                >
                  API & Integrations
                </button>
              </nav>
            </div>

            {/* Settings Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* General Settings */}
                {activeTab === 'general' && (
                  <>
                    <div>
                      <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">Platform Name</label>
                      <input
                        type="text"
                        name="siteName"
                        id="siteName"
                        value={formValues.siteName || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">The name of your platform as it appears to users</p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="maintenanceMode"
                        id="maintenanceMode"
                        checked={formValues.maintenanceMode || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                        Maintenance Mode
                      </label>
                    </div>
                    
                    <div>
                      <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">Admin Contact Email</label>
                      <input
                        type="email"
                        name="adminEmail"
                        id="adminEmail"
                        value={formValues.adminEmail || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700">Default Language</label>
                      <select
                        name="defaultLanguage"
                        id="defaultLanguage"
                        value={formValues.defaultLanguage || 'en'}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">System Version</label>
                      <div className="mt-1 py-2 px-3 bg-gray-100 rounded-md text-sm">{formValues.systemVersion}</div>
                      <p className="mt-1 text-xs text-gray-500">Current version of the platform software</p>
                    </div>
                  </>
                )}

                {/* Content Settings */}
                {activeTab === 'content' && (
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enableTwitter"
                          id="enableTwitter"
                          checked={formValues.enableTwitter || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enableTwitter" className="ml-2 block text-sm text-gray-900">
                          Enable Twitter Content
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enableLinkedIn"
                          id="enableLinkedIn"
                          checked={formValues.enableLinkedIn || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enableLinkedIn" className="ml-2 block text-sm text-gray-900">
                          Enable LinkedIn Content
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enableReddit"
                          id="enableReddit"
                          checked={formValues.enableReddit || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enableReddit" className="ml-2 block text-sm text-gray-900">
                          Enable Reddit Content
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contentRefreshInterval" className="block text-sm font-medium text-gray-700">
                        Content Refresh Interval (minutes)
                      </label>
                      <input
                        type="number"
                        name="contentRefreshInterval"
                        id="contentRefreshInterval"
                        value={formValues.contentRefreshInterval || 30}
                        onChange={handleInputChange}
                        min="5"
                        max="1440"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">How often to fetch new content from sources</p>
                    </div>

                    <div>
                      <label htmlFor="maxSavedItemsPerUser" className="block text-sm font-medium text-gray-700">
                        Max Saved Items Per User
                      </label>
                      <input
                        type="number"
                        name="maxSavedItemsPerUser"
                        id="maxSavedItemsPerUser"
                        value={formValues.maxSavedItemsPerUser || 100}
                        onChange={handleInputChange}
                        min="10"
                        max="500"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="autoRemoveInactiveContent" className="block text-sm font-medium text-gray-700">
                        Auto-Remove Inactive Content (days)
                      </label>
                      <input
                        type="number"
                        name="autoRemoveInactiveContent"
                        id="autoRemoveInactiveContent"
                        value={formValues.autoRemoveInactiveContent || 30}
                        onChange={handleInputChange}
                        min="1"
                        max="365"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Remove content that has not been interacted with after this many days</p>
                    </div>
                  </>
                )}

                {/* User Management Settings */}
                {activeTab === 'users' && (
                  <>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="registrationOpen"
                        id="registrationOpen"
                        checked={formValues.registrationOpen || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="registrationOpen" className="ml-2 block text-sm text-gray-900">
                        Allow New User Registration
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="requireEmailVerification"
                        id="requireEmailVerification"
                        checked={formValues.requireEmailVerification || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-900">
                        Require Email Verification
                      </label>
                    </div>

                    <div>
                      <label htmlFor="defaultUserCredits" className="block text-sm font-medium text-gray-700">
                        Default Credits for New Users
                      </label>
                      <input
                        type="number"
                        name="defaultUserCredits"
                        id="defaultUserCredits"
                        value={formValues.defaultUserCredits || 50}
                        onChange={handleInputChange}
                        min="0"
                        max="1000"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="maxLoginAttempts" className="block text-sm font-medium text-gray-700">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        name="maxLoginAttempts"
                        id="maxLoginAttempts"
                        value={formValues.maxLoginAttempts || 5}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Number of failed login attempts before account lockout</p>
                    </div>

                    <div>
                      <label htmlFor="passwordExpiryDays" className="block text-sm font-medium text-gray-700">
                        Password Expiration (days)
                      </label>
                      <input
                        type="number"
                        name="passwordExpiryDays"
                        id="passwordExpiryDays"
                        value={formValues.passwordExpiryDays || 90}
                        onChange={handleInputChange}
                        min="0"
                        max="365"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Number of days before users must change their password (0 = never)</p>
                    </div>

                    <div>
                      <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        name="sessionTimeout"
                        id="sessionTimeout"
                        value={formValues.sessionTimeout || 60}
                        onChange={handleInputChange}
                        min="5"
                        max="1440"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Time before inactive users are automatically logged out</p>
                    </div>
                  </>
                )}

                {/* API & Integrations Settings */}
                {activeTab === 'api' && (
                  <>
                    <div>
                      <label htmlFor="twitterApiKey" className="block text-sm font-medium text-gray-700">Twitter API Key</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="password"
                          name="twitterApiKey"
                          id="twitterApiKey"
                          value={formValues.twitterApiKey || ''}
                          onChange={handleInputChange}
                          className="flex-1 min-w-0 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="linkedinApiKey" className="block text-sm font-medium text-gray-700">LinkedIn API Key</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="password"
                          name="linkedinApiKey"
                          id="linkedinApiKey"
                          value={formValues.linkedinApiKey || ''}
                          onChange={handleInputChange}
                          className="flex-1 min-w-0 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="redditApiKey" className="block text-sm font-medium text-gray-700">Reddit API Key</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="password"
                          name="redditApiKey"
                          id="redditApiKey"
                          value={formValues.redditApiKey || ''}
                          onChange={handleInputChange}
                          className="flex-1 min-w-0 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="enableRateLimiting"
                        id="enableRateLimiting"
                        checked={formValues.enableRateLimiting || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableRateLimiting" className="ml-2 block text-sm text-gray-900">
                        Enable API Rate Limiting
                      </label>
                    </div>

                    <div>
                      <label htmlFor="maxRequestsPerMinute" className="block text-sm font-medium text-gray-700">
                        Max API Requests Per Minute
                      </label>
                      <input
                        type="number"
                        name="maxRequestsPerMinute"
                        id="maxRequestsPerMinute"
                        value={formValues.maxRequestsPerMinute || 60}
                        onChange={handleInputChange}
                        min="10"
                        max="1000"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="webhookEndpoint" className="block text-sm font-medium text-gray-700">Webhook Endpoint</label>
                      <input
                        type="text"
                        name="webhookEndpoint"
                        id="webhookEndpoint"
                        value={formValues.webhookEndpoint || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">URL to receive webhook notifications for platform events</p>
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset to Defaults
                  </button>
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={updateSettings.isLoading}
                  >
                    {updateSettings.isLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;