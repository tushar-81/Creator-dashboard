const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['twitter', 'reddit', 'linkedin'], required: true },
  postId: { type: String, required: true },
  reason: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);