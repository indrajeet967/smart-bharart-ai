const express = require('express');
const router = express.Router();
const db = require('../config/db');
Object.defineProperty(global, 'isMock', { get: () => db.isMock, configurable: true });
Object.defineProperty(global, 'mockDb', { get: () => db.mockDb, configurable: true });
const User = require('../models/User');

// GET /api/notifications/:email
// Retrieve notifications filtered by user state and interests
router.get('/:email', async (req, res) => { 
  
  const { email } = req.params;

  try {
    let user = null;
    let notificationsList = [];

    // 1. Fetch user to check state/interests preferences
    if (isMock) {
      user = mockDb.findOne('users', { email });
      notificationsList = mockDb.find('notifications', {});
    } else {
      user = await User.findOne({ email });
      const db = require('mongoose').connection.db;
      notificationsList = await db.collection('notifications').find({}).toArray();
    }

    if (!user || (!user.state && (!user.interests || user.interests.length === 0))) {
      // If user profile is incomplete, return general/all notices
      return res.json(notificationsList);
    }

    const userState = user.state || 'All';
    const userInterests = user.interests || [];

    // 2. Filter notifications based on personalization
    const personalizedFeed = notificationsList.filter(item => {
      // Check state match
      const stateMatch = item.state === 'All' || item.state.toLowerCase() === userState.toLowerCase();

      // Check interests category match (if user has set interests)
      const interestMatch = userInterests.length === 0 || 
        userInterests.some(interest => item.category.toLowerCase() === interest.toLowerCase());

      return stateMatch && interestMatch;
    });

    res.json(personalizedFeed);
  } catch (err) {
    console.error("Personalized notifications feed error:", err);
    res.status(500).json({ error: 'Failed to retrieve notification feed' });
  }
});

module.exports = router;
