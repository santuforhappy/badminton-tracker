import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, DollarSign, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { getPlayers, getSessions, getReport } from '../services/api';

export default function Dashboard({ addToast }) {
    const [players, setPlayers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [p, s, r] = await Promise.all([
                getPlayers(),
                getSessions(),
                getReport('monthly'),
            ]);
            setPlayers(p);
            setSessions(s);
            setReport(r);
        } catch (err) {
            addToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    }

    const totalBalance = players.reduce((sum, p) => sum + p.balance, 0);
    const recentSessions = sessions.slice(0, 5);

    const formatCurrency = (amt) => `₹${Math.abs(amt).toFixed(2)}`;
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return { day: d.getDate(), month: d.toLocaleString('en', { month: 'short' }) };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                Loading dashboard...
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your badminton group expenses</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="card stat-card yellow animate-in">
                    <div className="stat-card-icon"><Users size={22} /></div>
                    <div className="stat-card-value">{players.length}</div>
                    <div className="stat-card-label">Active Players</div>
                </div>
                <div className="card stat-card green animate-in">
                    <div className="stat-card-icon"><DollarSign size={22} /></div>
                    <div className="stat-card-value">{formatCurrency(totalBalance)}</div>
                    <div className="stat-card-label">Total Balance Pool</div>
                </div>
                <div className="card stat-card blue animate-in">
                    <div className="stat-card-icon"><CalendarDays size={22} /></div>
                    <div className="stat-card-value">{report?.totalSessions || 0}</div>
                    <div className="stat-card-label">Sessions This Month</div>
                </div>
                <div className="card stat-card purple animate-in">
                    <div className="stat-card-icon"><Clock size={22} /></div>
                    <div className="stat-card-value">{report?.totalHours || 0}h</div>
                    <div className="stat-card-label">Hours Played This Month</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Player Balances */}
                <div className="card animate-in" style={{ animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Player Balances</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/players')}>
                            View All <ArrowRight size={14} />
                        </button>
                    </div>
                    {players.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px 10px' }}>
                            <p style={{ marginBottom: 0 }}>No players yet. Add some to get started!</p>
                        </div>
                    ) : (
                        <div>
                            {players.slice(0, 6).map(player => (
                                <div key={player.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 0', borderBottom: '1px solid var(--border-default)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="player-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                                            {player.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{player.name}</div>
                                            {player.contact && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{player.contact}</div>}
                                        </div>
                                    </div>
                                    <div className={`player-balance ${player.balance > 0 ? 'positive' : player.balance < 0 ? 'negative' : 'zero'}`}
                                        style={{ fontSize: 16 }}>
                                        {player.balance >= 0 ? '+' : '-'}{formatCurrency(player.balance)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Sessions */}
                <div className="card animate-in" style={{ animationDelay: '0.25s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Sessions</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/sessions')}>
                            View All <ArrowRight size={14} />
                        </button>
                    </div>
                    {recentSessions.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px 10px' }}>
                            <p style={{ marginBottom: 0 }}>No sessions recorded yet.</p>
                        </div>
                    ) : (
                        <div className="session-list">
                            {recentSessions.map(session => {
                                const { day, month } = formatDate(session.date);
                                return (
                                    <div key={session.id} className="session-card" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
                                        <div className="session-date-badge" style={{ width: 50, height: 50 }}>
                                            <span className="day" style={{ fontSize: 16 }}>{day}</span>
                                            <span className="month" style={{ fontSize: 10 }}>{month}</span>
                                        </div>
                                        <div className="session-info">
                                            <h4 style={{ fontSize: 14 }}>{session.duration}h session</h4>
                                            <div className="session-meta">
                                                <span><Users size={13} /> {session.players?.length || 0} players</span>
                                            </div>
                                        </div>
                                        <div className="session-amount" style={{ fontSize: 15 }}>
                                            {formatCurrency(session.totalExpense)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Expense Breakdown */}
            {report && report.totalExpense > 0 && (
                <div className="card animate-in" style={{ marginTop: 24, animationDelay: '0.3s' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                        <TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent-yellow)' }} />
                        Monthly Expense Breakdown
                    </h3>
                    <div className="report-summary-grid">
                        <div className="report-summary-item">
                            <div className="value" style={{ color: 'var(--accent-blue)' }}>{formatCurrency(report.breakdown.court)}</div>
                            <div className="label">Court Booking</div>
                        </div>
                        <div className="report-summary-item">
                            <div className="value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(report.breakdown.shuttles)}</div>
                            <div className="label">Shuttles</div>
                        </div>
                        <div className="report-summary-item">
                            <div className="value" style={{ color: 'var(--accent-purple)' }}>{formatCurrency(report.breakdown.other)}</div>
                            <div className="label">Other</div>
                        </div>
                        <div className="report-summary-item">
                            <div className="value" style={{ color: 'var(--accent-yellow)' }}>{formatCurrency(report.totalExpense)}</div>
                            <div className="label">Total</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
