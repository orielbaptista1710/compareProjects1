const mongoose = require('mongoose');

const devpasswordResetLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  role: String,
  action: { type: String, default: 'password_reset' },
  timestamp: { type: Date, default: Date.now },
  ip: String,
  status: { type: String, enum: ['success', 'failed'], default: 'success' }
});

module.exports = mongoose.model('DevPasswordResetLog', devpasswordResetLogSchema);
 