const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const SECRET_KEY = 'parcel-nexus-secret-key';

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 8);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address
    });

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: '24h',
    });

    res.status(201).json({ auth: true, token: token, user: { id: user._id, name, email, role, balance: 0 } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ auth: false, token: null, error: 'Invalid password' });

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: '24h',
    });

    res.status(200).json({ auth: true, token: token, user: { id: user._id, name: user.name, email: user.email, role: user.role, balance: user.balance } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Me
router.get('/me', (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });

    try {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

module.exports = router;
