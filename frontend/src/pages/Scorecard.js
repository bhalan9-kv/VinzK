import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sessions } from '../api';
import { motion } from 'framer-motion';

const DIM_LABELS = {
  structure: { label: 'Structure', icon: '🏗️', color: 'var(--cyan)' },
  hypothesis: { label: 'Hypothesis', icon: '💡', color: 'var(--magenta)' },
  quantitative: { label: 'Quantitative', icon: '📊', color: 'var(--green)' },
  communication: { label: 'Communication', icon: '💬', color: 'var(--purple)' },
  insight: { label: 'Insight', icon: '🎯', color: 'var(--amber)' },
};

function ScoreBar({ score, label, icon, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
          <span>{icon}</span> {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color }}>{score}</span>
      </div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Scorecard() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessions.get(sessionId).then(d => {
      setSession(d.session);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: 'var(--text-muted)' }}>
      Loading scorecard...
    </div>
  );

  if (!session) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: 'var(--text-muted)' }}>
      Session not found.
    </div>
  );

  const sc = session.scorecard;
  if (!sc) return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</p>
      <p>This session hasn't been scored yet.</p>
    </div>
  );

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            {sc.terminated_early ? (
              <div style={{
                padding: '16px 24px', marginBottom: '24px',
                background: 'linear-gradient(135deg, rgba(255,45,45,0.15), rgba(255,45,45,0.05))',
                border: '1px solid rgba(255,45,45,0.3)',
                borderRadius: 'var(--radius)',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⛔</div>
                <h3 style={{ color: '#ff2d2d', fontFamily: 'var(--font-heading)', marginBottom: '8px', fontSize: '1.1rem' }}>
                  Interview Ended Early
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {sc.termination_reason || 'The interviewer ended the session due to insufficient performance.'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                  In real consulting interviews, interviewers can end early if the candidate is clearly not meeting the bar.
                </p>
              </div>
            ) : (
              <span className="tag tag-green" style={{ marginBottom: '12px', display: 'inline-block' }}>
                {session.timed ? '⏱️ Timed Session' : '🧘 Untimed Session'}
              </span>
            )}
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>
              {sc.terminated_early ? 'Session Concluded' : 'Session Complete'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>{session.case_title}</p>
          </div>

          {/* Overall score */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{
              textAlign: 'center', marginBottom: '40px',
              padding: '40px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '4rem',
              fontWeight: 700,
              lineHeight: 1,
            }} className="gradient-text">
              {sc.overall}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '8px' }}>
              Overall Score
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="tag tag-green">+{sc.xp_earned || 0} XP</span>
              {sc.time_bonus > 0 && (
                <span className="tag tag-cyan">⏱️ +{sc.time_bonus} Time Bonus</span>
              )}
              {sc.recommendation && (
                <span className="tag tag-purple">{sc.recommendation}</span>
              )}
            </div>
          </motion.div>

          {/* Dimension scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
            style={{ marginBottom: '32px' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '24px', fontSize: '1.1rem' }}>
              Dimension Scores
            </h3>
            {Object.entries(DIM_LABELS).map(([key, info], i) => {
              const s = sc.scores?.[key];
              return s ? (
                <ScoreBar
                  key={key}
                  score={s.score}
                  label={info.label}
                  icon={info.icon}
                  color={info.color}
                  delay={600 + i * 200}
                />
              ) : null;
            })}
          </motion.div>

          {/* Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card"
            style={{ marginBottom: '32px' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '16px', fontSize: '1.1rem' }}>
              Feedback
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
              {sc.summary}
            </p>

            {sc.strengths?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--green)', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                  ✅ Strengths
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {sc.strengths.map((s, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', padding: '6px 0', fontSize: '0.95rem' }}>
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sc.improvements?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--amber)', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
                  🔧 Areas to Improve
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {sc.improvements.map((s, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', padding: '6px 0', fontSize: '0.95rem' }}>
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Dimension details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="card"
            style={{ marginBottom: '32px' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '16px', fontSize: '1.1rem' }}>
              Detailed Breakdown
            </h3>
            {Object.entries(DIM_LABELS).map(([key, info]) => {
              const s = sc.scores?.[key];
              return s ? (
                <div key={key} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.95rem' }}>{info.icon} {info.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: info.color }}>{s.score}/100</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.reason}</p>
                </div>
              ) : null;
            })}
          </motion.div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/library">
              <button className="btn btn-primary">Try Another Case →</button>
            </Link>
            <Link to="/progress">
              <button className="btn btn-secondary">View Progress</button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
