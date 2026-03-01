const { MongoClient } = require('mongodb');
require('dotenv').config();

const dns = require('dns');
// Use Google DNS to resolve MongoDB SRV records (fixes ISP DNS issues)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'badminton-tracker';

let client = null;
let db = null;

async function getDb() {
    if (db) return db;

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set. Check your .env file.');
    }

    client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB Atlas');

    // Ensure collections exist
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);
    if (!names.includes('players')) await db.createCollection('players');
    if (!names.includes('sessions')) await db.createCollection('sessions');
    if (!names.includes('creditHistory')) await db.createCollection('creditHistory');

    return db;
}

// Player operations
async function getPlayers() {
    const database = await getDb();
    return database.collection('players').find({}).toArray();
}

async function getPlayerById(id) {
    const database = await getDb();
    return database.collection('players').findOne({ id });
}

async function createPlayer(player) {
    const database = await getDb();
    await database.collection('players').insertOne(player);
    return player;
}

async function updatePlayer(id, updates) {
    const database = await getDb();
    await database.collection('players').updateOne({ id }, { $set: updates });
    return database.collection('players').findOne({ id });
}

async function deletePlayer(id) {
    const database = await getDb();
    await database.collection('players').deleteOne({ id });
}

// Credit history operations
async function getCreditHistoryByPlayer(playerId) {
    const database = await getDb();
    return database.collection('creditHistory')
        .find({ playerId })
        .sort({ date: -1 })
        .toArray();
}

async function getAllCreditHistory() {
    const database = await getDb();
    return database.collection('creditHistory')
        .find({})
        .sort({ date: -1 })
        .toArray();
}

async function addCreditEntry(entry) {
    const database = await getDb();
    await database.collection('creditHistory').insertOne(entry);
    return entry;
}

async function updatePlayerBalance(id, amount) {
    const database = await getDb();
    await database.collection('players').updateOne(
        { id },
        { $inc: { balance: amount } }
    );
}

// Session operations
async function getSessions() {
    const database = await getDb();
    return database.collection('sessions')
        .find({})
        .sort({ date: -1 })
        .toArray();
}

async function getSessionById(id) {
    const database = await getDb();
    return database.collection('sessions').findOne({ id });
}

async function createSession(session) {
    const database = await getDb();
    await database.collection('sessions').insertOne(session);
    return session;
}

async function deleteSession(id) {
    const database = await getDb();
    await database.collection('sessions').deleteOne({ id });
}

// Close connection (for graceful shutdown)
async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}

module.exports = {
    getDb,
    getPlayers,
    getPlayerById,
    createPlayer,
    updatePlayer,
    deletePlayer,
    getCreditHistoryByPlayer,
    getAllCreditHistory,
    addCreditEntry,
    updatePlayerBalance,
    getSessions,
    getSessionById,
    createSession,
    deleteSession,
    closeConnection,
};
