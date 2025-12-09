const express = require('express');
const Delivery = require('../models/Delivery');
const router = express.Router();

// Get Tracking Info (Public)
router.get('/:id', async (req, res) => {
  const trackingId = req.params.id;

  try {
    const delivery = await Delivery.findById(trackingId)
      .populate({
        path: 'bid',
        populate: { path: 'merchant', select: 'name' }
      })
      .populate('courier', 'name phone');

    if (!delivery) return res.status(404).json({ error: 'Tracking ID not found' });

    // Construct timeline
    const timeline = [];
    if (delivery.pickupTime) timeline.push({ time: delivery.pickupTime, status: 'Picked Up' });
    if (delivery.status === 'In Transit') timeline.push({ time: 'Now', status: 'In Transit' });
    if (delivery.deliveryTime) timeline.push({ time: delivery.deliveryTime, status: 'Delivered' });

    // Flatten structure for response
    const response = {
      id: delivery._id,
      status: delivery.status,
      pickup_time: delivery.pickupTime,
      delivery_time: delivery.deliveryTime,
      product_description: delivery.bid.productDescription,
      pickup_location: delivery.bid.pickupLocation,
      drop_location: delivery.bid.dropLocation,
      courier_name: delivery.courier.name,
      courier_phone: delivery.courier.phone,
      timeline
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
