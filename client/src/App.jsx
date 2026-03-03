import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, BarChart3, Menu, X, LogOut, Shield, Eye, Package } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Sessions from './pages/Sessions';
import Reports from './pages/Reports';
import Barrels from './pages/Barrels';
import Login from './pages/Login';
import Toast from './components/Toast';

function Sidebar({ isOpen, onClose, onLogout, role }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99,
        display: window.innerWidth <= 768 ? 'block' : 'none'
      }} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><img src="/icon.png" alt="Bolt" style={{ width: 32, height: 32, objectFit: 'contain' }} /></div>
          <div>
            <h1>Bolt Badminton</h1>
            <span>Club Manager</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose} end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/players" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Users size={20} />
            Players
          </NavLink>
          <NavLink to="/sessions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <CalendarDays size={20} />
            Sessions
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <BarChart3 size={20} />
            Reports
          </NavLink>
          <NavLink to="/barrels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Package size={20} />
            Barrels
          </NavLink>
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: role === 'admin' ? 'var(--accent-yellow-soft)' : 'var(--accent-blue-soft)',
            fontSize: 12, fontWeight: 600,
            color: role === 'admin' ? 'var(--accent-yellow)' : 'var(--accent-blue)'
          }}>
            {role === 'admin' ? <Shield size={14} /> : <Eye size={14} />}
            {role === 'admin' ? 'Admin Access' : 'View Only'}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onLogout}
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function AppContent({ onLogout, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const isAdmin = role === 'admin';

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} role={role} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard addToast={addToast} isAdmin={isAdmin} />} />
          <Route path="/players" element={<Players addToast={addToast} isAdmin={isAdmin} />} />
          <Route path="/sessions" element={<Sessions addToast={addToast} isAdmin={isAdmin} />} />
          <Route path="/reports" element={<Reports addToast={addToast} isAdmin={isAdmin} />} />
          <Route path="/barrels" element={<Barrels addToast={addToast} isAdmin={isAdmin} />} />
        </Routes>
      </main>
      <Toast toasts={toasts} />
    </div>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('bb_auth'));
  const [role, setRole] = useState(localStorage.getItem('bb_role'));

  function handleLogin(token, userRole) {
    setAuthToken(token);
    setRole(userRole);
  }

  function handleLogout() {
    localStorage.removeItem('bb_auth');
    localStorage.removeItem('bb_role');
    setAuthToken(null);
    setRole(null);
  }

  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${authToken}` }
      }).then(res => {
        if (!res.ok) handleLogout();
        else return res.json();
      }).then(data => {
        if (data?.role) setRole(data.role);
      }).catch(() => handleLogout());
    }
  }, []);

  if (!authToken) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <AppContent onLogout={handleLogout} role={role} />
    </Router>
  );
}
