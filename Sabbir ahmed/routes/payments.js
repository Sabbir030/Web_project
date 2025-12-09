const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const router = express.Router();

// Initiate Payment
router.post('/initiate', async (req, res) => {
  const { userId, amount, method, description } = req.body;

  if (!userId || !amount || !method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Record Transaction
    const transaction = await Transaction.create({
      user: userId,
      amount,
      type: 'Debit',
      method,
      description
    });

    // 2. Update User Balance (Deduct)
    await User.findByIdAndUpdate(userId, { $inc: { balance: -amount } });

    res.status(201).json({ id: transaction._id, message: 'Payment successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transaction History
router.get('/history', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
