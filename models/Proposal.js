const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  eta: String,
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proposal', proposalSchema);
