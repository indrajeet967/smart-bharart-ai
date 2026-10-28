const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  citizenEmail: { type: String, required: true },
  submissionChannel: {
    type: String,
    enum: ['smart-bharat', 'external-government'],
    default: 'smart-bharat'
  },
  externalPortal: { type: String, default: '' },
  externalReference: { type: String, default: '' },
  externalTrackingUrl: { type: String, default: '' },
  description: { type: String, required: true },
  category: { type: String, required: true }, // 'Road Damage', 'Garbage', 'Water Leakage', 'Electricity', 'Street Light', 'Drainage', 'Other'
  priority: { type: String, required: true }, // 'Low', 'Medium', 'High'
  imageUrl: { type: String, default: '' },
  privatePublicId: { type: String, default: '' },
  imageFormat: { type: String, default: '' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },
  department: { type: String, default: 'Unassigned' },
  expectedResolution: { type: Date },
  timeline: [{
    status: { type: String },
    date: { type: Date, default: Date.now },
    note: { type: String }
  }],
  rewardsEarned: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
