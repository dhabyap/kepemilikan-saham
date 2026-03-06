require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/db');
const apiRoutes = require('./routes/api');
const PriceSyncService = require('./services/PriceSyncService');

const app = express();
const PORT = 3004;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', apiRoutes);

// Database Initialization & Server Start
initDatabase().then(() => {
  // Start the background price syncer (every 5-15 minutes)
  PriceSyncService.startAutoSync(15);

  app.listen(PORT, () => {
    console.log(`\n🚀 Dashboard running at http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api/stats`);
  });
});
