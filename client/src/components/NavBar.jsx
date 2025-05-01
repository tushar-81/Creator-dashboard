import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

const NavBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/feed" className="text-blue-600 font-bold text-xl">
                Creator Dashboard
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4 items-center">
              <Link 
                to="/feed" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/feed') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Feed
              </Link>
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/dashboard') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.startsWith('/admin') 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          {/* Right side section */}
          <div className="flex items-center">
            {/* Credit display */}
            <div className="hidden md:flex items-center mr-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                {user?.credits || 0} Credits
              </div>
            </div>
            
            {/* User menu */}
            <div className="hidden md:ml-4 md:flex md:items-center">
              <div className="relative">
                <div className="flex items-center">
                  <Avatar 
                    src={user?.avatarUrl}
                    name={user?.name || user?.email || 'User'}
                    size="sm"
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">{user?.name || user?.email || ''}</span>
                </div>
              </div>
              <div className="ml-4">
                <button 
                  onClick={logout} 
                  className="ml-2 px-3 py-1 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                className="bg-white p-2 rounded-md text-gray-500 hover:text-blue-600 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white pt-2 pb-3 px-2 space-y-1 border-t">
          <Link 
            to="/feed" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/feed') 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Feed
          </Link>
          <Link 
            to="/dashboard" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/dashboard') 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          {user?.role === 'admin' && (
            <Link 
              to="/admin" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname.startsWith('/admin') 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center">
              <Avatar 
                src={user?.avatarUrl}
                name={user?.name || user?.email || 'User'}
                size="sm"
                className="mr-2"
              />
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {user?.credits || 0} Credits
              </div>
            </div>
            <button 
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }} 
              className="px-3 py-1 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;