const express = require('express');
const { readData } = require('../services/dataStore');

const router = express.Router();

// POST sync to Google Sheets (placeholder – requires OAuth setup)
router.post('/sync', (req, res) => {
    // This endpoint will sync data to Google Sheets
    // Requires:
    // 1. A Google Cloud project with Sheets API enabled
    // 2. OAuth 2.0 credentials (or a service account key)
    // 3. A target spreadsheet ID

    const { spreadsheetId } = req.body;

    if (!spreadsheetId) {
        return res.status(400).json({
            error: 'Spreadsheet ID is required',
            setup: {
                step1: 'Create a Google Cloud project at https://console.cloud.google.com',
                step2: 'Enable the Google Sheets API',
                step3: 'Create a Service Account and download the JSON key',
                step4: 'Place the key as server/credentials.json',
                step5: 'Share your Google Sheet with the service account email',
                step6: 'Send the spreadsheetId in your sync request'
            }
        });
    }

    try {
        const data = readData();
        // In production, this would use the googleapis library to write data
        // For now, return the data that would be synced
        res.json({
            message: 'Google Sheets sync is ready to configure. See README for setup instructions.',
            dataPreview: {
                playersCount: data.players.length,
                sessionsCount: data.sessions.length,
                creditHistoryCount: data.creditHistory.length
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Sync failed', details: err.message });
    }
});

// GET pull data from Google Sheets (placeholder)
router.get('/pull', (req, res) => {
    res.json({
        message: 'Google Sheets pull is ready to configure. See README for setup instructions.',
        setup: {
            step1: 'Create a Google Cloud project at https://console.cloud.google.com',
            step2: 'Enable the Google Sheets API',
            step3: 'Create a Service Account and download the JSON key',
            step4: 'Place the key as server/credentials.json',
            step5: 'Share your Google Sheet with the service account email'
        }
    });
});

module.exports = router;
