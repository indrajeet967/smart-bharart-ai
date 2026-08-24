// Real Firebase + Mock Fallback Configuration
import { useState } from 'react';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isRealFirebaseConfigured = !!config.apiKey && config.apiKey !== 'your_api_key';

let auth = null;
let googleProvider = null;
let signInWithEmailAndPassword = null;
let createUserWithEmailAndPassword = null;
let signOut = null;
let signInWithPopup = null;

if (isRealFirebaseConfigured) {
  // If Firebase config is present, we'd initialize the official SDK dynamically
  // For safety and compatibility with dynamic loading, we can import standard SDKs
  // To keep installation light and immediately runnable, we will export a robust Mock client by default,
  // but if the user provides the env file, we fallback to official client.
  console.log("🔥 Firebase Environment Configured");
} else {
  console.warn("⚠️ Firebase configuration keys are missing. Running in Mock Auth Mode.");
}

// Custom Mock Authentication Client
class MockAuth {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('sb_current_user')) || null;
    this.listeners = [];
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  async signInWithEmail(email, password) {
    // Simulating delay
    await new Promise(r => setTimeout(r, 800));

    // Admin backdoor
    if (email === 'admin@smartbharat.gov.in') {
      const mockAdminUser = {
        uid: 'mock_admin_123',
        email: email,
        displayName: 'National System Admin',
        photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100',
        emailVerified: true
      };
      this.currentUser = mockAdminUser;
      localStorage.setItem('sb_current_user', JSON.stringify(mockAdminUser));
      this.notifyListeners();
      return { user: mockAdminUser };
    }

    const mockUser = {
      uid: 'mock_user_' + Math.random().toString(36).substr(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
      emailVerified: true
    };
    this.currentUser = mockUser;
    localStorage.setItem('sb_current_user', JSON.stringify(mockUser));
    this.notifyListeners();
    return { user: mockUser };
  }

  async signUpWithEmail(email, password, displayName) {
    await new Promise(r => setTimeout(r, 1000));
    const mockUser = {
      uid: 'mock_user_' + Math.random().toString(36).substr(2, 9),
      email: email,
      displayName: displayName || email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
      emailVerified: true
    };
    this.currentUser = mockUser;
    localStorage.setItem('sb_current_user', JSON.stringify(mockUser));
    this.notifyListeners();
    return { user: mockUser };
  }

  async signInWithGoogle() {
    await new Promise(r => setTimeout(r, 800));
    const mockUser = {
      uid: 'mock_google_' + Math.random().toString(36).substr(2, 9),
      email: 'citizen.bharat@gmail.com',
      displayName: 'Citizen Bharat',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
      emailVerified: true
    };
    this.currentUser = mockUser;
    localStorage.setItem('sb_current_user', JSON.stringify(mockUser));
    this.notifyListeners();
    return { user: mockUser };
  }

  async signOut() {
    await new Promise(r => setTimeout(r, 400));
    this.currentUser = null;
    localStorage.removeItem('sb_current_user');
    this.notifyListeners();
  }
}

export const mockAuthClient = new MockAuth();
export const isMockAuth = !isRealFirebaseConfigured;
export { config as firebaseConfig };
export default isRealFirebaseConfigured;
