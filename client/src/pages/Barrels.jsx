import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Package, Clock, History, Users, DollarSign, Filter } from 'lucide-react';
import { getBarrels, createBarrel, updateBarrel, deleteBarrel, getShuttleSummary } from '../services/api';

export default function Barrels({ addToast, isAdmin = true }) {
    const [barrels, setBarrels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSessionsModal, setShowSessionsModal] = useState(false);
    const [editingBarrel, setEditingBarrel] = useState(null);

    // Shuttle summary state
    const [shuttleSummary, setShuttleSummary] = useState({ totalShuttleAmount: 0, sessionCount: 0, sessions: [] });
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Barrel form
    const [form, setForm] = useState({
        purchaseDate: new Date().toISOString().split('T')[0],
        endDate: '',
        shuttleCount: '',
        cost: '',
        brand: '',
        notes: '',
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [b, summary] = await Promise.all([getBarrels(), getShuttleSummary()]);
            setBarrels(b);
            setShuttleSummary(summary);
        } catch (err) {
            addToast('Failed to load barrel data', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function loadShuttleSummary() {
        try {
            const summary = await getShuttleSummary(filterFrom || undefined, filterTo || undefined);
            setShuttleSummary(summary);
        } catch (err) {
            addToast('Failed to load shuttle summary', 'error');
        }
    }

    function resetForm() {
        setForm({
            purchaseDate: new Date().toISOString().split('T')[0],
            endDate: '', shuttleCount: '', cost: '', brand: '', notes: '',
        });
    }

    async function handleAddBarrel(e) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            await createBarrel(form);
            addToast('Barrel added successfully!', 'success');
            setShowAddModal(false);
            resetForm();
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    function openEditModal(barrel) {
        setEditingBarrel(barrel);
        setForm({
            purchaseDate: barrel.purchaseDate || '',
            endDate: barrel.endDate || '',
            shuttleCount: barrel.shuttleCount?.toString() || '',
            cost: barrel.cost?.toString() || '',
            brand: barrel.brand || '',
            notes: barrel.notes || '',
        });
        setShowEditModal(true);
    }

    async function handleEditBarrel(e) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            await updateBarrel(editingBarrel.id, form);
            addToast('Barrel updated!', 'success');
            setShowEditModal(false);
            setEditingBarrel(null);
            resetForm();
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteBarrel(barrel) {
        if (!confirm(`Delete this barrel (${barrel.brand || 'Unnamed'})? This cannot be undone.`)) return;
        try {
            await deleteBarrel(barrel.id);
            addToast('Barrel deleted', 'info');
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    const formatCurrency = (amt) => `₹${(amt || 0).toFixed(2)}`;
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (barrel) => {
        if (barrel.status === 'completed' || barrel.endDate) {
            return <span className="badge badge-green" style={{ fontSize: 11 }}>Completed</span>;
        }
        return <span className="badge badge-yellow" style={{ fontSize: 11 }}>Active</span>;
    };

    const getDaysUsed = (barrel) => {
        if (!barrel.purchaseDate) return '—';
        const start = new Date(barrel.purchaseDate);
        const end = barrel.endDate ? new Date(barrel.endDate) : new Date();
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return days >= 0 ? `${days} days` : '—';
    };

    // Summary stats
    const totalBarrels = barrels.length;
    const activeBarrels = barrels.filter(b => !b.endDate || b.status === 'active').length;
    const totalBarrelCost = barrels.reduce((sum, b) => sum + (b.cost || 0), 0);
    const totalShuttles = barrels.reduce((sum, b) => sum + (b.shuttleCount || 0), 0);

    if (loading) {
        return (<div className="loading-container"><div className="loading-spinner"></div>Loading barrels...</div>);
    }

    return (
        <div>
            <div className="page-header">
                <h2>Barrel Management</h2>
                <p>Track shuttle barrel purchases, usage, and shuttle collection amounts</p>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="card stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--accent-yellow-soft)', color: 'var(--accent-yellow)' }}>
                        <Package size={20} />
                    </div>
                    <div className="stat-card-value">{totalBarrels}</div>
                    <div className="stat-card-label">Total Barrels</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--accent-green-soft)', color: 'var(--accent-green)' }}>
                        <Clock size={20} />
                    </div>
                    <div className="stat-card-value">{activeBarrels}</div>
                    <div className="stat-card-label">Active Barrels</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)' }}>
                        <DollarSign size={20} />
                    </div>
                    <div className="stat-card-value">{formatCurrency(totalBarrelCost)}</div>
                    <div className="stat-card-label">Total Barrel Cost</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--accent-red-soft)', color: 'var(--accent-red)' }}>
                        <Package size={20} />
                    </div>
                    <div className="stat-card-value">{totalShuttles}</div>
                    <div className="stat-card-label">Total Shuttles</div>
                </div>
            </div>

            {/* Shuttle Collection Summary Card */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <h3 style={{ fontSize: 16, margin: 0 }}>
                        <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        Shuttle Amount Collected from Sessions
                    </h3>
                    <button className="btn btn-secondary btn-sm" title="View session details"
                        onClick={() => setShowSessionsModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <History size={14} /> View Sessions
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
                        <label className="form-label" style={{ marginBottom: 4 }}>From Date</label>
                        <input className="form-input" type="date" value={filterFrom}
                            onChange={e => setFilterFrom(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
                        <label className="form-label" style={{ marginBottom: 4 }}>To Date</label>
                        <input className="form-input" type="date" value={filterTo}
                            onChange={e => setFilterTo(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={loadShuttleSummary}
                        style={{ height: 42, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Filter size={14} /> Filter
                    </button>
                    {(filterFrom || filterTo) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                            setFilterFrom(''); setFilterTo('');
                            getShuttleSummary().then(setShuttleSummary);
                        }} style={{ height: 42 }}>Clear</button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ padding: '16px 24px', background: 'var(--accent-green-soft)', borderRadius: 'var(--radius-sm)', flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Shuttle Amount</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>
                            {formatCurrency(shuttleSummary.totalShuttleAmount)}
                        </div>
                    </div>
                    <div style={{ padding: '16px 24px', background: 'var(--accent-blue-soft)', borderRadius: 'var(--radius-sm)', flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Sessions with Shuttles</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)' }}>
                            {shuttleSummary.sessionCount}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Barrel Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, margin: 0 }}>Barrel Inventory</h3>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} /> Add Barrel
                    </button>
                )}
            </div>

            {/* Barrel List */}
            {barrels.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon"><Package size={36} /></div>
                    <h3>No barrels yet</h3>
                    <p>Add your first barrel to start tracking shuttle usage!</p>
                    {isAdmin && (
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                            <Plus size={18} /> Add First Barrel
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {barrels.map((barrel, i) => (
                        <div key={barrel.id} className="card animate-in" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--accent-yellow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-yellow)', flexShrink: 0 }}>
                                <Package size={22} />
                            </div>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>{barrel.brand || 'Barrel'}</span>
                                    {getStatusBadge(barrel)}
                                </div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                                    <span>🛒 {formatDate(barrel.purchaseDate)}</span>
                                    {barrel.endDate && <span>✅ {formatDate(barrel.endDate)}</span>}
                                    <span>🏸 {barrel.shuttleCount} shuttles</span>
                                    <span>⏱ {getDaysUsed(barrel)}</span>
                                </div>
                                {barrel.notes && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                                        {barrel.notes}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-yellow)' }}>
                                    {formatCurrency(barrel.cost)}
                                </div>
                                {isAdmin && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEditModal(barrel)} title="Edit">
                                            <Edit3 size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteBarrel(barrel)} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Barrel Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Barrel</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddBarrel}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Purchase Date *</label>
                                    <input className="form-input" type="date" value={form.purchaseDate}
                                        onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date (when finished)</label>
                                    <input className="form-input" type="date" value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">No. of Shuttles *</label>
                                    <input className="form-input" type="number" placeholder="6" min="1"
                                        value={form.shuttleCount}
                                        onChange={e => setForm({ ...form, shuttleCount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cost (₹)</label>
                                    <input className="form-input" type="number" placeholder="1500" min="0" step="0.01"
                                        value={form.cost}
                                        onChange={e => setForm({ ...form, cost: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Brand / Type</label>
                                <input className="form-input" type="text" placeholder="e.g. Yonex Mavis 350"
                                    value={form.brand}
                                    onChange={e => setForm({ ...form, brand: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea className="form-input" placeholder="Any additional notes..." rows={2}
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Barrel'}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Barrel Modal */}
            {showEditModal && editingBarrel && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Barrel</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditBarrel}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Purchase Date *</label>
                                    <input className="form-input" type="date" value={form.purchaseDate}
                                        onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input className="form-input" type="date" value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">No. of Shuttles *</label>
                                    <input className="form-input" type="number" placeholder="6" min="1"
                                        value={form.shuttleCount}
                                        onChange={e => setForm({ ...form, shuttleCount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cost (₹)</label>
                                    <input className="form-input" type="number" placeholder="1500" min="0" step="0.01"
                                        value={form.cost}
                                        onChange={e => setForm({ ...form, cost: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Brand / Type</label>
                                <input className="form-input" type="text" placeholder="e.g. Yonex Mavis 350"
                                    value={form.brand}
                                    onChange={e => setForm({ ...form, brand: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea className="form-input" placeholder="Any additional notes..." rows={2}
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sessions Detail Modal */}
            {showSessionsModal && (
                <div className="modal-overlay" onClick={() => setShowSessionsModal(false)}>
                    <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Shuttle Sessions Detail</h3>
                            <button className="modal-close" onClick={() => setShowSessionsModal(false)}><X size={18} /></button>
                        </div>
                        {shuttleSummary.sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                No sessions with shuttle costs found.
                            </div>
                        ) : (
                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--accent-green-soft)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, color: 'var(--accent-green)' }}>
                                    Total: {formatCurrency(shuttleSummary.totalShuttleAmount)} from {shuttleSummary.sessionCount} sessions
                                </div>
                                {shuttleSummary.sessions.map((session, i) => (
                                    <div key={session.id} className="credit-entry" style={{ flexDirection: 'column', gap: 6, padding: '12px 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                    {formatDate(session.date)}
                                                    {session.startTime && session.endTime && (
                                                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                                                            {session.startTime} – {session.endTime}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                    <Users size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                    {session.playerCount} players • {session.duration}h
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: 16 }}>
                                                {formatCurrency(session.shuttleCost)}
                                            </div>
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
