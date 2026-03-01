import { useState, useEffect } from 'react';
import { UserPlus, Edit3, Trash2, PlusCircle, History, X, Search, Users } from 'lucide-react';
import { getPlayers, createPlayer, updatePlayer, deletePlayer, addCredit, getCreditHistory } from '../services/api';

export default function Players({ addToast, isAdmin = true }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [creditHistory, setCreditHistory] = useState([]);

    // Form states
    const [form, setForm] = useState({ name: '', contact: '', initialCredit: '' });
    const [creditForm, setCreditForm] = useState({ amount: '', note: '' });

    useEffect(() => { loadPlayers(); }, []);

    async function loadPlayers() {
        try {
            const data = await getPlayers();
            setPlayers(data);
        } catch (err) {
            addToast('Failed to load players', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddPlayer(e) {
        e.preventDefault();
        try {
            await createPlayer(form);
            addToast(`${form.name} added successfully!`, 'success');
            setForm({ name: '', contact: '', initialCredit: '' });
            setShowAddModal(false);
            loadPlayers();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleEditPlayer(e) {
        e.preventDefault();
        try {
            await updatePlayer(selectedPlayer.id, { name: form.name, contact: form.contact });
            addToast('Player updated successfully!', 'success');
            setShowEditModal(false);
            loadPlayers();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleDeletePlayer(player) {
        if (!confirm(`Are you sure you want to remove ${player.name}?`)) return;
        try {
            await deletePlayer(player.id);
            addToast(`${player.name} removed`, 'info');
            loadPlayers();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleAddCredit(e) {
        e.preventDefault();
        try {
            await addCredit(selectedPlayer.id, creditForm);
            addToast(`₹${creditForm.amount} added to ${selectedPlayer.name}`, 'success');
            setCreditForm({ amount: '', note: '' });
            setShowCreditModal(false);
            loadPlayers();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleShowHistory(player) {
        setSelectedPlayer(player);
        try {
            const history = await getCreditHistory(player.id);
            setCreditHistory(history);
            setShowHistoryModal(true);
        } catch (err) {
            addToast('Failed to load credit history', 'error');
        }
    }

    function openEditModal(player) {
        setSelectedPlayer(player);
        setForm({ name: player.name, contact: player.contact, initialCredit: '' });
        setShowEditModal(true);
    }

    function openCreditModal(player) {
        setSelectedPlayer(player);
        setCreditForm({ amount: '', note: '' });
        setShowCreditModal(true);
    }

    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amt) => `₹${Math.abs(amt).toFixed(2)}`;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                Loading players...
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h2>Players</h2>
                <p>Manage your badminton group members</p>
            </div>

            {/* Actions bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', maxWidth: 360 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: 42 }}
                    />
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => { setForm({ name: '', contact: '', initialCredit: '' }); setShowAddModal(true); }}>
                        <UserPlus size={18} /> Add Player
                    </button>
                )}
            </div>

            {/* Players Grid */}
            {filteredPlayers.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon"><Users size={36} /></div>
                    <h3>No players found</h3>
                    <p>{players.length === 0 ? 'Add your first player to get started!' : 'No players match your search.'}</p>
                    {players.length === 0 && isAdmin && (
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <UserPlus size={18} /> Add First Player
                        </button>
                    )}
                </div>
            ) : (
                <div className="players-grid">
                    {filteredPlayers.map((player, i) => (
                        <div key={player.id} className="card player-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="player-card-header">
                                <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div className="player-name">{player.name}</div>
                                    <div className="player-contact">{player.contact || 'No contact'}</div>
                                </div>
                            </div>
                            <div className={`player-balance ${player.balance > 0 ? 'positive' : player.balance < 0 ? 'negative' : 'zero'}`}>
                                {player.balance >= 0 ? '+' : '-'}{formatCurrency(player.balance)}
                            </div>
                            <div className="player-card-actions">
                                {isAdmin && (
                                    <button className="btn btn-success btn-sm" onClick={() => openCreditModal(player)} title="Add Credit">
                                        <PlusCircle size={15} /> Top Up
                                    </button>
                                )}
                                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleShowHistory(player)} title="Credit History">
                                    <History size={15} />
                                </button>
                                {isAdmin && (
                                    <>
                                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEditModal(player)} title="Edit">
                                            <Edit3 size={15} />
                                        </button>
                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeletePlayer(player)} title="Remove">
                                            <Trash2 size={15} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Player Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Player</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddPlayer}>
                            <div className="form-group">
                                <label className="form-label">Player Name *</label>
                                <input className="form-input" type="text" placeholder="e.g. Rahul Sharma" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Info</label>
                                <input className="form-input" type="text" placeholder="Phone or email" value={form.contact}
                                    onChange={e => setForm({ ...form, contact: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Initial Credit (₹)</label>
                                <input className="form-input" type="number" placeholder="0.00" min="0" step="0.01" value={form.initialCredit}
                                    onChange={e => setForm({ ...form, initialCredit: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Add Player</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Player Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Player</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditPlayer}>
                            <div className="form-group">
                                <label className="form-label">Player Name *</label>
                                <input className="form-input" type="text" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Info</label>
                                <input className="form-input" type="text" value={form.contact}
                                    onChange={e => setForm({ ...form, contact: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Credit Modal */}
            {showCreditModal && (
                <div className="modal-overlay" onClick={() => setShowCreditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Credit — {selectedPlayer?.name}</h3>
                            <button className="modal-close" onClick={() => setShowCreditModal(false)}><X size={18} /></button>
                        </div>
                        <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Current Balance</div>
                            <div className={`player-balance ${selectedPlayer?.balance >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 20, margin: '4px 0' }}>
                                {selectedPlayer?.balance >= 0 ? '+' : '-'}{formatCurrency(selectedPlayer?.balance || 0)}
                            </div>
                        </div>
                        <form onSubmit={handleAddCredit}>
                            <div className="form-group">
                                <label className="form-label">Amount (₹) *</label>
                                <input className="form-input" type="number" placeholder="500.00" min="0.01" step="0.01"
                                    value={creditForm.amount} onChange={e => setCreditForm({ ...creditForm, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Note</label>
                                <input className="form-input" type="text" placeholder="e.g. Monthly contribution" value={creditForm.note}
                                    onChange={e => setCreditForm({ ...creditForm, note: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-success">Add Credit</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreditModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credit History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal credit-history-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Credit History — {selectedPlayer?.name}</h3>
                            <button className="modal-close" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
                        </div>
                        {creditHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                No credit history yet.
                            </div>
                        ) : (
                            <div>
                                {creditHistory.map(entry => (
                                    <div key={entry.id} className="credit-entry">
                                        <div className="credit-info">
                                            <div className="credit-note">{entry.note}</div>
                                            <div className="credit-date">{new Date(entry.date).toLocaleString()}</div>
                                        </div>
                                        <div className={`credit-amount ${entry.type}`}>
                                            {entry.type === 'credit' ? '+' : '-'}₹{entry.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
