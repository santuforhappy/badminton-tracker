const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
    getPlayers,
    getPlayerById,
    createPlayer: dbCreatePlayer,
    updatePlayer: dbUpdatePlayer,
    deletePlayer: dbDeletePlayer,
    addCreditEntry,
} = require('../services/dataStore');

const router = express.Router();

// GET all players
router.get('/', async (req, res) => {
    try {
        const players = await getPlayers();
        res.json(players);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch players', details: err.message });
    }
});

// GET single player
router.get('/:id', async (req, res) => {
    try {
        const player = await getPlayerById(req.params.id);
        if (!player) return res.status(404).json({ error: 'Player not found' });
        res.json(player);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch player', details: err.message });
    }
});

// POST create player
router.post('/', async (req, res) => {
    try {
        const { name, contact, initialCredit } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const player = {
            id: uuidv4(),
            name,
            contact: contact || '',
            balance: parseFloat(initialCredit) || 0,
            createdAt: new Date().toISOString(),
            active: true,
        };

        await dbCreatePlayer(player);

        // If initial credit, record it in history
        if (player.balance > 0) {
            await addCreditEntry({
                id: uuidv4(),
                playerId: player.id,
                amount: player.balance,
                type: 'credit',
                note: 'Initial credit',
                date: new Date().toISOString(),
            });
        }

        res.status(201).json(player);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create player', details: err.message });
    }
});

// PUT update player
router.put('/:id', async (req, res) => {
    try {
        const player = await getPlayerById(req.params.id);
        if (!player) return res.status(404).json({ error: 'Player not found' });

        const updates = {};
        const { name, contact, active } = req.body;
        if (name !== undefined) updates.name = name;
        if (contact !== undefined) updates.contact = contact;
        if (active !== undefined) updates.active = active;

        const updated = await dbUpdatePlayer(req.params.id, updates);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update player', details: err.message });
    }
});

// DELETE player
router.delete('/:id', async (req, res) => {
    try {
        const player = await getPlayerById(req.params.id);
        if (!player) return res.status(404).json({ error: 'Player not found' });

        await dbDeletePlayer(req.params.id);
        res.json({ message: 'Player deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete player', details: err.message });
    }
});

module.exports = router;
