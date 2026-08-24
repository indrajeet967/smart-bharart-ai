const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  email: { type: String, required: true },
  messages: [{
    sender: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);
