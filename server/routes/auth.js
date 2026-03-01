const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// The PIN is stored as an environment variable (set in .env or Vercel dashboard)
// Default PIN is "1234" if not configured
const APP_PIN = process.env.APP_PIN || '1234';

// Simple token generation
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// In-memory token store (resets on server restart — fine for this use case)
const validTokens = new Set();

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { pin } = req.body;

    if (!pin) {
        return res.status(400).json({ error: 'PIN is required' });
    }

    if (pin === APP_PIN) {
        const token = generateToken();
        validTokens.add(token);
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Invalid PIN. Please try again.' });
    }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (validTokens.has(token)) {
        res.json({ valid: true });
    } else {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        validTokens.delete(token);
    }
    res.json({ success: true });
});

module.exports = router;
