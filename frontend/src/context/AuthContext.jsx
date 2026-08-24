import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { mockAuthClient } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authenticated user with backend DB profile
  const syncProfile = async (user) => {
    try {
      const response = await axios.post('/api/auth/sync', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      setProfile(response.data);
    } catch (err) {
      console.warn("Backend sync failed. Using local profile state.", err.message);
      // Backend offline fallback profile
      setProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Citizen of India',
        photoURL: user.photoURL || '',
        state: 'Delhi',
        interests: ['Healthcare', 'Services'],
        rewardPoints: 120, // default dummy points for mock UI experience
        badges: ['Active Reporter'],
        role: user.email.includes('admin') ? 'admin' : 'user'
      });
    }
  };

  useEffect(() => {
    // Listen for auth changes on our client
    const unsubscribe = mockAuthClient.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user } = await mockAuthClient.signInWithEmail(email, password);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, displayName) => {
    setLoading(true);
    try {
      const { user } = await mockAuthClient.signUpWithEmail(email, password, displayName);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { user } = await mockAuthClient.signInWithGoogle();
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await mockAuthClient.signOut();
    } finally {
      setLoading(false);
    }
  };

  const updateProfilePreferences = async (stateName, selectedInterests) => {
    if (!currentUser) return;
    try {
      const response = await axios.post('/api/auth/update', {
        email: currentUser.email,
        state: stateName,
        interests: selectedInterests
      });
      setProfile(response.data);
      return response.data;
    } catch (err) {
      console.error("Profile preference update failed:", err);
      // Offline fallback state update
      setProfile(prev => ({
        ...prev,
        state: stateName,
        interests: selectedInterests
      }));
    }
  };

  // Trigger manual points increment (for rewards visualization)
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
    currentUser,
    profile,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfilePreferences,
    addMockPoints,
    syncProfile: () => currentUser && syncProfile(currentUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
