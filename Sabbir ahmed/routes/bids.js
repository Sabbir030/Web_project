const express = require('express');
const Bid = require('../models/Bid');
const Proposal = require('../models/Proposal');
const Delivery = require('../models/Delivery');
const router = express.Router();

// Create a Bid (Merchant)
router.post('/', async (req, res) => {
  const { merchantId, product, pickup, drop, maxPrice, expectedTime } = req.body;
  
  if (!merchantId || !product || !pickup || !drop) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const bid = await Bid.create({
      merchant: merchantId,
      productDescription: product,
      pickupLocation: pickup,
      dropLocation: drop,
      maxPrice,
      expectedTime
    });
    res.status(201).json({ id: bid._id, message: 'Bid created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Open Bids (Courier)
router.get('/', async (req, res) => {
  try {
    const bids = await Bid.find({ status: 'Open' })
      .populate('merchant', 'name')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List My Bids (Merchant)
router.get('/my-bids', async (req, res) => {
  const merchantId = req.query.merchantId;
  if (!merchantId) return res.status(400).json({ error: 'Merchant ID required' });

  try {
    const bids = await Bid.find({ merchant: merchantId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Proposal (Courier)
router.post('/:id/proposals', async (req, res) => {
  const bidId = req.params.id;
  const { courierId, price, eta } = req.body;

  if (!courierId || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const proposal = await Proposal.create({
      bid: bidId,
      courier: courierId,
      price,
      eta
    });
    res.status(201).json({ id: proposal._id, message: 'Proposal submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Proposals for a Bid (Merchant)
router.get('/:id/proposals', async (req, res) => {
  const bidId = req.params.id;
  try {
    const proposals = await Proposal.find({ bid: bidId })
      .populate('courier', 'name phone');
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept Proposal (Merchant) -> Creates Delivery
router.post('/proposals/:id/accept', async (req, res) => {
  const proposalId = req.params.id;

  try {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    // 1. Update Proposal Status
    proposal.status = 'Accepted';
    await proposal.save();
    
    // 2. Update Bid Status
    await Bid.findByIdAndUpdate(proposal.bid, { status: 'Assigned' });

    // 3. Create Delivery
    const delivery = await Delivery.create({
      bid: proposal.bid,
      courier: proposal.courier,
      status: 'Pending'
    });

    res.json({ message: 'Proposal accepted, delivery created', deliveryId: delivery._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
