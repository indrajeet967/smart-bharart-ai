const express = require('express');
const router = express.Router();
const db = require('../config/db');
const User = require('../models/User');

// POST /api/auth/sync
// Sync user authentication state from frontend Firebase client to database
router.post('/sync', async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and Email are required for sync' });
  }

  try {
    let userData = null;

    if (db.isMock) {
      // JSON File Mock Database
      userData = db.mockDb.findOne('users', { email });
      if (!userData) {
        userData = {
          uid,
          email,
          displayName: displayName || 'Citizen of India',
          photoURL: photoURL || '',
          state: '',
          interests: [],
          rewardPoints: 0,
          badges: [],
          role: email.includes('admin') ? 'admin' : 'user', // auto-assign admin role for admin emails for testing
          createdAt: new Date().toISOString()
        };
        db.mockDb.insertOne('users', userData);
      }
    } else {
      // MongoDB
      userData = await User.findOne({ email });
      if (!userData) {
        userData = new User({
          uid,
          email,
          displayName: displayName || 'Citizen of India',
          photoURL: photoURL || '',
          state: '',
          interests: [],
          rewardPoints: 0,
          badges: [],
          role: email.includes('admin') ? 'admin' : 'user'
        });
        await userData.save();
      }
    }

    res.json(userData);
  } catch (err) {
    console.error("Auth sync error:", err);
    res.status(500).json({ error: 'Database synchronization failed' });
  }
});

// POST /api/auth/update
// Update profile preferences (state, interests)
router.post('/update', async (req, res) => {
  const { email, state, interests } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required to update profile' });
  }

  try {
    let updatedUser = null;

    if (db.isMock) {
      updatedUser = db.mockDb.updateOne('users', { email }, { state, interests });
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email },
        { $set: { state, interests } },
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

module.exports = router;
