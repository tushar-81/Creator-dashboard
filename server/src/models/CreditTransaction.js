const mongoose = require('mongoose');

const CreditTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['login', 'profile', 'interact', 'admin'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CreditTransaction', CreditTransactionSchema);