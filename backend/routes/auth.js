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
  const { email, password, displayName, phone, state, interests } = req.body;

  if (!JWT_SECRET) {
    return res.status(503).json({ error: 'Authentication is not configured on this server.' });
  }
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_OTP !== 'true') {
    return res.status(503).json({ error: 'Account verification delivery is not configured. Signup is unavailable; existing users can still sign in.' });
  }

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
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

    const assignedRole = 'user';
    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    const hashedPassword = await bcrypt.hash(password, 10);

    let savedUser = null;

    if (db.isMock) {
      const userDoc = {
        uid,
        email: normalizedEmail,
        password: hashedPassword,
        displayName: displayName || normalizedEmail.split('@')[0],
        phone: phone || '',
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${normalizedEmail}`,
        state: state || '',
        isVerified: false,
        otp: null,
        otpExpires: null,
        otpAttempts: 0,
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
        phone: phone || '',
        state: state || '',
        isVerified: false,
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
    res.status(201).json({
      message: 'Account created. Verify your account before signing in.',
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

  if (!JWT_SECRET) {
    return res.status(503).json({ error: 'Authentication is not configured on this server.' });
  }

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
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
    if (user.isVerified === false) {
      return res.status(403).json({ error: 'Verify your account before signing in.' });
    }

    // Compare password safely
    let isMatch = false;
    try {
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(password);
      } else if (user.password && typeof user.password === 'string') {
        isMatch = await bcrypt.compare(password, user.password);
      }
    } catch (passErr) {
      console.warn("Password comparison fallback handled:", passErr.message);
      isMatch = false;
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
  const { displayName, state, interests, phone, preferredLocation } = req.body;

  if (preferredLocation !== undefined) {
    const { lat, lng } = preferredLocation || {};
    if (
      preferredLocation !== null &&
      (typeof preferredLocation !== 'object' ||
        (lat !== null && lat !== undefined && !Number.isFinite(Number(lat))) ||
        (lng !== null && lng !== undefined && !Number.isFinite(Number(lng))) ||
        (lat !== null && lat !== undefined && (Number(lat) < -90 || Number(lat) > 90)) ||
        (lng !== null && lng !== undefined && (Number(lng) < -180 || Number(lng) > 180))
      )
    ) {
      return res.status(400).json({ error: 'Preferred location details are invalid.' });
    }
  }

  try {
    let updatedUser = null;

    if (db.isMock) {
      updatedUser = db.mockDb.updateOne('users', { email: req.user.email }, {
        ...(displayName && { displayName }),
        ...(state && { state }),
        ...(interests && { interests }),
        ...(phone && { phone }),
        ...(preferredLocation !== undefined && { preferredLocation })
      });
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email: req.user.email },
        { $set: {
          ...(displayName && { displayName }),
          ...(state && { state }),
          ...(interests && { interests }),
          ...(phone && { phone }),
          ...(preferredLocation !== undefined && { preferredLocation })
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
  res.status(501).json({
    error: 'Third-party sign-in is unavailable until an authorized identity-provider integration is configured.'
  });
});

// POST /api/auth/send-otp
// Generate and issue 6-digit OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required to send OTP.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_OTP !== 'true') {
      return res.status(503).json({ error: 'Email verification delivery is not configured.' });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    let updatedUser = null;
    if (db.isMock) {
      const user = db.mockDb.findOne('users', { email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }
      updatedUser = db.mockDb.updateOne('users', { email: normalizedEmail }, {
        otp: generatedOtp,
        otpExpires: otpExpires.toISOString(),
        otpAttempts: 0
      });
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { otp: generatedOtp, otpExpires, otpAttempts: 0 } }
      );
    }
    if (!updatedUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    res.json({
      success: true,
      message: 'Development verification code generated; no email was sent. (Valid for 10 minutes)',
      demoOtp: generatedOtp
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to generate OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp
// Verify 6-digit OTP code
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (typeof email !== 'string' || !email.trim() || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
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
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Check attempts limit (max 5)
    if ((user.otpAttempts || 0) >= 5) {
      return res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP.' });
    }

    // Check OTP expiry
    if (!user.otpExpires || new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({ error: 'Your OTP has expired. Please click Resend OTP.' });
    }

    if (user.otp !== otp.trim()) {
      const updatedAttempts = (user.otpAttempts || 0) + 1;
      if (db.isMock) {
        db.mockDb.updateOne('users', { email: normalizedEmail }, { otpAttempts: updatedAttempts });
      } else {
        await User.findOneAndUpdate({ email: normalizedEmail }, { $inc: { otpAttempts: 1 } });
      }
      return res.status(400).json({ error: `Invalid OTP code. ${5 - updatedAttempts} attempts remaining.` });
    }

    // Mark user as verified
    let updatedUser = null;
    if (db.isMock) {
      updatedUser = db.mockDb.updateOne('users', { email: normalizedEmail }, {
        isVerified: true,
        otp: null,
        otpExpires: null,
        otpAttempts: 0
      });
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { isVerified: true, otp: null, otpExpires: null, otpAttempts: 0 } },
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User account could not be updated.' });
    }
    const sanitized = sanitizeUser(updatedUser);
    const token = jwt.sign(
      { id: sanitized._id || sanitized.uid, email: sanitized.email, role: sanitized.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: sanitized
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_OTP !== 'true') {
      return res.status(503).json({ error: 'Email verification delivery is not configured.' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let updatedUser = null;
    if (db.isMock) {
      updatedUser = db.mockDb.updateOne('users', { email: normalizedEmail }, {
        otp: newOtp,
        otpExpires: otpExpires.toISOString(),
        otpAttempts: 0
      });
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { otp: newOtp, otpExpires, otpAttempts: 0 } }
      );
    }
    if (!updatedUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    res.json({
      success: true,
      message: 'New development verification code generated; no email was sent.',
      demoOtp: newOtp
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend OTP.' });
  }
});

module.exports = router;
