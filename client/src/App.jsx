import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, BarChart3, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Sessions from './pages/Sessions';
import Reports from './pages/Reports';
import Toast from './components/Toast';

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99,
        display: window.innerWidth <= 768 ? 'block' : 'none'
      }} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏸</div>
          <div>
            <h1>ShuttleBooks</h1>
            <span>Expense Tracker</span>
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
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Built with 🏸 for badminton lovers
          </div>
        </div>
      </aside>
    </>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard addToast={addToast} />} />
          <Route path="/players" element={<Players addToast={addToast} />} />
          <Route path="/sessions" element={<Sessions addToast={addToast} />} />
          <Route path="/reports" element={<Reports addToast={addToast} />} />
        </Routes>
      </main>
      <Toast toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
