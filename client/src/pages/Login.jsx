import { useState } from 'react';
import { Lock, Eye, EyeOff, Zap } from 'lucide-react';

export default function Login({ onLogin }) {
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!pin.trim()) {
            setError('Please enter the access PIN');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                localStorage.setItem('bb_auth', data.token);
                onLogin(data.token);
            } else {
                setError(data.error || 'Invalid PIN');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <Zap size={32} />
                    </div>
                    <h1>Bolt Badminton Club</h1>
                    <p>Enter your access PIN to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Access PIN</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute', left: 14, top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--text-muted)'
                            }} />
                            <input
                                className="form-input"
                                type={showPin ? 'text' : 'password'}
                                placeholder="Enter PIN"
                                value={pin}
                                onChange={e => { setPin(e.target.value); setError(''); }}
                                style={{ paddingLeft: 42, paddingRight: 42 }}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                style={{
                                    position: 'absolute', right: 10, top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4
                                }}
                            >
                                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            color: 'var(--accent-red)', fontSize: 13,
                            marginBottom: 16, padding: '8px 12px',
                            background: 'var(--accent-red-soft)', borderRadius: 'var(--radius-sm)'
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}>
                        {loading ? 'Verifying...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    🏸 Built for badminton lovers
                </div>
            </div>
        </div>
    );
}
