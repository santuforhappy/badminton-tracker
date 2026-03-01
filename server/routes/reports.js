const express = require('express');
const { getSessions, getPlayers } = require('../services/dataStore');

const router = express.Router();

// GET reports
router.get('/', async (req, res) => {
    try {
        const [sessions, players] = await Promise.all([getSessions(), getPlayers()]);
        const { period } = req.query;

        const now = new Date();
        let startDate;

        if (period === 'weekly') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else if (period === 'monthly') {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
        } else {
            startDate = new Date(0);
        }

        const filteredSessions = sessions.filter(s => new Date(s.date) >= startDate);

        let totalExpense = 0;
        let totalCourt = 0;
        let totalShuttles = 0;
        let totalOther = 0;
        let totalHours = 0;
        let playerExpenses = {};

        filteredSessions.forEach(session => {
            totalExpense += session.totalExpense || 0;
            totalCourt += session.expenses?.court || 0;
            totalShuttles += session.expenses?.shuttles || 0;
            totalOther += session.expenses?.other || 0;
            totalHours += session.duration || 0;

            session.players.forEach(pid => {
                if (!playerExpenses[pid]) {
                    const player = players.find(p => p.id === pid);
                    playerExpenses[pid] = {
                        playerId: pid,
                        name: player ? player.name : 'Unknown',
                        totalSpent: 0,
                        sessionsPlayed: 0,
                        currentBalance: player ? player.balance : 0,
                    };
                }
                playerExpenses[pid].totalSpent += session.perPlayerCosts?.[pid] || 0;
                playerExpenses[pid].sessionsPlayed += 1;
            });
        });

        Object.keys(playerExpenses).forEach(pid => {
            playerExpenses[pid].totalSpent = Math.round(playerExpenses[pid].totalSpent * 100) / 100;
        });

        res.json({
            period: period || 'all',
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            totalSessions: filteredSessions.length,
            totalExpense: Math.round(totalExpense * 100) / 100,
            breakdown: {
                court: Math.round(totalCourt * 100) / 100,
                shuttles: Math.round(totalShuttles * 100) / 100,
                other: Math.round(totalOther * 100) / 100,
            },
            totalHours: Math.round(totalHours * 100) / 100,
            playerExpenses: Object.values(playerExpenses),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate report', details: err.message });
    }
});

module.exports = router;
