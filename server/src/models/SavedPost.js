const mongoose = require('mongoose');

const SavedPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['twitter', 'reddit', 'linkedin'], required: true },
  postId: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SavedPost', SavedPostSchema);