const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/db');
const apiRoutes = require('./routes/api');

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
  app.listen(PORT, () => {
    console.log(`\n🚀 Dashboard running at http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api/stats`);
  });
});
