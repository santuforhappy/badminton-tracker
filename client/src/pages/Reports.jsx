import { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import { getReport } from '../services/api';

export default function Reports({ addToast }) {
    const [period, setPeriod] = useState('monthly');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadReport(); }, [period]);

    async function loadReport() {
        setLoading(true);
        try {
            const data = await getReport(period);
            setReport(data);
        } catch (err) {
            addToast('Failed to load report', 'error');
        } finally {
            setLoading(false);
        }
    }

    function exportCSV() {
        if (!report || !report.playerExpenses || report.playerExpenses.length === 0) {
            addToast('No data to export', 'info');
            return;
        }

        const headers = ['Player', 'Sessions Played', 'Total Spent (₹)', 'Current Balance (₹)'];
        const rows = report.playerExpenses.map(p => [
            p.name, p.sessionsPlayed, p.totalSpent.toFixed(2), p.currentBalance.toFixed(2)
        ]);

        // Summary row
        rows.push([]);
        rows.push(['Summary']);
        rows.push(['Total Sessions', report.totalSessions]);
        rows.push(['Total Expense', report.totalExpense.toFixed(2)]);
        rows.push(['Total Hours', report.totalHours]);
        rows.push(['Court Booking', report.breakdown.court.toFixed(2)]);
        rows.push(['Shuttles', report.breakdown.shuttles.toFixed(2)]);
        rows.push(['Other', report.breakdown.other.toFixed(2)]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `badminton-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Report exported as CSV!', 'success');
    }

    const formatCurrency = (amt) => `₹${(amt || 0).toFixed(2)}`;

    return (
        <div>
            <div className="page-header">
                <h2>Reports</h2>
                <p>Expense summaries and player breakdowns</p>
            </div>

            {/* Period Selector + Export */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div className="period-selector">
                    {[
                        { key: 'weekly', label: 'This Week' },
                        { key: 'monthly', label: 'This Month' },
                        { key: '', label: 'All Time' },
                    ].map(p => (
                        <button key={p.key} className={`period-btn ${period === p.key ? 'active' : ''}`}
                            onClick={() => setPeriod(p.key)}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <button className="btn btn-secondary" onClick={exportCSV}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {loading ? (
                <div className="loading-container"><div className="loading-spinner"></div>Loading report...</div>
            ) : !report ? (
                <div className="card empty-state">
                    <div className="empty-state-icon"><BarChart3 size={36} /></div>
                    <h3>No data available</h3>
                    <p>Start recording sessions to see reports here.</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="stats-grid" style={{ marginBottom: 32 }}>
                        <div className="card stat-card yellow animate-in">
                            <div className="stat-card-icon"><DollarSign size={22} /></div>
                            <div className="stat-card-value">{formatCurrency(report.totalExpense)}</div>
                            <div className="stat-card-label">Total Expenses</div>
                        </div>
                        <div className="card stat-card blue animate-in">
                            <div className="stat-card-icon"><BarChart3 size={22} /></div>
                            <div className="stat-card-value">{report.totalSessions}</div>
                            <div className="stat-card-label">Sessions</div>
                        </div>
                        <div className="card stat-card green animate-in">
                            <div className="stat-card-icon"><Clock size={22} /></div>
                            <div className="stat-card-value">{report.totalHours}h</div>
                            <div className="stat-card-label">Total Hours</div>
                        </div>
                        <div className="card stat-card purple animate-in">
                            <div className="stat-card-icon"><TrendingUp size={22} /></div>
                            <div className="stat-card-value">
                                {report.totalSessions > 0 ? formatCurrency(report.totalExpense / report.totalSessions) : '₹0.00'}
                            </div>
                            <div className="stat-card-label">Avg per Session</div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="card animate-in" style={{ marginBottom: 24, animationDelay: '0.2s' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={18} style={{ color: 'var(--accent-yellow)' }} />
                            Expense Breakdown
                        </h3>
                        <div className="report-summary-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="report-summary-item">
                                <div className="value" style={{ color: 'var(--accent-blue)' }}>{formatCurrency(report.breakdown.court)}</div>
                                <div className="label">Court Booking</div>
                                {report.totalExpense > 0 && (
                                    <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bg-glass)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(report.breakdown.court / report.totalExpense * 100)}%`, background: 'var(--accent-blue)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                                    </div>
                                )}
                            </div>
                            <div className="report-summary-item">
                                <div className="value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(report.breakdown.shuttles)}</div>
                                <div className="label">Shuttles</div>
                                {report.totalExpense > 0 && (
                                    <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bg-glass)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(report.breakdown.shuttles / report.totalExpense * 100)}%`, background: 'var(--accent-green)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                                    </div>
                                )}
                            </div>
                            <div className="report-summary-item">
                                <div className="value" style={{ color: 'var(--accent-purple)' }}>{formatCurrency(report.breakdown.other)}</div>
                                <div className="label">Other</div>
                                {report.totalExpense > 0 && (
                                    <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bg-glass)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(report.breakdown.other / report.totalExpense * 100)}%`, background: 'var(--accent-purple)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Per-Player Breakdown Table */}
                    {report.playerExpenses && report.playerExpenses.length > 0 && (
                        <div className="card animate-in" style={{ animationDelay: '0.3s' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={18} style={{ color: 'var(--accent-green)' }} />
                                Player Breakdown
                            </h3>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Player</th>
                                            <th>Sessions</th>
                                            <th>Total Spent</th>
                                            <th>Current Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.playerExpenses
                                            .sort((a, b) => b.totalSpent - a.totalSpent)
                                            .map(player => (
                                                <tr key={player.playerId}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div className="player-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                                                                {player.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{player.name}</span>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge badge-blue">{player.sessionsPlayed}</span></td>
                                                    <td style={{ fontWeight: 600, color: 'var(--accent-yellow)' }}>{formatCurrency(player.totalSpent)}</td>
                                                    <td>
                                                        <span className={`badge ${player.currentBalance >= 0 ? 'badge-green' : 'badge-red'}`}>
                                                            {player.currentBalance >= 0 ? '+' : '-'}{formatCurrency(player.currentBalance)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
