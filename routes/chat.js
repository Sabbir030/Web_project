const express = require('express');
const router = express.Router();

// Mock AI Chat Endpoint
router.post('/', async (req, res) => {
  const { message } = req.body;
  
  // Simple keyword-based response logic for now (to be replaced with real AI later)
  let reply = "I'm not sure about that. Can you try asking about deliveries or bids?";
  
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    reply = "Hello there! How can I assist you with your parcel needs today?";
  } else if (lowerMsg.includes('track')) {
    reply = "To track a parcel, go to the 'Tracking' tab and enter your tracking ID.";
  } else if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
    reply = "Delivery costs depend on bids from couriers. You can set a maximum price cap when posting a delivery.";
  } else if (lowerMsg.includes('payment') || lowerMsg.includes('pay')) {
    reply = "We accept Bank Transfer, Mobile Financial Services (bkash/Nagad), and Cash on Delivery.";
  } else if (lowerMsg.includes('register') || lowerMsg.includes('signup')) {
    reply = "You can register as a Merchant to send parcels or as a Courier to deliver them. Click 'Register' at the top right.";
  }

  // Simulate network delay for realism
  setTimeout(() => {
    res.json({ reply });
  }, 500);
});

module.exports = router;
