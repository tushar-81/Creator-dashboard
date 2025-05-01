import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useAuth();
  
  // Show nothing while authentication state is being determined
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // If no user is logged in, redirect to admin login page
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }
  
  // If user is logged in but not an admin, redirect to regular dashboard
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user is an admin, show the admin routes
  return <Outlet />;
};

export default AdminRoute;