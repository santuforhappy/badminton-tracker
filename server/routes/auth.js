const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// PINs from environment variables with defaults
const ADMIN_PIN = process.env.ADMIN_PIN || 'bolt2024';
const VIEWER_PIN = process.env.VIEWER_PIN || 'view123';

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Store tokens with their roles
const validTokens = new Map(); // token -> { role, createdAt }

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { pin } = req.body;

    if (!pin) {
        return res.status(400).json({ error: 'PIN is required' });
    }

    let role = null;
    if (pin === ADMIN_PIN) {
        role = 'admin';
    } else if (pin === VIEWER_PIN) {
        role = 'viewer';
    }

    if (role) {
        const token = generateToken();
        validTokens.set(token, { role, createdAt: Date.now() });
        res.json({ success: true, token, role });
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
    const session = validTokens.get(token);

    if (session) {
        res.json({ valid: true, role: session.role });
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
