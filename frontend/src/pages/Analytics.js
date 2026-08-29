import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { progress as progressApi, sessions as sessionsApi } from '../api';
import { motion } from 'framer-motion';

const TYPE_LABELS = {
  profitability: 'Profitability', market_entry: 'Market Entry', gtm: 'GTM',
  dd_ma: 'DD / M&A', guesstimate: 'Guesstimate', unconventional: 'Unconventional',
  revenues: 'Revenues', cost_reduction: 'Cost Reduction', growth: 'Growth',
  pricing: 'Pricing', customer_satisfaction: 'Customer Satisfaction',
};

const TYPE_COLORS = {
  profitability: '#00ff88', market_entry: '#00f0ff', gtm: '#a855f7',
  dd_ma: '#ff2daa', guesstimate: '#ffb800', unconventional: '#ff3b5c',
  revenues: '#00f0ff', cost_reduction: '#00ff88', growth: '#a855f7',
  pricing: '#ff2daa', customer_satisfaction: '#ffb800',
};

function MiniChart({ data, color = 'var(--cyan)', height = 60 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.score), 100);
  const min = Math.min(...data.map(d => d.score), 0);
  const range = max - min || 1;
  const width = 200;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((d.score - min) / range) * (height - 10) - 5,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

function RadarChart({ scores, size = 200 }) {
  const dims = Object.entries(scores || {});
  if (dims.length === 0) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 20;
  const angle = (2 * Math.PI) / dims.length;

  const points = dims.map(([key, val], i) => {
    const a = angle * i - Math.PI / 2;
    const score = val.score / 100;
    return { x: cx + r * score * Math.cos(a), y: cy + r * score * Math.sin(a) };
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map(level => (
        <polygon
          key={level}
          points={dims.map((_, i) => {
            const a = angle * i - Math.PI / 2;
            return `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`;
          }).join(' ')}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
        />
      ))}
      {/* Axes */}
      {dims.map((_, i) => {
        const a = angle * i - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="var(--border)" strokeWidth="0.5" />;
      })}
      {/* Data */}
      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(0,240,255,0.15)"
        stroke="var(--cyan)"
        strokeWidth="2"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--cyan)" />
      ))}
      {/* Labels */}
      {dims.map(([key, val], i) => {
        const a = angle * i - Math.PI / 2;
        const lx = cx + (r + 15) * Math.cos(a);
        const ly = cy + (r + 15) * Math.sin(a);
        const label = key.charAt(0).toUpperCase() + key.slice(1, 4);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">
            {label} {val.score}
          </text>
        );
      })}
    </svg>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([progressApi.get(), sessionsApi.list()]).then(([p, s]) => {
      setStats(p);
      setSessions(s.sessions.filter(s => s.completed));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: 'var(--text-muted)' }}>
      Loading analytics...
    </div>
  );

  // Aggregate scores from all completed sessions
  const allScores = { structure: [], hypothesis: [], quantitative: [], communication: [], insight: [] };
  // We only have overall score from session list, so use that
  const scoreHistory = sessions.map(s => ({ score: s.overall_score || 0, date: s.started_at }));

  const avgScore = stats?.average_score || 0;
  const totalXP = stats?.total_xp || 0;
  const completed = stats?.completed_sessions || 0;

  // Level calculation
  const level = Math.floor(totalXP / 500) + 1;
  const xpInLevel = totalXP % 500;
  const xpToNext = 500;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>
            Performance Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
            Deep insights into your case interview performance
          </p>
        </motion.div>

        {/* Level & XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ marginBottom: '24px', padding: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: '#000',
              flexShrink: 0,
            }}>
              {level}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '4px' }}>
                Level {level} Consultant
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                {xpInLevel} / {xpToNext} XP to next level
              </p>
              <div className="score-bar" style={{ height: '10px' }}>
                <div className="score-bar-fill" style={{ width: `${(xpInLevel / xpToNext) * 100}%` }} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="gradient-text" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700 }}>
                {totalXP}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total XP</div>
            </div>
          </div>
        </motion.div>

        {/* Score trend chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Score Trend
            </h3>
            {scoreHistory.length >= 2 ? (
              <MiniChart data={scoreHistory.slice().reverse()} color="#00f0ff" height={80} />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                Complete 2+ sessions to see trend
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Oldest</span>
              <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Avg: {avgScore}</span>
              <span>Latest</span>
            </div>
          </motion.div>

          {/* Stats summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Quick Stats
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Sessions', value: completed, color: 'var(--cyan)' },
                { label: 'Avg Score', value: avgScore, color: 'var(--green)' },
                { label: 'Streak', value: `${stats?.streak || 0}d`, color: 'var(--magenta)' },
                { label: 'Best Type', value: TYPE_LABELS[stats?.strongest_type]?.slice(0, 8) || '—', color: 'var(--amber)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Case type breakdown */}
        {Object.keys(stats?.case_type_distribution || {}).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
            style={{ marginBottom: '24px' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '20px', color: 'var(--text-secondary)' }}>
              Case Type Experience
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {Object.entries(stats.case_type_distribution)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} style={{
                    padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
                    borderLeft: `3px solid ${TYPE_COLORS[type] || 'var(--cyan)'}`,
                  }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {TYPE_LABELS[type] || type}
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>
                      {count} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>sessions</span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Recent sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Recent Sessions
            </h3>
            <Link to="/progress"><button className="btn btn-ghost btn-sm">View All →</button></Link>
          </div>
          {sessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No sessions yet</p>
              <Link to="/library"><button className="btn btn-primary">Start Practicing →</button></Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.slice(0, 5).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: s.overall_score >= 70 ? 'var(--green)' : s.overall_score >= 40 ? 'var(--amber)' : 'var(--red)',
                    }} />
                    <div>
                      <div style={{ fontSize: '0.9rem' }}>{s.case_title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {TYPE_LABELS[s.case_type] || s.case_type} · {new Date(s.started_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {s.timed && <span className="tag tag-cyan" style={{ fontSize: '0.65rem' }}>⏱️</span>}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1.1rem',
                      color: s.overall_score >= 70 ? 'var(--green)' : s.overall_score >= 40 ? 'var(--amber)' : 'var(--red)',
                    }}>
                      {s.overall_score}
                    </span>
                    <Link to={`/scorecard/${s.id}`}><button className="btn btn-ghost btn-sm">→</button></Link>
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
