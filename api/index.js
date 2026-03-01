const express = require('express');
const cors = require('cors');

// Set up env vars (Vercel injects process.env from dashboard)
const playerRoutes = require('../server/routes/players');
const creditRoutes = require('../server/routes/credits');
const sessionRoutes = require('../server/routes/sessions');
const reportRoutes = require('../server/routes/reports');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/players', playerRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
