import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const getApiErrorMessage = (error, fallback) => {
  if (!API_BASE_URL && !import.meta.env.DEV) {
    return 'Login service is not connected yet. The backend must be deployed and VITE_API_BASE_URL configured for the website.';
  }
  if (!error.response) {
    return 'Could not reach the login service. Check the backend URL and try again.';
  }
  return error.response.data?.error || fallback;
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('sb_token') || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Axios interceptor to attach Bearer token automatically
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('sb_token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    }, (error) => Promise.reject(error));

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sb_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
          timeout: 2500
        });
        const user = response.data.user;
        saveAuthSession(storedToken, user);
      } catch (err) {
        localStorage.removeItem('sb_token');
        localStorage.removeItem('sb_user');
        setToken(null);
        setCurrentUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveAuthSession = (newToken, user) => {
    localStorage.setItem('sb_token', newToken);
    localStorage.setItem('sb_user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
    setProfile(user);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password }, { timeout: 3000 });
      const { token: newToken, user } = response.data;
      saveAuthSession(newToken, user);
      return user;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Unable to sign in. Check your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, displayName, phone, state) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        displayName,
        phone: phone || '',
        state: state || ''
      }, { timeout: 3000 });
      return response.data.user;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Unable to create account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (email) => {
    try {
      const res = await axios.post('/api/auth/send-otp', { email }, { timeout: 3000 });
      return res.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Could not send the verification code.'));
    }
  };

  const verifyOtp = async (email, otpCode) => {
    try {
      const res = await axios.post('/api/auth/verify-otp', { email, otp: otpCode }, { timeout: 3000 });
      if (!res.data.token || !res.data.user) {
        throw new Error('Verification succeeded but the server did not create a sign-in session.');
      }
      saveAuthSession(res.data.token, res.data.user);
      return res.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'OTP verification failed.'));
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await axios.post('/api/auth/resend-otp', { email }, { timeout: 3000 });
      return res.data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Could not resend the verification code.'));
    }
  };

  const loginWithGoogle = async () => {
    throw new Error('Google Sign-In is unavailable until an authorized identity-provider integration is configured.');
  };

  const logout = async () => {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
    setToken(null);
    setCurrentUser(null);
    setProfile(null);
  };

  const updateProfilePreferences = async (stateName, selectedInterests, displayName, phone) => {
    try {
      const response = await axios.post('/api/auth/update', {
        state: stateName,
        interests: selectedInterests,
        displayName,
        phone
      }, { timeout: 3000 });
      const updatedUser = response.data.user || response.data;
      setProfile(updatedUser);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Could not save your profile preferences.');
    }
  };

  const updatePreferredLocation = async (preferredLocation) => {
    try {
      const response = await axios.post('/api/auth/update', { preferredLocation }, { timeout: 3000 });
      const updatedUser = response.data.user || response.data;
      setProfile(updatedUser);
      setCurrentUser(updatedUser);
      localStorage.setItem('sb_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Could not save your preferred search location.');
    }
  };

  const value = {
    token,
    currentUser,
    profile,
    loading,
    login,
    signup,
    sendOtp,
    verifyOtp,
    resendOtp,
    loginWithGoogle,
    logout,
    updateProfilePreferences,
    updatePreferredLocation,
    refetchProfile: async () => {
      if (!token) return;
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.user) {
          setProfile(res.data.user);
          setCurrentUser(res.data.user);
        }
      } catch (error) {
        console.error('Could not refresh the signed-in user profile:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-100 p-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Initializing Smart Bharat AI...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
