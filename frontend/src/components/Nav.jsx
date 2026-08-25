import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import { getToken, getUser, clearSession } from "../lib/apiClient";

export const Nav = ({ onLogin }) => {
  const user = getUser();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const logout = () => { clearSession(); setOpen(false); nav("/"); };
  const go = (path) => { setOpen(false); nav(path); };

  return (
    <nav className="nav" data-testid="app-nav">
      <Link to="/" className="brand" data-testid="brand-home" onClick={() => setOpen(false)}>
        <span className="brand-mark">CI</span>
        <span className="brand-name">CASE<br/><b>INTERVIEWER</b></span>
      </Link>
      <div className={`nav-links ${open ? "open" : ""}`}>
        <Link to="/library" data-testid="nav-library-link" onClick={() => setOpen(false)} className={loc.pathname.startsWith("/library") ? "active" : ""}>Case library</Link>
        <Link to="/progress" data-testid="nav-progress-link" onClick={() => setOpen(false)} className={loc.pathname.startsWith("/progress") ? "active" : ""}>Your progress</Link>
        {open && (
          getToken() ? (
            <button className="mobile-cta" onClick={logout} data-testid="mobile-logout-button">
              Sign out <LogOut size={13}/>
            </button>
          ) : (
            <button className="mobile-cta" onClick={() => { setOpen(false); onLogin(); }} data-testid="mobile-signin-button">
              Sign in <ArrowRight size={13}/>
            </button>
          )
        )}
      </div>

      {getToken() && user ? (
        <div className="nav-user" data-testid="nav-user">
          <button className="nav-avatar" onClick={() => go("/progress")} data-testid="nav-avatar-button" aria-label="Open progress">
            {user.email.slice(0, 1).toUpperCase()}
          </button>
          <span className="nav-email">{user.email}</span>
          <button className="nav-logout" onClick={logout} data-testid="nav-logout-button" aria-label="Sign out">
            <LogOut size={14}/>
          </button>
        </div>
      ) : (
        <button className="nav-login" onClick={onLogin} data-testid="nav-login-button">
          Sign in <ArrowRight size={15}/>
        </button>
      )}

      <button className="nav-burger" onClick={() => setOpen(o => !o)} data-testid="nav-burger" aria-label="Toggle menu">
        {open ? <X size={20}/> : <Menu size={20}/>}
      </button>
    </nav>
  );
};
