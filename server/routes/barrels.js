const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
    getBarrels,
    getBarrelById,
    createBarrel: dbCreateBarrel,
    updateBarrel: dbUpdateBarrel,
    deleteBarrel: dbDeleteBarrel,
    getSessions,
} = require('../services/dataStore');

const router = express.Router();

// GET all barrels
router.get('/', async (req, res) => {
    try {
        const barrels = await getBarrels();
        res.json(barrels);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch barrels', details: err.message });
    }
});

// GET shuttle collection summary (from sessions)
router.get('/shuttle-summary', async (req, res) => {
    try {
        const sessions = await getSessions();
        const { from, to } = req.query;

        let filtered = sessions;
        if (from) filtered = filtered.filter(s => s.date >= from);
        if (to) filtered = filtered.filter(s => s.date <= to);

        const shuttleSessions = filtered
            .filter(s => s.expenses?.shuttles > 0)
            .map(s => ({
                id: s.id,
                date: s.date,
                startTime: s.startTime || '',
                endTime: s.endTime || '',
                duration: s.duration,
                shuttleCost: s.expenses.shuttles,
                totalExpense: s.totalExpense,
                playerCount: s.players?.length || 0,
                playerDetails: s.playerDetails || [],
            }));

        const totalShuttleAmount = shuttleSessions.reduce((sum, s) => sum + s.shuttleCost, 0);

        res.json({
            totalShuttleAmount,
            sessionCount: shuttleSessions.length,
            sessions: shuttleSessions,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch shuttle summary', details: err.message });
    }
});

// GET single barrel
router.get('/:id', async (req, res) => {
    try {
        const barrel = await getBarrelById(req.params.id);
        if (!barrel) return res.status(404).json({ error: 'Barrel not found' });
        res.json(barrel);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch barrel', details: err.message });
    }
});

// POST create barrel
router.post('/', async (req, res) => {
    try {
        const { purchaseDate, endDate, shuttleCount, cost, brand, notes } = req.body;

        if (!purchaseDate || !shuttleCount) {
            return res.status(400).json({ error: 'Purchase date and shuttle count are required' });
        }

        const barrel = {
            id: uuidv4(),
            purchaseDate,
            endDate: endDate || '',
            shuttleCount: parseInt(shuttleCount) || 0,
            cost: parseFloat(cost) || 0,
            brand: brand || '',
            notes: notes || '',
            status: endDate ? 'completed' : 'active',
            createdAt: new Date().toISOString(),
        };

        await dbCreateBarrel(barrel);
        res.status(201).json(barrel);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create barrel', details: err.message });
    }
});

// PUT update barrel
router.put('/:id', async (req, res) => {
    try {
        const barrel = await getBarrelById(req.params.id);
        if (!barrel) return res.status(404).json({ error: 'Barrel not found' });

        const { purchaseDate, endDate, shuttleCount, cost, brand, notes, status } = req.body;

        const updates = {};
        if (purchaseDate !== undefined) updates.purchaseDate = purchaseDate;
        if (endDate !== undefined) {
            updates.endDate = endDate;
            updates.status = endDate ? 'completed' : 'active';
        }
        if (shuttleCount !== undefined) updates.shuttleCount = parseInt(shuttleCount) || 0;
        if (cost !== undefined) updates.cost = parseFloat(cost) || 0;
        if (brand !== undefined) updates.brand = brand;
        if (notes !== undefined) updates.notes = notes;
        if (status !== undefined) updates.status = status;
        updates.lastEditedAt = new Date().toISOString();

        const updated = await dbUpdateBarrel(req.params.id, updates);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update barrel', details: err.message });
    }
});

// DELETE barrel
router.delete('/:id', async (req, res) => {
    try {
        const barrel = await getBarrelById(req.params.id);
        if (!barrel) return res.status(404).json({ error: 'Barrel not found' });

        await dbDeleteBarrel(req.params.id);
        res.json({ message: 'Barrel deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete barrel', details: err.message });
    }
});

module.exports = router;
