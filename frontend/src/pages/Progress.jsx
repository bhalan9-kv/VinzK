import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, LockKeyhole, Flame, TrendingUp, Award, Sparkles } from "lucide-react";
import { Nav } from "../components/Nav";
import { client, getToken, getUser } from "../lib/apiClient";
import { accentFor } from "../lib/accents";

const DIMS = [
  ["Structuring","structuring"],
  ["Data efficiency","data_efficiency"],
  ["Math accuracy","math_accuracy"],
  ["Synthesis","synthesis"],
  ["Creativity","creativity"],
];

const LEVELS = [
  { xp: 0,    name: "Rookie" },
  { xp: 300,  name: "Analyst" },
  { xp: 800,  name: "Associate" },
  { xp: 1600, name: "Senior Associate" },
  { xp: 2600, name: "Engagement Manager" },
  { xp: 4000, name: "Partner" },
];

const levelFor = (xp) => {
  let level = LEVELS[0];
  let next = LEVELS[LEVELS.length - 1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) level = LEVELS[i];
    if (LEVELS[i].xp > xp) { next = LEVELS[i]; break; }
  }
  const start = level.xp;
  const end = next.xp === level.xp ? level.xp + 500 : next.xp;
  const pct = Math.min(100, Math.round(((xp - start) / (end - start)) * 100));
  return { level, next, pct, remaining: Math.max(0, end - xp) };
};

export const Progress = ({ onLogin }) => {
  const [tab, setTab] = useState("summary");
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const user = getUser();

  useEffect(() => {
    if (getToken()) client().get("/progress").then(r => setData(r.data)).catch(() => setData({ xp:0, completed:0, sessions: [] }));
  }, []);

  const streakDays = useMemo(() => {
    const days = new Set((data?.sessions || []).map(s => (s.completed_at || s.created_at || "").slice(0, 10)));
    let count = 0;
    const d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    // Always build last-7-days dots so the widget stays symmetric
    const dots = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - i);
      dots.push({ date: dt.toISOString().slice(0,10), active: days.has(dt.toISOString().slice(0,10)) });
    }
    return { count, dots };
  }, [data]);

  const bestType = useMemo(() => {
    if (!data?.sessions?.length) return null;
    const byType = {};
    for (const s of data.sessions) {
      byType[s.case_type] = (byType[s.case_type] || 0) + (s.xp_awarded || 0);
    }
    const arr = Object.entries(byType).sort((a,b) => b[1]-a[1]);
    return arr[0] ? { type: arr[0][0], xp: arr[0][1] } : null;
  }, [data]);

  const typeBreakdown = useMemo(() => {
    if (!data?.sessions?.length) return [];
    const byType = {};
    for (const s of data.sessions) {
      byType[s.case_type] = byType[s.case_type] || { count: 0, xp: 0 };
      byType[s.case_type].count += 1;
      byType[s.case_type].xp += (s.xp_awarded || 0);
    }
    return Object.entries(byType).map(([type, v]) => ({ type, ...v })).sort((a,b) => b.xp - a.xp);
  }, [data]);

  const avgScore = useMemo(() => {
    if (!data?.sessions?.length) return null;
    const scored = data.sessions.filter(s => s.score);
    if (!scored.length) return null;
    const avg = (key) => Math.round(scored.reduce((a, s) => a + (s.score[key] || 0), 0) / scored.length);
    return { structuring: avg("structuring"), data_efficiency: avg("data_efficiency"), math_accuracy: avg("math_accuracy"), synthesis: avg("synthesis"), creativity: avg("creativity") };
  }, [data]);

  if (!getToken()) {
    return (
      <>
        <Nav onLogin={onLogin}/>
        <main className="page progress">
          <div className="grain" aria-hidden/>
          <div className="page-head">
            <div>
              <p className="eyebrow red">YOUR PRACTICE LOG</p>
              <h1>Make the reps<br/><em>add up.</em></h1>
            </div>
            <p className="page-intro">A clear view of your consistency, case range, and earned edge.</p>
          </div>
          <div className="sign-in-prompt">
            <LockKeyhole/>
            <h2>Your progress is private.</h2>
            <p>Sign in to see your scorecards, past sessions, and earned XP.</p>
            <button onClick={onLogin} className="primary" data-testid="progress-signin-button">Sign in <ArrowRight size={16}/></button>
          </div>
        </main>
      </>
    );
  }

  const totalXp = data?.xp || 0;
  const { level, next, pct, remaining } = levelFor(totalXp);

  return (
    <>
      <Nav onLogin={onLogin}/>
      <main className="page progress">
        <div className="grain" aria-hidden/>

        <motion.div className="page-head" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}}>
          <div>
            <p className="eyebrow red">YOUR PRACTICE LOG</p>
            <h1>Make the reps<br/><em>add up.</em></h1>
          </div>
          <p className="page-intro">Track your consistency, case range, and earned edge across every scorecard.</p>
        </motion.div>

        {/* Hero level card */}
        <motion.section
          className="level-card"
          initial={{opacity:0, y:20}}
          animate={{opacity:1, y:0}}
          transition={{duration:0.6}}
          data-testid="level-card"
        >
          <div className="level-left">
            <div className="level-badge">
              <Award size={22}/>
              <span>{level.name}</span>
            </div>
            <div className="level-user">Signed in as <b>{user?.email}</b></div>
            <div className="level-xp"><span>{totalXp}</span></div>
            <div className="level-progress">
              <div className="level-bar"><motion.i initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1, ease:"easeOut"}}/></div>
              <div className="level-meta">
                {totalXp >= LEVELS[LEVELS.length-1].xp
                  ? <span>Max rank achieved. Keep sharpening.</span>
                  : <span>{remaining} XP to <b>{next.name}</b></span>}
              </div>
            </div>
          </div>
          <div className="level-right">
            <div className="streak-block">
              <div className="streak-label"><Flame size={13}/> STREAK</div>
              <div className="streak-count" data-testid="streak-count">
                <span className="streak-num">{streakDays.count}</span>
                <span className="streak-unit">day{streakDays.count === 1 ? "" : "s"}</span>
              </div>
              <div className="streak-dots" aria-label="Last 7 days">
                {streakDays.dots.map((d, i) => (
                  <span key={i} className={`streak-dot ${d.active ? "on" : ""}`} title={d.date}/>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <div className="tab-row solo">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab==="summary"} className={`tab ${tab==="summary"?"active":""}`} onClick={()=>setTab("summary")} data-testid="tab-summary-button">Summary</button>
            <button role="tab" aria-selected={tab==="history"} className={`tab ${tab==="history"?"active":""}`} onClick={()=>setTab("history")} data-testid="tab-history-button">
              History <span className="tab-count">{data?.completed || 0}</span>
            </button>
          </div>
        </div>

        {tab === "summary" && (
          <>
            <div className="stats" data-testid="progress-stats">
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                <span>CASES COMPLETED</span>
                <strong data-testid="progress-completed">{data?.completed || 0}</strong>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.05}}>
                <span>TOTAL XP</span>
                <strong data-testid="progress-xp">{totalXp}</strong>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}}>
                <span><TrendingUp size={11} style={{verticalAlign:"middle", marginRight:5}}/>STRONGEST TYPE</span>
                <strong className="stat-lg">{bestType?.type || "—"}</strong>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.15}}>
                <span><Sparkles size={11} style={{verticalAlign:"middle", marginRight:5}}/>CASE RANGE</span>
                <strong>{typeBreakdown.length}<em className="stat-unit">/12</em></strong>
              </motion.div>
            </div>

            {avgScore && (
              <section className="avg-panel" data-testid="avg-panel">
                <div className="avg-head">
                  <h2>Where you&apos;re strongest</h2>
                  <span className="muted-inline">Average across {data.sessions.filter(s=>s.score).length} scored sessions</span>
                </div>
                <div className="score-bars">
                  {DIMS.map(([label, key]) => (
                    <div className="score-line" key={key}>
                      <span>{label}</span><b>{avgScore[key]}/100</b>
                      <i><motion.u initial={{width:0}} animate={{width:`${avgScore[key]}%`}} transition={{duration:0.8}}/></i>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {typeBreakdown.length > 0 && (
              <section className="type-panel" data-testid="type-panel">
                <div className="avg-head">
                  <h2>By case type</h2>
                  <span className="muted-inline">Where you&apos;ve invested your reps</span>
                </div>
                <div className="type-list">
                  {typeBreakdown.map(t => (
                    <div className="type-row" key={t.type} style={{"--accent": accentFor(t.type).hue}}>
                      <span className="type-dot"/>
                      <span className="type-name">{t.type}</span>
                      <span className="type-count">{t.count} rep{t.count === 1 ? "" : "s"}</span>
                      <b className="type-xp">+{t.xp} XP</b>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="recent">
              <div className="avg-head">
                <h2>Recent scorecards</h2>
                <button className="link-btn" onClick={() => setTab("history")} data-testid="see-all-history">See all <ArrowRight size={14}/></button>
              </div>
              {data?.sessions?.length ? (
                data.sessions.slice(0, 5).map(s => (
                  <button key={s.id} className="history-row" onClick={() => { setTab("history"); setExpanded(s.id); }} data-testid={`recent-row-${s.id}`}>
                    <span className="history-icon" style={{borderColor: accentFor(s.case_type).hue, color: accentFor(s.case_type).hue}}><Check size={14}/></span>
                    <div>
                      <strong>{s.case_title}</strong>
                      <span>{s.case_type}</span>
                    </div>
                    <b>+{s.xp_awarded} XP</b>
                  </button>
                ))
              ) : (
                <div className="empty-history">
                  Your first score is waiting in the case library.
                  <Link to="/library" className="primary small-cta" data-testid="empty-summary-browse">Browse cases <ArrowRight size={14}/></Link>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "history" && (
          <div className="history">
            {data?.sessions?.length ? data.sessions.map(s => (
              <motion.article
                key={s.id}
                layout
                initial={{opacity:0, y:10}}
                animate={{opacity:1, y:0}}
                className={`history-card ${expanded === s.id ? "open" : ""}`}
                style={{"--accent": accentFor(s.case_type).hue}}
                data-testid={`history-card-${s.id}`}
              >
                <button
                  className="history-card-head"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  data-testid={`history-toggle-${s.id}`}
                >
                  <div className="history-title">
                    <span className="history-icon"><Check size={14}/></span>
                    <div>
                      <strong>{s.case_title}</strong>
                      <span>{s.case_type} · {(s.completed_at || s.created_at || "").slice(0, 10)}</span>
                    </div>
                  </div>
                  <div className="history-xp">+{s.xp_awarded} XP</div>
                </button>
                {expanded === s.id && s.score && (
                  <motion.div
                    className="history-detail"
                    initial={{opacity:0, height:0}}
                    animate={{opacity:1, height:"auto"}}
                  >
                    <div className="score-bars">
                      {DIMS.map(([label, key]) => (
                        <div className="score-line" key={key}>
                          <span>{label}</span><b>{s.score[key] ?? 0}/100</b>
                          <i><motion.u initial={{width:0}} animate={{width:`${s.score[key] ?? 0}%`}} transition={{duration:0.7}}/></i>
                        </div>
                      ))}
                    </div>
                    <p className="score-feedback">{s.score.feedback}</p>
                    <div className="score-actions">
                      <Link to={`/session/${s.id}`} className="score-link" data-testid={`history-replay-${s.id}`}>View transcript <ArrowRight size={14}/></Link>
                    </div>
                  </motion.div>
                )}
              </motion.article>
            )) : (
              <div className="empty-state">
                <h3>No completed sessions yet.</h3>
                <p>Finish a case in the library to see your first scorecard here.</p>
                <Link to="/library" className="primary" data-testid="history-empty-browse">Open case library <ArrowRight size={15}/></Link>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};
