import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  { icon: '🧠', title: 'Socratic AI Interviewer', desc: 'An AI that thinks like a McKinsey partner — it asks, never tells.' },
  { icon: '⏱️', title: 'Timed Interview Mode', desc: 'Practice under real pressure with countdown timers and time-bonus scoring.' },
  { icon: '📊', title: '5-Dimension Scoring', desc: 'Get scored on Structure, Hypothesis, Quant, Communication, and Insight.' },
  { icon: '📚', title: '95+ Real Cases', desc: 'From profitability to M&A to guesstimates — the full FMS casebook.' },
  { icon: '🏆', title: 'XP & Progress Tracking', desc: 'Level up across sessions, track streaks, and find your strongest case type.' },
  { icon: '💾', title: 'Bookmark & Review', desc: 'Save cases for later, review past scorecards, and watch your improvement.' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] } }),
};

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient glow orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '15%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,45,170,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ marginBottom: '24px' }}>
            <span className="tag tag-cyan" style={{ marginBottom: '16px' }}>AI-Powered Case Practice</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: '24px',
          }}>
            Interview like a<br />
            <span className="gradient-text">McKinsey Partner</span>
            <br />
            is watching.
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            CaseFlow is an AI case interviewer that asks the hard questions, pushes your
            framework, and scores you across five dimensions — just like the real thing.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth">
              <button className="btn btn-primary btn-lg" style={{ fontSize: '1.05rem' }}>
                Start Practicing →
              </button>
            </Link>
            <a href="#features">
              <button className="btn btn-secondary btn-lg">
                See How It Works
              </button>
            </a>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            display: 'flex', gap: '48px', marginTop: '80px',
            flexWrap: 'wrap', justifyContent: 'center',
          }}
        >
          {[
            { num: '95+', label: 'Real Cases' },
            { num: '6', label: 'Case Types' },
            { num: '5', label: 'Score Dimensions' },
            { num: '∞', label: 'Practice Runs' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700 }} className="gradient-text">{s.num}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '80px' }}>
          <motion.span className="tag tag-magenta" custom={0} variants={fadeIn} style={{ marginBottom: '16px', display: 'inline-block' }}>Features</motion.span>
          <motion.h2 custom={1} variants={fadeIn} style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: 'var(--font-heading)' }}>
            Everything you need to <span className="gradient-text">ace your case</span>
          </motion.h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="card card-glow"
              style={{ cursor: 'default' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '120px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,240,255,0.03) 50%, transparent 100%)',
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: 'var(--font-heading)', marginBottom: '20px' }}>
            Ready to level up?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
            Join now and start practicing with 95+ real consulting cases.
          </p>
          <Link to="/auth">
            <button className="btn btn-primary btn-lg">
              Get Started Free →
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px', textAlign: 'center',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)', fontSize: '0.85rem',
      }}>
        <span className="nav-brand" style={{ fontSize: '1rem' }}>⚡ CaseFlow</span>
        <p style={{ marginTop: '8px' }}>AI-powered case interview practice. Built for aspiring consultants.</p>
      </footer>
    </div>
  );
}
