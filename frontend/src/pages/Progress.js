import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { progress as progressApi, sessions as sessionsApi } from '../api';
import { motion } from 'framer-motion';

const TYPE_COLORS = {
  profitability: 'var(--green)',
  market_entry: 'var(--cyan)',
  gtm: 'var(--purple)',
  dd_ma: 'var(--magenta)',
  guesstimate: 'var(--amber)',
  unconventional: 'var(--red)',
  revenues: 'var(--cyan)',
  cost_reduction: 'var(--green)',
  growth: 'var(--purple)',
  pricing: 'var(--magenta)',
  customer_satisfaction: 'var(--amber)',
};

const TYPE_LABELS = {
  profitability: 'Profitability',
  market_entry: 'Market Entry',
  gtm: 'GTM',
  dd_ma: 'DD / M&A',
  guesstimate: 'Guesstimate',
  unconventional: 'Unconventional',
  revenues: 'Revenues',
  cost_reduction: 'Cost Reduction',
  growth: 'Growth',
  pricing: 'Pricing',
  customer_satisfaction: 'Customer Satisfaction',
};

export default function Progress() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([progressApi.get(), sessionsApi.list()]).then(([p, s]) => {
      setStats(p);
      setHistory(s.sessions);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: 'var(--text-muted)' }}>
      Loading progress...
    </div>
  );

  const dist = stats?.case_type_distribution || {};
  const maxCount = Math.max(...Object.values(dist), 1);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>
            Your Progress
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
            Track your improvement across sessions
          </p>
        </motion.div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Total XP', value: stats?.total_xp || 0, icon: '⭐', color: 'var(--amber)' },
            { label: 'Sessions', value: stats?.completed_sessions || 0, icon: '📝', color: 'var(--cyan)' },
            { label: 'Streak', value: `${stats?.streak || 0} days`, icon: '🔥', color: 'var(--magenta)' },
            { label: 'Avg Score', value: stats?.average_score || 0, icon: '📊', color: 'var(--green)' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ textAlign: 'center', padding: '24px' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Strongest type */}
        {stats?.strongest_type && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="card"
            style={{ marginBottom: '32px', padding: '20px 24px' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Strongest case type: </span>
            <span style={{
              color: TYPE_COLORS[stats.strongest_type] || 'var(--cyan)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
            }}>
              {TYPE_LABELS[stats.strongest_type] || stats.strongest_type}
            </span>
          </motion.div>
        )}

        {/* Case type distribution */}
        {Object.keys(dist).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
            style={{ marginBottom: '32px' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '20px' }}>
              Case Type Distribution
            </h3>
            {Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.9rem' }}>{TYPE_LABELS[type] || type}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{count}</span>
                </div>
                <div className="score-bar">
                  <div style={{
                    height: '100%', borderRadius: '100px',
                    background: TYPE_COLORS[type] || 'var(--cyan)',
                    width: `${(count / maxCount) * 100}%`,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Session history */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '20px' }}>
            Recent Sessions
          </h3>
          {history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No sessions yet. Start practicing!</p>
              <Link to="/library">
                <button className="btn btn-primary">Browse Cases →</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.slice(0, 20).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="card"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', flexWrap: 'wrap', gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: s.completed ? 'var(--green)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>{s.case_title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {TYPE_LABELS[s.case_type] || s.case_type} · {new Date(s.started_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {s.timed && <span className="tag tag-cyan" style={{ fontSize: '0.7rem' }}>⏱️ Timed</span>}
                    {s.completed && s.overall_score != null && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 600,
                        color: s.overall_score >= 70 ? 'var(--green)' : s.overall_score >= 40 ? 'var(--amber)' : 'var(--red)',
                      }}>
                        {s.overall_score}
                      </span>
                    )}
                    {s.xp_earned > 0 && (
                      <span className="tag tag-amber" style={{ fontSize: '0.7rem' }}>+{s.xp_earned} XP</span>
                    )}
                    {s.completed && (
                      <Link to={`/scorecard/${s.id}`}>
                        <button className="btn btn-ghost btn-sm">View →</button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
