import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const stored = localStorage.getItem('user');
        if (token && stored) {
          // Set user from localStorage first to maintain state across page reloads
          const storedUser = JSON.parse(stored);
          setUser(storedUser);
          
          // Set the authorization header
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          
          // Verify token with backend, but don't clear user if it fails temporarily
          try {
            const response = await api.get('/auth/verify');
            // If verification returns updated user data, use it
            if (response.data && response.data.user) {
              setUser(response.data.user);
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
          } catch (verifyError) {
            console.error("Token verification failed:", verifyError);
            // Only clear auth data if the token is explicitly invalid (401 error)
            if (verifyError.response && verifyError.response.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              delete api.defaults.headers.common.Authorization;
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear potentially invalid auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common.Authorization;
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Attempting login for:", email);
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      
      if (!res.data || !res.data.token) {
        throw new Error("Invalid response from server");
      }
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(user);
      
      console.log("Login successful for:", email);
      return user;
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data?.msg || error.message || "Login failed";
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      console.log("Attempting admin login for:", email);
      setLoading(true);
      const res = await api.post('/auth/login', { email, password, loginType: 'admin' });
      
      if (!res.data || !res.data.token) {
        throw new Error("Invalid response from server");
      }
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(user);
      
      console.log("Admin login successful for:", email);
      return user;
    } catch (error) {
      console.error("Admin login error:", error);
      const errorMsg = error.response?.data?.msg || error.message || "Admin login failed";
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      console.log("Attempting registration for:", email);
      setLoading(true);
      const res = await api.post('/auth/register', { email, password });
      
      if (!res.data || !res.data.token) {
        throw new Error("Invalid response from server");
      }
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(user);
      
      console.log("Registration successful for:", email);
      navigate('/feed');
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.msg || error.message || "Registration failed";
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    navigate('/login');
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
