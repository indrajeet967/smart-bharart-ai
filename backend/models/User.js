const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, default: 'Citizen of India' },
  photoURL: { type: String, default: '' },
  state: { type: String, default: '' },
  interests: { type: [String], default: [] },
  rewardPoints: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  role: { type: String, default: 'user' } // 'user' or 'admin'
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
