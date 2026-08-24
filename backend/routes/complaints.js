const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenAI, GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
Object.defineProperty(global, 'isMock', { get: () => db.isMock, configurable: true });
Object.defineProperty(global, 'mockDb', { get: () => db.mockDb, configurable: true });
const { uploadImage } = require('../config/cloudinary');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to auto-detect category and priority using Gemini or Keyword Fallback
async function analyzeIssue(description, fileBuffer, mimeType) {
  const defaultAnalysis = {
    category: 'Other',
    priority: 'Medium',
    summary: description ? description.substring(0, 100) : 'No description provided.'
  };

  // Keyword rules-based fallback engine (highly robust)
  const runKeywordFallback = (desc = '') => {
    const text = desc.toLowerCase();
    let category = 'Other';
    let priority = 'Medium';
    let summary = desc || 'Civic issue report.';

    if (text.includes('garbage') || text.includes('trash') || text.includes('dump') || text.includes('waste') || text.includes('bin')) {
      category = 'Garbage';
      priority = 'Low';
    } else if (text.includes('pothole') || text.includes('road') || text.includes('crack') || text.includes('asphalt') || text.includes('highway')) {
      category = 'Road Damage';
      priority = text.includes('accident') || text.includes('huge') ? 'High' : 'Medium';
    } else if (text.includes('leak') || text.includes('water') || text.includes('pipe') || text.includes('overflow')) {
      category = 'Water Leakage';
      priority = 'Medium';
    } else if (text.includes('wire') || text.includes('electricity') || text.includes('spark') || text.includes('shock') || text.includes('power') || text.includes('current')) {
      category = 'Electricity';
      priority = 'High';
    } else if (text.includes('dark') || text.includes('street light') || text.includes('bulb') || text.includes('lamp') || text.includes('street-light')) {
      category = 'Street Light';
      priority = 'Low';
    } else if (text.includes('sewage') || text.includes('drain') || text.includes('gutter') || text.includes('stink') || text.includes('overflowing drain')) {
      category = 'Drainage';
      priority = 'Medium';
    }

    return { category, priority, summary };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY missing. Using keyword fallback for AI priority analysis.");
    return runKeywordFallback(description);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = `Analyze the description and/or image of this civic issue in India.
    1. Categorize it as one of: 'Road Damage', 'Garbage', 'Water Leakage', 'Electricity', 'Street Light', 'Drainage', 'Other'.
    2. Assign a priority: 'Low', 'Medium', or 'High' based on community hazard, safety, and scale.
    3. Generate a short department summary.
    
    Description: "${description || 'None'}"
    
    Provide your output strictly in JSON format. Do not use markdown wrappers like \`\`\`json. Return only the raw JSON. Example output:
    {
      "category": "Road Damage",
      "priority": "Medium",
      "summary": "Potholes reported in the main residential lane causing traffic slowdown."
    }`;

    let result;
    if (fileBuffer && mimeType) {
      // Multimodal request (image + description text)
      const imagePart = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      // Text-only request
      result = await model.generateContent([prompt]);
    }

    const text = result.response.text();
    // Parse the JSON (clean up JSON markdown blocks if any exist)
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Gemini AI analysis error:", err.message);
    return runKeywordFallback(description);
  }
}

// POST /api/complaints/report
// Handles reporting of a new public issue (multimodal, file upload, GPS location)
router.post('/report', upload.single('photo'), async (req, res) => {
  const { description, citizenEmail, lat, lng, address } = req.body;

  if (!description || !citizenEmail) {
    return res.status(400).json({ error: 'Description and citizen email are required' });
  }

  try {
    let imageUrl = '';
    // Handle image upload to Cloudinary/Disk if file present
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer, req.file.originalname);
    }

    // Call Gemini AI analysis
    const aiAnalysis = await analyzeIssue(
      description,
      req.file ? req.file.buffer : null,
      req.file ? req.file.mimetype : null
    );

    const complaintId = `SB-${Math.floor(100000 + Math.random() * 900000)}-${new Date().getFullYear()}`;
    const expectedRes = new Date();
    expectedRes.setDate(expectedRes.getDate() + 7); // 7 days expected SLA

    const locationObj = {
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      address: address || 'Location not tagged'
    };

    const initialTimeline = [
      { status: 'Pending', date: new Date(), note: 'Complaint logged on Smart Bharat portal.' }
    ];

    const complaintDetails = {
      complaintId,
      citizenEmail,
      description,
      category: aiAnalysis.category || 'Other',
      priority: aiAnalysis.priority || 'Medium',
      imageUrl,
      location: locationObj,
      status: 'Pending',
      department: `${aiAnalysis.category || 'Municipal'} Department`,
      expectedResolution: expectedRes,
      timeline: initialTimeline,
      rewardsEarned: 0
    };

    let savedComplaint = null;

    if (isMock) {
      savedComplaint = mockDb.insertOne('complaints', complaintDetails);
    } else {
      const dbComplaint = new Complaint(complaintDetails);
      savedComplaint = await dbComplaint.save();
    }

    res.json({
      success: true,
      message: 'Complaint reported successfully',
      complaint: savedComplaint
    });
  } catch (err) {
    console.error("Complaint reporting error:", err);
    res.status(500).json({ error: 'Failed to lodge complaint' });
  }
});

// GET /api/complaints/track/:id
// Track a single complaint by ID
router.get('/track/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let complaint = null;
    if (isMock) {
      complaint = mockDb.findOne('complaints', { complaintId: id });
    } else {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint ID not found' });
    }

    res.json(complaint);
  } catch (err) {
    console.error("Track complaint error:", err);
    res.status(500).json({ error: 'Failed to retrieve complaint' });
  }
});

// GET /api/complaints/user/:email
// Get all complaints filed by a specific user
router.get('/user/:email', async (req, res) => {
  const { email } = req.params;

  try {
    let complaintsList = [];
    if (isMock) {
      complaintsList = mockDb.find('complaints', { citizenEmail: email });
    } else {
      complaintsList = await Complaint.find({ citizenEmail: email }).sort({ createdAt: -1 });
    }
    res.json(complaintsList);
  } catch (err) {
    console.error("User complaints error:", err);
    res.status(500).json({ error: 'Failed to retrieve user complaints' });
  }
});

// GET /api/complaints/admin/all
// Admin panel endpoint to get all complaints
router.get('/admin/all', async (req, res) => {
  try {
    let allComplaints = [];
    if (isMock) {
      allComplaints = mockDb.find('complaints', {});
    } else {
      allComplaints = await Complaint.find({}).sort({ createdAt: -1 });
    }
    res.json(allComplaints);
  } catch (err) {
    console.error("Admin retrieve complaints error:", err);
    res.status(500).json({ error: 'Failed to retrieve admin complaints' });
  }
});

// POST /api/complaints/admin/update/:id
// Admin action to change status and timeline, rewarding points on resolution
router.post('/admin/update/:id', async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    let complaint = null;

    if (isMock) {
      complaint = mockDb.findOne('complaints', { complaintId: id });
    } else {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const updatedTimeline = [...complaint.timeline, { status, date: new Date(), note: note || `Status updated to ${status}` }];
    let rewardPointsToAward = 0;

    // Rewards calculation when status switches to "Resolved"
    if (status === 'Resolved' && complaint.status !== 'Resolved') {
      if (complaint.priority === 'High') rewardPointsToAward = 150;
      else if (complaint.priority === 'Medium') rewardPointsToAward = 100;
      else rewardPointsToAward = 50;
    }

    let updatedComplaint = null;

    if (isMock) {
      updatedComplaint = mockDb.updateOne('complaints', { complaintId: id }, {
        status,
        timeline: updatedTimeline,
        rewardsEarned: rewardPointsToAward > 0 ? rewardPointsToAward : complaint.rewardsEarned
      });

      // Update user points if resolved
      if (rewardPointsToAward > 0) {
        const citizenUser = mockDb.findOne('users', { email: complaint.citizenEmail });
        if (citizenUser) {
          const currentPoints = citizenUser.rewardPoints || 0;
          const newPoints = currentPoints + rewardPointsToAward;
          const currentBadges = citizenUser.badges || [];
          
          // Badge unlocks
          if (newPoints >= 300 && !currentBadges.includes('Civic Guardian')) {
            currentBadges.push('Civic Guardian');
          }
          if (newPoints >= 100 && !currentBadges.includes('Active Reporter')) {
            currentBadges.push('Active Reporter');
          }
          
          mockDb.updateOne('users', { email: complaint.citizenEmail }, {
            rewardPoints: newPoints,
            badges: currentBadges
          });
        }
      }
    } else {
      updatedComplaint = await Complaint.findOneAndUpdate(
        { complaintId: id },
        { 
          $set: { 
            status, 
            timeline: updatedTimeline,
            rewardsEarned: rewardPointsToAward > 0 ? rewardPointsToAward : complaint.rewardsEarned
          } 
        },
        { new: true }
      );

      // Update user points in MongoDB
      if (rewardPointsToAward > 0) {
        const citizenUser = await User.findOne({ email: complaint.citizenEmail });
        if (citizenUser) {
          citizenUser.rewardPoints = (citizenUser.rewardPoints || 0) + rewardPointsToAward;
          
          // Check badge unlocks
          if (citizenUser.rewardPoints >= 300 && !citizenUser.badges.includes('Civic Guardian')) {
            citizenUser.badges.push('Civic Guardian');
          }
          if (citizenUser.rewardPoints >= 100 && !citizenUser.badges.includes('Active Reporter')) {
            citizenUser.badges.push('Active Reporter');
          }
          
          await citizenUser.save();
        }
      }
    }

    res.json({
      success: true,
      message: `Complaint updated successfully. Status: ${status}`,
      complaint: updatedComplaint,
      pointsAwarded: rewardPointsToAward
    });
  } catch (err) {
    console.error("Admin update complaint error:", err);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

module.exports = router;
