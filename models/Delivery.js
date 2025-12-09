const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'], default: 'Pending' },
  pickupTime: Date,
  deliveryTime: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Delivery', deliverySchema);
