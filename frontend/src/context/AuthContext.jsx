import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

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
          timeout: 4000
        });
        const user = response.data.user;
        setCurrentUser(user);
        setProfile(user);
        setToken(storedToken);
      } catch (err) {
        console.warn("Failed to verify stored token, clearing session.");
        localStorage.removeItem('sb_token');
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
    setToken(newToken);
    setCurrentUser(user);
    setProfile(user);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user } = response.data;
      saveAuthSession(newToken, user);
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Login failed.';
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, displayName) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', { email, password, displayName });
      const { token: newToken, user } = response.data;
      saveAuthSession(newToken, user);
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Registration failed.';
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      // Demo single sign-in sync
      const response = await axios.post('/api/auth/sync', {
        uid: 'google_' + Math.random().toString(36).substr(2, 9),
        email: 'citizen.bharat@gmail.com',
        displayName: 'Citizen Bharat',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
      });
      const user = response.data;
      const newToken = response.data.token || 'mock_google_token_' + Date.now();
      saveAuthSession(newToken, user);
      return user;
    } catch (err) {
      throw new Error('Google single sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('sb_token');
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
      });
      const updatedUser = response.data.user || response.data;
      setProfile(updatedUser);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error("Profile preference update failed:", err);
      throw err;
    }
  };

  const addMockPoints = (points, newBadge = null) => {
    setProfile(prev => {
      if (!prev) return null;
      const updatedPoints = (prev.rewardPoints || 0) + points;
      const updatedBadges = [...(prev.badges || [])];
      if (newBadge && !updatedBadges.includes(newBadge)) {
        updatedBadges.push(newBadge);
      }
      return {
        ...prev,
        rewardPoints: updatedPoints,
        badges: updatedBadges
      };
    });
  };

  const value = {
    token,
    currentUser,
    profile,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfilePreferences,
    addMockPoints,
    refetchProfile: async () => {
      if (!token) return;
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.user) {
          setProfile(res.data.user);
          setCurrentUser(res.data.user);
        }
      } catch (e) {}
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
