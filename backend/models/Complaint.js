const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  citizenEmail: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // 'Road Damage', 'Garbage', 'Water Leakage', 'Electricity', 'Street Light', 'Drainage', 'Other'
  priority: { type: String, required: true }, // 'Low', 'Medium', 'High'
  imageUrl: { type: String, default: '' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, default: '' }
  },
  status: { type: String, default: 'Pending' }, // 'Pending', 'Assigned', 'In Progress', 'Resolved'
  department: { type: String, default: 'Municipal Corporation' },
  expectedResolution: { type: Date },
  timeline: [{
    status: { type: String },
    date: { type: Date, default: Date.now },
    note: { type: String }
  }],
  rewardsEarned: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
