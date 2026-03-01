require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const playerRoutes = require('./routes/players');
const creditRoutes = require('./routes/credits');
const sessionRoutes = require('./routes/sessions');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🏸 Badminton Tracker API running on http://localhost:${PORT}`);
});
