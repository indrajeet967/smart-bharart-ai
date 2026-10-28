const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const User = require('../models/User');
const { verifyToken, JWT_SECRET } = require('../middleware/authMiddleware');

// Helper to sanitize user output (exclude password)
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};

// POST /api/auth/register
// Register new citizen or admin
router.post('/register', async (req, res) => {
  const { email, password, displayName, state, interests, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let existingUser = null;

    if (db.isMock) {
      existingUser = db.mockDb.findOne('users', { email: normalizedEmail });
    } else {
      existingUser = await User.findOne({ email: normalizedEmail });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const assignedRole = (role === 'admin' || normalizedEmail.includes('admin')) ? 'admin' : 'user';
    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    const hashedPassword = await bcrypt.hash(password, 10);

    let savedUser = null;

    if (db.isMock) {
      const userDoc = {
        uid,
        email: normalizedEmail,
        password: hashedPassword,
        displayName: displayName || normalizedEmail.split('@')[0],
        phone: '',
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${normalizedEmail}`,
        state: state || 'Delhi',
        interests: interests || ['Healthcare', 'Services'],
        rewardPoints: 10, // Default welcome bonus points
        level: 1,
        badges: ['Civic Starter'],
        role: assignedRole,
        createdAt: new Date().toISOString()
      };
      savedUser = db.mockDb.insertOne('users', userDoc);
    } else {
      const newUser = new User({
        uid,
        email: normalizedEmail,
        password: password, // Pre-save hook hashes this
        displayName: displayName || normalizedEmail.split('@')[0],
        state: state || 'Delhi',
        interests: interests || ['Healthcare', 'Services'],
        rewardPoints: 10,
        level: 1,
        badges: ['Civic Starter'],
        role: assignedRole,
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${normalizedEmail}`
      });
      savedUser = await newUser.save();
    }

    const sanitized = sanitizeUser(savedUser);
    const token = jwt.sign(
      { id: sanitized._id || sanitized.uid, email: sanitized.email, role: sanitized.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: sanitized
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

// POST /api/auth/login
// Log in existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = null;

    if (db.isMock) {
      user = db.mockDb.findOne('users', { email: normalizedEmail });
    } else {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password
    let isMatch = false;
    if (user.comparePassword) {
      isMatch = await user.comparePassword(password);
    } else {
      // Mock DB comparison
      isMatch = await bcrypt.compare(password, user.password);
      // Fallback for legacy plain unhashed passwords in mock store
      if (!isMatch && user.password === password) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sanitized = sanitizeUser(user);
    const token = jwt.sign(
      { id: sanitized._id || sanitized.uid, email: sanitized.email, role: sanitized.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: sanitized
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// GET /api/auth/me
// Get current authenticated user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    let user = null;
    if (db.isMock) {
      user = db.mockDb.findOne('users', { email: req.user.email });
    } else {
      user = await User.findOne({ email: req.user.email });
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// POST /api/auth/update
// Update profile settings
router.post('/update', verifyToken, async (req, res) => {
  const { displayName, state, interests, phone } = req.body;

  try {
    let updatedUser = null;

    if (db.isMock) {
      updatedUser = db.mockDb.updateOne('users', { email: req.user.email }, {
        ...(displayName && { displayName }),
        ...(state && { state }),
        ...(interests && { interests }),
        ...(phone && { phone })
      });
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email: req.user.email },
        { $set: {
          ...(displayName && { displayName }),
          ...(state && { state }),
          ...(interests && { interests }),
          ...(phone && { phone })
        }},
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'Profile updated successfully', user: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// POST /api/auth/sync (Legacy Sync Helper)
router.post('/sync', async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and Email are required.' });
  }
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let userData = null;
    if (db.isMock) {
      userData = db.mockDb.findOne('users', { email: normalizedEmail });
      if (!userData) {
        userData = {
          uid,
          email: normalizedEmail,
          password: await bcrypt.hash('defaultPass123', 10),
          displayName: displayName || 'Citizen of India',
          photoURL: photoURL || '',
          state: 'Delhi',
          interests: ['Healthcare', 'Services'],
          rewardPoints: 10,
          level: 1,
          badges: ['Civic Starter'],
          role: normalizedEmail.includes('admin') ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        db.mockDb.insertOne('users', userData);
      }
    } else {
      userData = await User.findOne({ email: normalizedEmail });
      if (!userData) {
        userData = new User({
          uid,
          email: normalizedEmail,
          password: 'defaultPass123',
          displayName: displayName || 'Citizen of India',
          photoURL: photoURL || '',
          state: 'Delhi',
          interests: ['Healthcare', 'Services'],
          rewardPoints: 10,
          level: 1,
          badges: ['Civic Starter'],
          role: normalizedEmail.includes('admin') ? 'admin' : 'user'
        });
        await userData.save();
      }
    }

    const sanitized = sanitizeUser(userData);
    const token = jwt.sign(
      { id: sanitized._id || sanitized.uid, email: sanitized.email, role: sanitized.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, ...sanitized });
  } catch (err) {
    console.error('Auth sync error:', err);
    res.status(500).json({ error: 'Database synchronization failed.' });
  }
});

module.exports = router;
