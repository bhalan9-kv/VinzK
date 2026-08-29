import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { auth } from './api';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Library from './pages/Library';
import Interview from './pages/Interview';
import Progress from './pages/Progress';
import Scorecard from './pages/Scorecard';
import Analytics from './pages/Analytics';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/library" className="nav-brand" style={{ textDecoration: 'none' }}>⚡ CaseFlow</Link>
        <div className="nav-links">
          <Link to="/library"><button className="btn btn-ghost btn-sm">Library</button></Link>
          <Link to="/progress"><button className="btn btn-ghost btn-sm">Progress</button></Link>
          <Link to="/analytics"><button className="btn btn-ghost btn-sm">Analytics</button></Link>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 4px' }}>|</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.name || user.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); nav('/'); }}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cf_token');
    if (!token) { setLoading(false); return; }
    auth.me().then(d => setUser(d.user)).catch(() => localStorage.removeItem('cf_token')).finally(() => setLoading(false));
  }, []);

  const login = (email, password) =>
    auth.login(email, password).then(d => { localStorage.setItem('cf_token', d.token); setUser(d.user); return d; });

  const register = (email, password, name) =>
    auth.register(email, password, name).then(d => { localStorage.setItem('cf_token', d.token); setUser(d.user); return d; });

  const logout = () => { localStorage.removeItem('cf_token'); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={user ? <Navigate to="/library" replace /> : <AuthPage />} />
          <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
          <Route path="/interview/:caseId" element={<RequireAuth><Interview /></RequireAuth>} />
          <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/scorecard/:sessionId" element={<RequireAuth><Scorecard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthCtx.Provider>
  );
}

export default App;
