import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Star, ChevronDown, Bookmark, Grid, Filter } from "lucide-react";
import { Nav } from "../components/Nav";
import { client, getToken } from "../lib/apiClient";
import { accentFor } from "../lib/accents";

export const Library = ({ onLogin }) => {
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [section, setSection] = useState("All");
  const [bookmarks, setBookmarks] = useState([]);
  const [tab, setTab] = useState("all"); // 'all' | 'saved'
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    client().get("/cases").then(r => setCases(r.data)).catch(() => setError("The case library is taking a moment to load."));
    if (getToken()) client().get("/bookmarks").then(r => setBookmarks(r.data)).catch(() => {});
  }, []);

  const start = async c => {
    if (!getToken()) { onLogin(); return; }
    setError("");
    setStarting(c.id);
    try {
      const r = await client().post(`/sessions?case_id=${c.id}`, {});
      window.location.href = `/session/${r.data.session_id}`;
    } catch (e) {
      setError(e.response?.data?.detail || "We couldn't start that case. Please try again.");
      setStarting(null);
    }
  };

  const toggleBookmark = async (c, e) => {
    e.stopPropagation();
    if (!getToken()) { onLogin(); return; }
    const saved = bookmarks.includes(c.id);
    try {
      if (saved) await client().delete(`/bookmarks/${c.id}`);
      else await client().post("/bookmarks", { case_id: c.id });
      setBookmarks(b => saved ? b.filter(id => id !== c.id) : [...b, c.id]);
    } catch { setError("We couldn't update your saved cases."); }
  };

  const sections = useMemo(() => [...new Set(cases.map(c => c.type))].sort(), [cases]);

  const filtered = useMemo(() => {
    const base = tab === "saved" ? cases.filter(c => bookmarks.includes(c.id)) : cases;
    return base
      .filter(c => `${c.title} ${c.type} ${(c.tags||[]).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
      .filter(c => difficulty === "All" || (c.difficulty || c.level) === difficulty)
      .filter(c => section === "All" || c.type === section);
  }, [cases, bookmarks, tab, query, difficulty, section]);

  return (
    <>
      <Nav onLogin={onLogin}/>
      <main className="page library">
        <div className="grain" aria-hidden/>
        <motion.div className="page-head" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>
          <div>
            <p className="eyebrow red">THE CASE LIBRARY · {cases.length} CASES</p>
            <h1>Pick your<br/><em>next rep.</em></h1>
          </div>
          <div className="library-tools">
            <p className="page-intro">FMS CaseBook practice, structured for live interview reps. Bookmark the ones you want to revisit.</p>
            <div className="search-wrap">
              <Search size={14}/>
              <input data-testid="case-search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, type, or tag…"/>
            </div>
          </div>
        </motion.div>

        <div className="tab-row">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab==="all"} className={`tab ${tab==="all"?"active":""}`} onClick={() => setTab("all")} data-testid="tab-all-button">
              <Grid size={13}/> All cases <span className="tab-count">{cases.length}</span>
            </button>
            <button role="tab" aria-selected={tab==="saved"} className={`tab ${tab==="saved"?"active":""}`} onClick={() => setTab("saved")} data-testid="tab-saved-button">
              <Bookmark size={13}/> Bookmarked <span className="tab-count">{bookmarks.length}</span>
            </button>
          </div>
          <div className="filter-bar">
            <Filter size={12} className="filter-icon"/>
            <label>Difficulty
              <select data-testid="difficulty-filter" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
              <ChevronDown size={13}/>
            </label>
            <label>Section
              <select data-testid="section-filter" value={section} onChange={e => setSection(e.target.value)}>
                <option>All</option>
                {sections.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={13}/>
            </label>
            <span className="result-count">{filtered.length} shown</span>
          </div>
        </div>

        {error && <div className="error" data-testid="library-error">{error}</div>}

        {tab === "saved" && !getToken() && (
          <div className="empty-state" data-testid="saved-signin-prompt">
            <Bookmark size={22}/>
            <h3>Bookmarks live with your account.</h3>
            <p>Sign in to save cases and revisit them later.</p>
            <button className="primary" onClick={onLogin} data-testid="saved-signin-button">Sign in <ArrowRight size={15}/></button>
          </div>
        )}

        {tab === "saved" && getToken() && bookmarks.length === 0 && (
          <div className="empty-state" data-testid="empty-saved">
            <Bookmark size={22}/>
            <h3>No bookmarks yet.</h3>
            <p>Star cases from the library to build your revision list.</p>
            <button className="primary" onClick={() => setTab("all")} data-testid="empty-saved-browse">Browse all cases <ArrowRight size={15}/></button>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          <motion.div className="case-grid" layout>
            {filtered.map((c, i) => {
              const accent = accentFor(c.type);
              const isSaved = bookmarks.includes(c.id);
              return (
                <motion.article
                  layout
                  key={c.id}
                  initial={{opacity:0, y:18}}
                  animate={{opacity:1, y:0}}
                  transition={{delay: Math.min(0.03*i, 0.4), duration:0.45}}
                  whileHover={{y:-6}}
                  className="case-card"
                  style={{"--accent": accent.hue}}
                  data-testid={`case-card-${c.slug}`}
                >
                  <div className="case-top">
                    <span className="case-number">CS·{String(i + 1).padStart(3, "0")}</span>
                    <span className="level">{c.difficulty || c.level}</span>
                    <button
                      className={`bookmark ${isSaved ? "saved" : ""}`}
                      onClick={(e) => toggleBookmark(c, e)}
                      aria-label={isSaved ? "Remove bookmark" : "Save case"}
                      data-testid={`bookmark-case-${c.slug}-button`}
                    >
                      <Star size={17} fill={isSaved ? "currentColor" : "none"}/>
                    </button>
                  </div>
                  <p className="case-type" style={{color: accent.hue}}>{c.type}</p>
                  <h2>{c.title}</h2>
                  <p className="case-prompt">{c.prompt}</p>
                  <div className="tags">
                    {(c.tags||[]).slice(0,3).map(t => <span key={t}>{t}</span>)}
                    {c.source_pages && <span className="page-tag">p.{c.source_pages}</span>}
                  </div>
                  <button
                    onClick={() => start(c)}
                    className="card-action"
                    disabled={starting === c.id}
                    data-testid={`start-case-${c.slug}-button`}
                  >
                    {starting === c.id ? "Loading interviewer…" : "Start case"}
                    <ArrowRight size={16}/>
                  </button>
                </motion.article>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
};
