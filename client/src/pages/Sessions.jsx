import { useState, useEffect } from 'react';
import { Plus, Users, Clock, DollarSign, Trash2, X, AlertCircle } from 'lucide-react';
import { getPlayers, getSessions, createSession, deleteSession } from '../services/api';

export default function Sessions({ addToast }) {
    const [players, setPlayers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Session form state
    const [sessionForm, setSessionForm] = useState({
        date: new Date().toISOString().split('T')[0],
        duration: '',
        players: [],
        expenses: { court: '', shuttles: '', other: '' },
        splitMethod: 'equal',
        playerHours: {},
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [p, s] = await Promise.all([getPlayers(), getSessions()]);
            setPlayers(p);
            setSessions(s);
        } catch (err) {
            addToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }

    function togglePlayer(playerId) {
        setSessionForm(prev => {
            const selected = prev.players.includes(playerId)
                ? prev.players.filter(id => id !== playerId)
                : [...prev.players, playerId];
            return { ...prev, players: selected };
        });
    }

    function getTotalExpense() {
        const { court, shuttles, other } = sessionForm.expenses;
        return (parseFloat(court) || 0) + (parseFloat(shuttles) || 0) + (parseFloat(other) || 0);
    }

    function getPerPlayerCost() {
        const total = getTotalExpense();
        const selectedCount = sessionForm.players.length;
        if (selectedCount === 0 || total === 0) return {};

        if (sessionForm.splitMethod === 'byHours') {
            const totalH = sessionForm.players.reduce((sum, pid) => sum + (parseFloat(sessionForm.playerHours[pid]) || 0), 0);
            if (totalH === 0) {
                const perPerson = total / selectedCount;
                return Object.fromEntries(sessionForm.players.map(pid => [pid, perPerson]));
            }
            return Object.fromEntries(sessionForm.players.map(pid => {
                const h = parseFloat(sessionForm.playerHours[pid]) || 0;
                return [pid, (h / totalH) * total];
            }));
        }

        const perPerson = total / selectedCount;
        return Object.fromEntries(sessionForm.players.map(pid => [pid, perPerson]));
    }

    async function handleCreateSession(e) {
        e.preventDefault();
        if (sessionForm.players.length === 0) {
            addToast('Select at least one player', 'error');
            return;
        }
        try {
            await createSession({
                ...sessionForm,
                expenses: {
                    court: parseFloat(sessionForm.expenses.court) || 0,
                    shuttles: parseFloat(sessionForm.expenses.shuttles) || 0,
                    other: parseFloat(sessionForm.expenses.other) || 0,
                }
            });
            addToast('Session created! Credits have been debited.', 'success');
            setShowCreateModal(false);
            setSessionForm({
                date: new Date().toISOString().split('T')[0],
                duration: '', players: [],
                expenses: { court: '', shuttles: '', other: '' },
                splitMethod: 'equal', playerHours: {},
            });
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleDeleteSession(session) {
        if (!confirm('Delete this session? Note: Credits will NOT be refunded.')) return;
        try {
            await deleteSession(session.id);
            addToast('Session deleted', 'info');
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    const formatCurrency = (amt) => `₹${(amt || 0).toFixed(2)}`;
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return { day: d.getDate(), month: d.toLocaleString('en', { month: 'short' }), year: d.getFullYear() };
    };

    const perPlayerCosts = getPerPlayerCost();

    if (loading) {
        return (<div className="loading-container"><div className="loading-spinner"></div>Loading sessions...</div>);
    }

    return (
        <div>
            <div className="page-header">
                <h2>Sessions</h2>
                <p>Record and manage badminton play sessions</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} /> New Session
                </button>
            </div>

            {/* Session List */}
            {sessions.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon"><CalendarIcon size={36} /></div>
                    <h3>No sessions yet</h3>
                    <p>Create your first session to start tracking expenses!</p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Create First Session
                    </button>
                </div>
            ) : (
                <div className="session-list">
                    {sessions.map((session, i) => {
                        const { day, month, year } = formatDate(session.date);
                        return (
                            <div key={session.id} className="card session-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="session-date-badge">
                                    <span className="day">{day}</span>
                                    <span className="month">{month}</span>
                                </div>
                                <div className="session-info">
                                    <h4>{session.duration}h Session — {month} {day}, {year}</h4>
                                    <div className="session-meta">
                                        <span><Users size={13} /> {session.playerDetails?.length || session.players?.length} players</span>
                                        <span><Clock size={13} /> {session.duration} hours</span>
                                        <span style={{ textTransform: 'capitalize' }}>{session.splitMethod} split</span>
                                    </div>
                                    <div className="player-chips" style={{ marginTop: 8 }}>
                                        {(session.playerDetails || []).map(p => (
                                            <span key={p.id} className="badge badge-blue" style={{ fontSize: 12 }}>{p.name}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                    <div className="session-amount">{formatCurrency(session.totalExpense)}</div>
                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteSession(session)} title="Delete session">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>New Session</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateSession}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input className="form-input" type="date" value={sessionForm.date}
                                        onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (hours) *</label>
                                    <input className="form-input" type="number" placeholder="2" min="0.5" step="0.5"
                                        value={sessionForm.duration}
                                        onChange={e => setSessionForm({ ...sessionForm, duration: e.target.value })} required />
                                </div>
                            </div>

                            {/* Player Selection */}
                            <div className="form-group">
                                <label className="form-label">Select Players *</label>
                                {players.length === 0 ? (
                                    <div style={{ padding: 16, background: 'var(--accent-red-soft)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 8, alignItems: 'center', color: 'var(--accent-red)', fontSize: 14 }}>
                                        <AlertCircle size={16} /> No players available. Add players first.
                                    </div>
                                ) : (
                                    <div className="player-chips">
                                        {players.map(p => (
                                            <div key={p.id} className={`player-chip ${sessionForm.players.includes(p.id) ? 'selected' : ''}`}
                                                onClick={() => togglePlayer(p.id)}>
                                                <span className="chip-avatar">{p.name.charAt(0).toUpperCase()}</span>
                                                {p.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Expenses */}
                            <div className="form-group">
                                <label className="form-label">Expenses (₹)</label>
                                <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div>
                                        <input className="form-input" type="number" placeholder="Court" min="0" step="0.01"
                                            value={sessionForm.expenses.court}
                                            onChange={e => setSessionForm({ ...sessionForm, expenses: { ...sessionForm.expenses, court: e.target.value } })} />
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, paddingLeft: 4 }}>Court</div>
                                    </div>
                                    <div>
                                        <input className="form-input" type="number" placeholder="Shuttles" min="0" step="0.01"
                                            value={sessionForm.expenses.shuttles}
                                            onChange={e => setSessionForm({ ...sessionForm, expenses: { ...sessionForm.expenses, shuttles: e.target.value } })} />
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, paddingLeft: 4 }}>Shuttles</div>
                                    </div>
                                    <div>
                                        <input className="form-input" type="number" placeholder="Other" min="0" step="0.01"
                                            value={sessionForm.expenses.other}
                                            onChange={e => setSessionForm({ ...sessionForm, expenses: { ...sessionForm.expenses, other: e.target.value } })} />
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, paddingLeft: 4 }}>Other</div>
                                    </div>
                                </div>
                            </div>

                            {/* Split Method */}
                            <div className="form-group">
                                <label className="form-label">Split Method</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" className={`period-btn ${sessionForm.splitMethod === 'equal' ? 'active' : ''}`}
                                        onClick={() => setSessionForm({ ...sessionForm, splitMethod: 'equal' })}>
                                        Equal Split
                                    </button>
                                    <button type="button" className={`period-btn ${sessionForm.splitMethod === 'byHours' ? 'active' : ''}`}
                                        onClick={() => setSessionForm({ ...sessionForm, splitMethod: 'byHours' })}>
                                        By Hours Played
                                    </button>
                                </div>
                            </div>

                            {/* Hours per player (if byHours) */}
                            {sessionForm.splitMethod === 'byHours' && sessionForm.players.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">Hours per Player</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {sessionForm.players.map(pid => {
                                            const player = players.find(p => p.id === pid);
                                            return (
                                                <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: 14, minWidth: 120 }}>{player?.name}</span>
                                                    <input className="form-input" type="number" placeholder="Hours" min="0" step="0.5"
                                                        style={{ width: 120 }}
                                                        value={sessionForm.playerHours[pid] || ''}
                                                        onChange={e => setSessionForm({
                                                            ...sessionForm,
                                                            playerHours: { ...sessionForm.playerHours, [pid]: e.target.value }
                                                        })} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Split Preview */}
                            {sessionForm.players.length > 0 && getTotalExpense() > 0 && (
                                <div className="split-preview">
                                    <h4><DollarSign size={16} /> Expense Split Preview</h4>
                                    <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                                        Total: <strong style={{ color: 'var(--accent-yellow)' }}>{formatCurrency(getTotalExpense())}</strong>{' '}
                                        split among {sessionForm.players.length} player{sessionForm.players.length > 1 ? 's' : ''}
                                    </div>
                                    {sessionForm.players.map(pid => {
                                        const player = players.find(p => p.id === pid);
                                        return (
                                            <div key={pid} className="split-row">
                                                <span className="player-name">{player?.name}</span>
                                                <span className="amount">{formatCurrency(perPlayerCosts[pid] || 0)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Create Session</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CalendarIcon({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    );
}
