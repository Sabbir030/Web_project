const express = require('express');
const Delivery = require('../models/Delivery');
const Bid = require('../models/Bid');
const router = express.Router();

// List Deliveries
router.get('/', async (req, res) => {
  const { courierId, merchantId } = req.query;
  
  try {
    let query = {};
    if (courierId) {
      query.courier = courierId;
    }
    
    // For merchant filtering, it's a bit more complex with Mongoose since Bid is referenced.
    // We first find bids by merchant, then find deliveries for those bids.
    if (merchantId) {
      const bids = await Bid.find({ merchant: merchantId }).select('_id');
      const bidIds = bids.map(b => b._id);
      query.bid = { $in: bidIds };
    }

    const deliveries = await Delivery.find(query)
      .populate({
        path: 'bid',
        populate: { path: 'merchant', select: 'name' }
      })
      .populate('courier', 'name')
      .sort({ createdAt: -1 });

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Delivery Status (Courier)
router.patch('/:id/status', async (req, res) => {
  const deliveryId = req.params.id;
  const { status } = req.body;
  
  const validStatuses = ['Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updateData = { status };
    if (status === 'Picked Up') updateData.pickupTime = new Date();
    if (status === 'Delivered') updateData.deliveryTime = new Date();

    const delivery = await Delivery.findByIdAndUpdate(deliveryId, updateData, { new: true });
    
    if (status === 'Delivered') {
      await Bid.findByIdAndUpdate(delivery.bid, { status: 'Completed' });
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
