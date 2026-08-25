import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { client, setSession } from "../lib/apiClient";

export const Auth = ({ close, banner }) => {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await client().post(register ? "/auth/register" : "/auth/login", { email, password });
      setSession(r.data.token, r.data.user);
      close();
      nav("/library");
    } catch (x) {
      setError(x.response?.data?.detail || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} data-testid="auth-overlay">
      <motion.div
        className="auth-panel"
        initial={{y:40,opacity:0}}
        animate={{y:0,opacity:1}}
        transition={{type:"spring", stiffness:220, damping:24}}
      >
        <button className="close" onClick={close} data-testid="auth-close-button" aria-label="Close"><X/></button>
        <p className="eyebrow">MEMBER ACCESS</p>
        <h2>{register ? "Create your practice room" : "Welcome back"}</h2>
        <p className="muted">Your cases, scorecards, and momentum — kept in one place.</p>
        {banner && <div className="auth-banner" data-testid="auth-banner">{banner}</div>}
        <form onSubmit={submit}>
          <label>Email
            <input data-testid="auth-email-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu" autoFocus/>
          </label>
          <label>Password
            <input data-testid="auth-password-input" type="password" required minLength="8" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/>
          </label>
          {error && <div className="error" data-testid="auth-error">{error}</div>}
          <button className="primary full" data-testid="auth-submit-button" disabled={busy}>
            {busy ? "Working…" : (register ? "Create account" : "Sign in")}<ArrowRight size={17}/>
          </button>
        </form>
        <button className="text-button" onClick={() => setRegister(!register)} data-testid="auth-toggle-button">
          {register ? "Already a member? Sign in" : "New here? Create an account"}
        </button>
      </motion.div>
    </motion.div>
  );
};
