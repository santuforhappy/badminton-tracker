const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
    getPlayers,
    getPlayerById,
    updatePlayerBalance,
    getSessions,
    getSessionById,
    createSession: dbCreateSession,
    deleteSession: dbDeleteSession,
    updateSession: dbUpdateSession,
    addCreditEntry,
} = require('../services/dataStore');

const router = express.Router();

// GET all sessions
router.get('/', async (req, res) => {
    try {
        const [sessions, players] = await Promise.all([getSessions(), getPlayers()]);

        const enriched = sessions.map(s => ({
            ...s,
            playerDetails: s.players.map(pid => {
                const p = players.find(pl => pl.id === pid);
                return p ? { id: p.id, name: p.name } : { id: pid, name: 'Unknown' };
            }),
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sessions', details: err.message });
    }
});

// GET single session
router.get('/:id', async (req, res) => {
    try {
        const [session, players] = await Promise.all([
            getSessionById(req.params.id),
            getPlayers(),
        ]);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        session.playerDetails = session.players.map(pid => {
            const p = players.find(pl => pl.id === pid);
            return p ? { id: p.id, name: p.name, balance: p.balance } : { id: pid, name: 'Unknown' };
        });

        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch session', details: err.message });
    }
});

// POST create session
router.post('/', async (req, res) => {
    try {
        const { date, duration, players: playerIds, expenses, splitMethod, playerHours, startTime, endTime } = req.body;

        if (!date || !playerIds || playerIds.length === 0) {
            return res.status(400).json({ error: 'Date and at least one player are required' });
        }

        // Calculate total expenses
        const courtCost = parseFloat(expenses?.court) || 0;
        const shuttleCost = parseFloat(expenses?.shuttles) || 0;
        const otherCost = parseFloat(expenses?.other) || 0;
        const totalExpense = courtCost + shuttleCost + otherCost;

        // Calculate per-player cost
        let perPlayerCosts = {};

        if (splitMethod === 'byHours' && playerHours) {
            const totalHours = Object.values(playerHours).reduce((sum, h) => sum + parseFloat(h || 0), 0);
            if (totalHours > 0) {
                playerIds.forEach(pid => {
                    const hours = parseFloat(playerHours[pid] || 0);
                    perPlayerCosts[pid] = (hours / totalHours) * totalExpense;
                });
            } else {
                const perPerson = totalExpense / playerIds.length;
                playerIds.forEach(pid => { perPlayerCosts[pid] = perPerson; });
            }
        } else {
            const perPerson = totalExpense / playerIds.length;
            playerIds.forEach(pid => { perPlayerCosts[pid] = perPerson; });
        }

        // Debit each player's balance and record history
        for (const pid of playerIds) {
            const cost = Math.round(perPlayerCosts[pid] * 100) / 100;
            await updatePlayerBalance(pid, -cost);
            await addCreditEntry({
                id: uuidv4(),
                playerId: pid,
                amount: cost,
                type: 'debit',
                note: `Session on ${date}`,
                date: new Date().toISOString(),
            });
        }

        const session = {
            id: uuidv4(),
            date,
            startTime: startTime || '',
            endTime: endTime || '',
            duration: parseFloat(duration) || 0,
            players: playerIds,
            expenses: { court: courtCost, shuttles: shuttleCost, other: otherCost },
            totalExpense,
            splitMethod: splitMethod || 'equal',
            perPlayerCosts,
            editHistory: [],
            createdAt: new Date().toISOString(),
        };

        await dbCreateSession(session);

        // Enrich response with player names
        const allPlayers = await getPlayers();
        session.playerDetails = session.players.map(pid => {
            const p = allPlayers.find(pl => pl.id === pid);
            return p ? { id: p.id, name: p.name, balance: p.balance } : { id: pid, name: 'Unknown' };
        });

        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create session', details: err.message });
    }
});

// DELETE session
router.delete('/:id', async (req, res) => {
    try {
        const session = await getSessionById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        await dbDeleteSession(req.params.id);
        res.json({ message: 'Session deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete session', details: err.message });
    }
});

// PUT edit session (requires editComment)
router.put('/:id', async (req, res) => {
    try {
        const session = await getSessionById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const { date, duration, startTime, endTime, expenses, editComment } = req.body;

        if (!editComment || editComment.trim() === '') {
            return res.status(400).json({ error: 'Edit comment is mandatory when editing a session.' });
        }

        const updates = {};
        if (date !== undefined) updates.date = date;
        if (duration !== undefined) updates.duration = parseFloat(duration) || 0;
        if (startTime !== undefined) updates.startTime = startTime;
        if (endTime !== undefined) updates.endTime = endTime;
        if (expenses !== undefined) {
            updates.expenses = {
                court: parseFloat(expenses.court) || 0,
                shuttles: parseFloat(expenses.shuttles) || 0,
                other: parseFloat(expenses.other) || 0,
            };
            updates.totalExpense = updates.expenses.court + updates.expenses.shuttles + updates.expenses.other;
        }

        // Add to edit history
        const editEntry = {
            comment: editComment.trim(),
            editedAt: new Date().toISOString(),
            changes: Object.keys(updates),
        };
        updates.editHistory = [...(session.editHistory || []), editEntry];
        updates.lastEditedAt = new Date().toISOString();

        const updated = await dbUpdateSession(req.params.id, updates);

        // Enrich with player details
        const allPlayers = await getPlayers();
        updated.playerDetails = updated.players.map(pid => {
            const p = allPlayers.find(pl => pl.id === pid);
            return p ? { id: p.id, name: p.name } : { id: pid, name: 'Unknown' };
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update session', details: err.message });
    }
});

module.exports = router;
