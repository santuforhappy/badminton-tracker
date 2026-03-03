const express = require('express');
const cors = require('cors');

const playerRoutes = require('../server/routes/players');
const creditRoutes = require('../server/routes/credits');
const sessionRoutes = require('../server/routes/sessions');
const reportRoutes = require('../server/routes/reports');
const authRoutes = require('../server/routes/auth');
const barrelRoutes = require('../server/routes/barrels');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/barrels', barrelRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
