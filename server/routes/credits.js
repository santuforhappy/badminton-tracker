const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
    getPlayerById,
    updatePlayerBalance,
    getCreditHistoryByPlayer,
    getAllCreditHistory,
    addCreditEntry,
    getCreditEntryById,
    updateCreditEntry: dbUpdateCreditEntry,
    deleteCreditEntry: dbDeleteCreditEntry,
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

// PUT edit a credit entry (adjusts player balance accordingly)
router.put('/entry/:entryId', async (req, res) => {
    try {
        const entry = await getCreditEntryById(req.params.entryId);
        if (!entry) return res.status(404).json({ error: 'Credit entry not found' });

        const { amount, note } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

        const newAmount = parseFloat(amount);
        const oldAmount = entry.amount;

        // Reverse old balance effect and apply new one
        if (entry.type === 'credit') {
            // Old: +oldAmount, New: +newAmount => difference = newAmount - oldAmount
            await updatePlayerBalance(entry.playerId, newAmount - oldAmount);
        } else {
            // Old: -oldAmount, New: -newAmount => difference = oldAmount - newAmount
            await updatePlayerBalance(entry.playerId, oldAmount - newAmount);
        }

        const updated = await dbUpdateCreditEntry(req.params.entryId, {
            amount: newAmount,
            note: note || entry.note,
            lastEditedAt: new Date().toISOString(),
        });

        const updatedPlayer = await getPlayerById(entry.playerId);
        res.json({ entry: updated, player: updatedPlayer });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update credit entry', details: err.message });
    }
});

// DELETE a credit entry (reverses the balance effect)
router.delete('/entry/:entryId', async (req, res) => {
    try {
        const entry = await getCreditEntryById(req.params.entryId);
        if (!entry) return res.status(404).json({ error: 'Credit entry not found' });

        // Reverse the balance effect
        if (entry.type === 'credit') {
            await updatePlayerBalance(entry.playerId, -entry.amount); // undo credit
        } else {
            await updatePlayerBalance(entry.playerId, entry.amount); // undo debit
        }

        await dbDeleteCreditEntry(req.params.entryId);

        const updatedPlayer = await getPlayerById(entry.playerId);
        res.json({ message: 'Credit entry deleted and balance adjusted', player: updatedPlayer });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete credit entry', details: err.message });
    }
});

module.exports = router;
