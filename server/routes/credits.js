const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
    getPlayerById,
    updatePlayerBalance,
    getCreditHistoryByPlayer,
    getAllCreditHistory,
    addCreditEntry,
} = require('../services/dataStore');

const router = express.Router();

// GET all credit history
router.get('/', async (req, res) => {
    try {
        const history = await getAllCreditHistory();
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch credit history', details: err.message });
    }
});

// GET credit history for a player
router.get('/:playerId', async (req, res) => {
    try {
        const history = await getCreditHistoryByPlayer(req.params.playerId);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch credit history', details: err.message });
    }
});

// POST add credit to a player
router.post('/:playerId', async (req, res) => {
    try {
        const { amount, note } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

        const player = await getPlayerById(req.params.playerId);
        if (!player) return res.status(404).json({ error: 'Player not found' });

        const parsedAmount = parseFloat(amount);
        await updatePlayerBalance(req.params.playerId, parsedAmount);

        const entry = {
            id: uuidv4(),
            playerId: player.id,
            amount: parsedAmount,
            type: 'credit',
            note: note || 'Credit top-up',
            date: new Date().toISOString(),
        };

        await addCreditEntry(entry);

        const updatedPlayer = await getPlayerById(req.params.playerId);
        res.status(201).json({ player: updatedPlayer, entry });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add credit', details: err.message });
    }
});

module.exports = router;
