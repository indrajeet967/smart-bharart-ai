const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
Object.defineProperty(global, 'isMock', { get: () => db.isMock, configurable: true });
Object.defineProperty(global, 'mockDb', { get: () => db.mockDb, configurable: true });
const {
  uploadPrivateDocument,
  getPrivateDocumentUrl,
  deletePrivateDocument,
  isCloudinaryConfigured
} = require('../config/cloudinary');
const { verifyToken } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Only PDF, JPEG, PNG, and WebP files are allowed.'));
    }
    callback(null, true);
  }
});

// Map docTypes to categories
const getCategoryForDocType = (docType) => {
  const dt = (docType || '').toLowerCase();
  if (dt.includes('aadhaar') || dt.includes('pan') || dt.includes('voter') || dt.includes('passport') || dt.includes('licence') || dt.includes('identity')) {
    return 'Identity';
  }
  if (dt.includes('degree') || dt.includes('mark') || dt.includes('10th') || dt.includes('12th') || dt.includes('education')) {
    return 'Education';
  }
  if (dt.includes('birth') || dt.includes('caste') || dt.includes('income') || dt.includes('certificate')) {
    return 'Certificates';
  }
  if (dt.includes('scheme') || dt.includes('ration') || dt.includes('pension') || dt.includes('government')) {
    return 'Government';
  }
  return 'Other';
};

// POST /api/documents/upload
// Store a private document in the Smart Bharat vault.
router.post('/upload', verifyToken, upload.single('documentFile'), async (req, res) => {
  const email = req.user.email;
  const docType = req.body.docType || 'Identity Document';
  const category = req.body.category || getCategoryForDocType(docType);

  if (!req.file) {
    return res.status(400).json({ error: 'No document file attached.' });
  }

  if (!isCloudinaryConfigured) {
    return res.status(503).json({ error: 'Private document storage is not configured. No file was uploaded.' });
  }

  try {
    const fileName = req.file.originalname;
    const { publicId, format } = await uploadPrivateDocument(req.file.buffer, fileName);

    const documentRecord = {
      email,
      docType,
      category,
      fileName,
      fileUrl: '',
      privatePublicId: publicId,
      fileFormat: format,
      fileType: req.file.mimetype,
      fileSize: (req.file.size / 1024).toFixed(1) + ' KB',
      verificationStatus: 'Not verified',
      details: {},
      uploadedAt: new Date().toISOString()
    };

    let savedDoc = null;
    if (db.isMock) {
      savedDoc = db.mockDb.insertOne('documents', documentRecord);
    } else {
      const mongoose = require('mongoose');
      const resDb = await mongoose.connection.db.collection('documents').insertOne(documentRecord);
      savedDoc = { ...documentRecord, _id: resDb.insertedId };
    }

    const responseDocument = {
      ...(savedDoc.toObject ? savedDoc.toObject() : savedDoc),
      fileUrl: getPrivateDocumentUrl(publicId, format)
    };

    res.status(201).json({
      success: true,
      message: 'Stored in the private Smart Bharat vault. This is not an official DigiLocker integration and the document authenticity has not been verified.',
      document: responseDocument
    });
  } catch (err) {
    console.error("Locker upload error:", err);
    res.status(500).json({ error: 'Failed to save document to the Smart Bharat vault.' });
  }
});

// GET /api/documents/user/:email
// Retrieve authenticated user's documents
router.get('/user/:email', verifyToken, async (req, res) => {
  const targetEmail = req.params.email;

  if (req.user && req.user.role !== 'admin' && req.user.email !== targetEmail) {
    return res.status(403).json({ error: 'Forbidden. You can only access your own DigiLocker documents.' });
  }

  try {
    let userDocs = [];
    if (db.isMock) {
      userDocs = db.mockDb.find('documents', { email: req.user.role === 'admin' ? targetEmail : req.user.email });
    } else {
      const mongoose = require('mongoose');
      userDocs = await mongoose.connection.db.collection('documents')
        .find({ email: req.user.role === 'admin' ? targetEmail : req.user.email })
        .toArray();
    }
    res.json(userDocs.map((doc) => ({
      ...doc,
      fileUrl: doc.privatePublicId
        ? getPrivateDocumentUrl(doc.privatePublicId, doc.fileFormat || '')
        : ''
    })));
  } catch (err) {
    console.error("Fetch user docs error:", err);
    res.status(500).json({ error: 'Failed to retrieve locker documents.' });
  }
});

// DELETE /api/documents/:id
// Delete document with ownership authorization check
router.delete('/:id', verifyToken, async (req, res) => {
  const docId = req.params.id;
  const userEmail = req.user.email;

  try {
    let doc = null;
    if (db.isMock) {
      doc = db.mockDb.findOne('documents', { _id: docId });
    } else {
      const mongoose = require('mongoose');
      const { ObjectId } = require('mongodb');
      try {
        doc = await mongoose.connection.db.collection('documents').findOne({ _id: new ObjectId(docId) });
      } catch (e) {
        doc = await mongoose.connection.db.collection('documents').findOne({ _id: docId });
      }
    }

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Ownership check
    if (req.user.role !== 'admin' && doc.email !== userEmail) {
      return res.status(403).json({ error: 'Forbidden. You can only delete your own documents.' });
    }

    if (doc.privatePublicId) {
      await deletePrivateDocument(doc.privatePublicId);
    }

    if (db.isMock) {
      db.mockDb.deleteMany('documents', { _id: docId });
    } else {
      const mongoose = require('mongoose');
      const { ObjectId } = require('mongodb');
      try {
        await mongoose.connection.db.collection('documents').deleteOne({ _id: new ObjectId(docId) });
      } catch (e) {
        await mongoose.connection.db.collection('documents').deleteOne({ _id: docId });
      }
    }

    res.json({ success: true, message: 'Document deleted from your Smart Bharat vault.' });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// POST /api/documents/simplify
// Simplify legal language
router.post('/simplify', verifyToken, async (req, res) => {
  const { legalText } = req.body;

  if (typeof legalText !== 'string' || !legalText.trim() || legalText.length > 30000) {
    return res.status(400).json({ error: 'Legal text between 1 and 30000 characters is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'The legal simplification service is not configured.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Explain the supplied legal text in plain language. This is informational, not legal advice.
    Use only the text provided. Do not invent obligations, penalties, fees, dates, or next steps; explicitly say when the text does not state them.

    "${legalText}"

    Provide output with:
    - **What this means in plain language**
    - **Key Obligations**
    - **Penalties / Fine Details**
    - **Next Action Steps**`;

    const result = await model.generateContent([prompt]);
    res.json({ simplifiedText: result.response.text() });
  } catch (err) {
    console.error("Legal simplifier error:", err);
    res.status(500).json({ error: 'Failed to simplify legal document.' });
  }
});

module.exports = router;
