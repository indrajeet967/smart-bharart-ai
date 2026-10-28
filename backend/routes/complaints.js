const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
Object.defineProperty(global, 'isMock', { get: () => db.isMock, configurable: true });
Object.defineProperty(global, 'mockDb', { get: () => db.mockDb, configurable: true });
const {
  uploadPrivateEvidence,
  getPrivateEvidenceUrl,
  deletePrivateEvidence,
  isCloudinaryConfigured
} = require('../config/cloudinary');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

const serializeComplaint = (complaint) => {
  const record = complaint.toObject ? complaint.toObject() : { ...complaint };
  const imageUrl = record.privatePublicId
    ? getPrivateEvidenceUrl(record.privatePublicId, record.imageFormat || '')
    : record.imageUrl || '';
  delete record.privatePublicId;
  delete record.imageFormat;
  return { ...record, imageUrl };
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Evidence must be a JPEG, PNG, or WebP image.'));
    }
    callback(null, true);
  }
});

// Helper function to auto-detect category and priority using Gemini or Keyword Fallback
async function analyzeIssue(description, categorySelected, fileBuffer, mimeType) {
  const runKeywordFallback = (desc = '', cat = '') => {
    let category = cat || 'Other';
    let priority = 'Medium';
    const text = desc.toLowerCase();

    if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('dump')) {
      category = 'Garbage';
      priority = 'Low';
    } else if (text.includes('pothole') || text.includes('road') || text.includes('crack') || text.includes('highway')) {
      category = 'Road/Pothole';
      priority = text.includes('accident') || text.includes('huge') ? 'High' : 'Medium';
    } else if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('supply')) {
      category = 'Water Supply';
      priority = 'Medium';
    } else if (text.includes('wire') || text.includes('electricity') || text.includes('spark') || text.includes('power')) {
      category = 'Electricity';
      priority = 'High';
    } else if (text.includes('dark') || text.includes('street light') || text.includes('lamp') || text.includes('bulb')) {
      category = 'Street Light';
      priority = 'Low';
    } else if (text.includes('sewage') || text.includes('drain') || text.includes('drainage')) {
      category = 'Drainage';
      priority = 'Medium';
    }

    return { category, priority, summary: desc || 'Civic issue report.' };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return runKeywordFallback(description, categorySelected);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = `Analyze the description and/or image of this civic issue in India.
    Selected Category: "${categorySelected || 'Auto'}"
    Description: "${description || 'None'}"

    1. Categorize it strictly as one of: 'Road/Pothole', 'Garbage', 'Water Supply', 'Electricity', 'Street Light', 'Drainage', 'Public Infrastructure', 'Other'.
    2. Assign priority: 'Low', 'Medium', or 'High' based on hazard, safety, and scale.
    3. Generate a short department summary.

    Return output strictly in JSON format without markdown wrapping:
    {
      "category": "Road/Pothole",
      "priority": "Medium",
      "summary": "Potholes reported causing traffic issues."
    }`;

    let result;
    if (fileBuffer && mimeType) {
      const imagePart = {
        inlineData: { data: fileBuffer.toString('base64'), mimeType: mimeType }
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent([prompt]);
    }

    const text = result.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Gemini AI analysis error:", err.message);
    return runKeywordFallback(description, categorySelected);
  }
}

// Helper to award points and log notification
async function rewardAndNotifyUser(email, points, notifTitle, notifContent) {
  try {
    if (db.isMock) {
      const u = db.mockDb.findOne('users', { email });
      if (u) {
        const newPts = (u.rewardPoints || 0) + points;
        const badges = u.badges || [];
        if (newPts >= 100 && !badges.includes('Active Reporter')) badges.push('Active Reporter');
        if (newPts >= 300 && !badges.includes('Civic Guardian')) badges.push('Civic Guardian');
        db.mockDb.updateOne('users', { email }, { rewardPoints: newPts, badges });
      }
      db.mockDb.insertOne('notifications', {
        title: notifTitle,
        content: notifContent,
        email,
        state: 'All',
        category: 'Services',
        read: false,
        date: new Date().toISOString()
      });
    } else {
      const u = await User.findOne({ email });
      if (u) {
        u.rewardPoints = (u.rewardPoints || 0) + points;
        if (u.rewardPoints >= 100 && !u.badges.includes('Active Reporter')) u.badges.push('Active Reporter');
        if (u.rewardPoints >= 300 && !u.badges.includes('Civic Guardian')) u.badges.push('Civic Guardian');
        await u.save();
      }
      const mongoose = require('mongoose');
      await mongoose.connection.db.collection('notifications').insertOne({
        title: notifTitle,
        content: notifContent,
        email,
        state: 'All',
        category: 'Services',
        read: false,
        date: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error("Error rewarding/notifying user:", e);
  }
}

// POST /api/complaints/report
// Lodge a new complaint
router.post('/report', verifyToken, upload.single('photo'), async (req, res) => {
  const { description, category, lat, lng, address } = req.body;
  const email = req.user.email;

  if (typeof description !== 'string' || !description.trim() || description.length > 5000) {
    return res.status(400).json({ error: 'A description between 1 and 5000 characters is required.' });
  }
  if ((lat !== undefined && lat !== '' && (!Number.isFinite(Number(lat)) || Number(lat) < -90 || Number(lat) > 90)) ||
      (lng !== undefined && lng !== '' && (!Number.isFinite(Number(lng)) || Number(lng) < -180 || Number(lng) > 180))) {
    return res.status(400).json({ error: 'Location coordinates must be valid numbers.' });
  }
  if (req.file && !isCloudinaryConfigured) {
    return res.status(503).json({ error: 'Private evidence storage is not configured. No complaint was submitted.' });
  }

  let uploadedEvidence = null;
  try {
    if (req.file) {
      uploadedEvidence = await uploadPrivateEvidence(req.file.buffer, req.file.originalname);
    }

    const aiAnalysis = await analyzeIssue(
      description,
      category,
      req.file ? req.file.buffer : null,
      req.file ? req.file.mimetype : null
    );

    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const complaintId = `SB-${year}-${randomNum}`;
    const initialTimeline = [
      { status: 'Submitted', date: new Date(), note: 'Complaint received by Smart Bharat.' }
    ];

    const complaintDetails = {
      complaintId,
      citizenEmail: email,
      submissionChannel: 'smart-bharat',
      description,
      category: aiAnalysis.category || category || 'Other',
      priority: aiAnalysis.priority || 'Medium',
      imageUrl: '',
      privatePublicId: uploadedEvidence?.publicId || '',
      imageFormat: uploadedEvidence?.format || '',
      location: {
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        address: address || 'Location not tagged'
      },
      status: 'Submitted',
      department: 'Unassigned',
      timeline: initialTimeline,
      rewardsEarned: 20
    };

    let savedComplaint = null;
    if (db.isMock) {
      savedComplaint = db.mockDb.insertOne('complaints', complaintDetails);
    } else {
      const dbComplaint = new Complaint(complaintDetails);
      savedComplaint = await dbComplaint.save();
    }

    // Award +20 Civic Points & Notification
    await rewardAndNotifyUser(
      email,
      20,
      `Complaint Registered (${complaintId})`,
      `Your complaint ${complaintId} (${complaintDetails.category}) has been registered. You earned +20 Civic Points!`
    );

    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      complaint: serializeComplaint(savedComplaint),
      pointsAwarded: 20
    });
  } catch (err) {
    if (uploadedEvidence?.publicId) {
      try {
        await deletePrivateEvidence(uploadedEvidence.publicId);
      } catch (cleanupError) {
        console.error('Failed to clean up private evidence after complaint failure:', cleanupError);
      }
    }
    console.error("Complaint reporting error:", err);
    res.status(500).json({ error: 'Failed to lodge complaint' });
  }
});

// GET /api/complaints/track/:id
// Complaint identifiers are private account data, so only the owner or an admin may view them.
router.get('/track/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    let complaint = null;
    if (db.isMock) {
      complaint = db.mockDb.findOne('complaints', { complaintId: id });
    } else {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint ID not found.' });
    }
    if (req.user.role !== 'admin' && complaint.citizenEmail !== req.user.email) {
      return res.status(404).json({ error: 'Complaint ID not found.' });
    }

    res.json(serializeComplaint(complaint));
  } catch (err) {
    console.error("Track complaint error:", err);
    res.status(500).json({ error: 'Failed to retrieve complaint details.' });
  }
});

// GET /api/complaints/user/:email
// Get user's own complaints
router.get('/user/:email', verifyToken, async (req, res) => {
  const { email } = req.params;
  if (req.user.role !== 'admin' && email.toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: 'You can only view your own complaints.' });
  }

  try {
    let complaintsList = [];
    if (db.isMock) {
      complaintsList = db.mockDb.find('complaints', { citizenEmail: email });
    } else {
      complaintsList = await Complaint.find({ citizenEmail: email }).sort({ createdAt: -1 });
    }
    res.json(complaintsList.map(serializeComplaint));
  } catch (err) {
    console.error("User complaints error:", err);
    res.status(500).json({ error: 'Failed to retrieve user complaints.' });
  }
});

// GET /api/complaints/admin/all
// Admin view all complaints
router.get('/admin/all', verifyToken, adminOnly, async (req, res) => {
  try {
    let allComplaints = [];
    if (db.isMock) {
      allComplaints = db.mockDb.find('complaints', {});
    } else {
      allComplaints = await Complaint.find({}).sort({ createdAt: -1 });
    }
    res.json(allComplaints.map(serializeComplaint));
  } catch (err) {
    console.error("Admin complaints error:", err);
    res.status(500).json({ error: 'Failed to retrieve admin complaints list.' });
  }
});

// POST /api/complaints/admin/update/:id
// Admin update status (Submitted -> Registered -> Assigned -> In Progress -> Resolved -> Closed)
router.post('/admin/update/:id', verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, note, department } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    let complaint = null;
    if (db.isMock) {
      complaint = db.mockDb.findOne('complaints', { complaintId: id });
    } else {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const updatedTimeline = [
      ...complaint.timeline,
      { status, date: new Date(), note: note || `Status updated to ${status}` }
    ];

    let rewardPointsToAward = 0;
    if (status === 'Resolved' && complaint.status !== 'Resolved') {
      rewardPointsToAward = complaint.priority === 'High' ? 150 : complaint.priority === 'Medium' ? 100 : 50;
    }

    let updatedComplaint = null;
    if (db.isMock) {
      updatedComplaint = db.mockDb.updateOne('complaints', { complaintId: id }, {
        status,
        ...(department && { department }),
        timeline: updatedTimeline,
        rewardsEarned: (complaint.rewardsEarned || 0) + rewardPointsToAward
      });
    } else {
      updatedComplaint = await Complaint.findOneAndUpdate(
        { complaintId: id },
        {
          $set: {
            status,
            ...(department && { department }),
            timeline: updatedTimeline,
            rewardsEarned: (complaint.rewardsEarned || 0) + rewardPointsToAward
          }
        },
        { new: true }
      );
    }

    // Award points & notify user on status change
    if (rewardPointsToAward > 0) {
      await rewardAndNotifyUser(
        complaint.citizenEmail,
        rewardPointsToAward,
        `Complaint Resolved! (${id})`,
        `Your complaint ${id} has been marked as Resolved. You earned +${rewardPointsToAward} Civic Points!`
      );
    } else {
      await rewardAndNotifyUser(
        complaint.citizenEmail,
        0,
        `Complaint Update (${id})`,
        `Your Smart Bharat record ${id} status updated to "${status}". Note: ${note || 'Status updated by a Smart Bharat administrator.'}`
      );
    }

    res.json({
      success: true,
      message: `Complaint status updated to ${status}`,
      complaint: serializeComplaint(updatedComplaint),
      pointsAwarded: rewardPointsToAward
    });
  } catch (err) {
    console.error("Admin update error:", err);
    res.status(500).json({ error: 'Failed to update complaint status.' });
  }
});

// DELETE /api/complaints/:id
// Delete a complaint from Smart Bharat account (with ownership check)
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email;

  try {
    let complaint = null;
    if (db.isMock) {
      complaint = db.mockDb.findOne('complaints', { complaintId: id });
    } else {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Ownership check: must match citizenEmail or admin
    if (req.user.role !== 'admin' && complaint.citizenEmail !== userEmail) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (complaint.privatePublicId) {
      await deletePrivateEvidence(complaint.privatePublicId);
    }

    if (db.isMock) {
      db.mockDb.deleteMany('complaints', { complaintId: id });
    } else {
      await Complaint.deleteOne({ complaintId: id });
    }

    res.json({
      success: true,
      message: `Complaint ${id} deleted from your Smart Bharat dashboard. Note: If this complaint was submitted to an official government portal, deleting it here does not cancel the official government grievance log.`
    });
  } catch (err) {
    console.error("Delete complaint error:", err);
    res.status(500).json({ error: 'Failed to delete complaint record.' });
  }
});

module.exports = router;
