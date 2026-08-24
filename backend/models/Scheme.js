const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'Agriculture', 'Healthcare', 'Education', 'Housing'
  state: { type: String, default: 'All' }, // 'All' or specific state name
  benefits: { type: String, required: true },
  eligibility: {
    ageMin: { type: Number, default: 0 },
    ageMax: { type: Number, default: 120 },
    gender: { type: String, default: 'All' }, // 'All', 'Male', 'Female', 'Other'
    incomeMax: { type: Number, default: 9999999 }, // Maximum annual income limit
    occupation: { type: [String], default: ['Any'] },
    category: { type: [String], default: ['All'] }, // 'General', 'OBC', 'SC', 'ST'
    disability: { type: Boolean, default: false }, // if true, specific to disabled citizens
    student: { type: Boolean, default: false } // if true, specific to students
  },
  applyUrl: { type: String, default: '#' }
}, { timestamps: true });

module.exports = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
