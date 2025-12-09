const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const connectDB = require('./database');

const app = express();
const PORT = process.env.PORT || 9090;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, 'client')));

// Default route to serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'home.html'));
});

// Routes
const authRoutes = require('./routes/auth');
const bidsRoutes = require('./routes/bids');
const deliveriesRoutes = require('./routes/deliveries');
const paymentsRoutes = require('./routes/payments');
const trackingRoutes = require('./routes/tracking');

app.use('/api/auth', authRoutes);
app.use('/api/bids', bidsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tracking', trackingRoutes);

// Only run the server if this file is run directly (not imported as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
