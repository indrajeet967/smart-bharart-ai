const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  displayName: { type: String, default: 'Citizen of India', trim: true },
  phone: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  state: { type: String, default: '' },
  preferredLocation: {
    type: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      district: { type: String, default: '' },
      pincode: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      displayName: { type: String, default: '' }
    },
    default: undefined
  },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  interests: { type: [String], default: [] },
  rewardPoints: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: { type: [String], default: [] },
  role: { type: String, default: 'user', enum: ['user', 'admin'] }
}, { timestamps: true });

// Hash password before saving if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (e) {
    return false;
  }
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
