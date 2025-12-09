const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productDescription: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  dropLocation: { type: String, required: true },
  maxPrice: Number,
  expectedTime: Date,
  status: { type: String, enum: ['Open', 'Assigned', 'Completed', 'Cancelled'], default: 'Open' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bid', bidSchema);
