import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Sparkles, Trophy, Send } from "lucide-react";
import { client } from "../lib/apiClient";

const DIMS = [["Structuring","structuring"],["Data efficiency","data_efficiency"],["Math accuracy","math_accuracy"],["Synthesis","synthesis"],["Creativity","creativity"]];

export const Session = ({ onAuth }) => {
  const { id } = useParams();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [caseMeta, setCaseMeta] = useState(null);
  const endRef = useRef(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    client().get(`/sessions/${id}`).then(r => {
      if (cancelled || hydratedRef.current) return;
      hydratedRef.current = true;
      setMessages(r.data.messages || []);
      setScore(r.data.score || null);
      setCaseMeta({ title: r.data.case_title, type: r.data.case_type });
    }).catch(e => {
      if (e?.response?.status === 401) onAuth?.();
      else if (e?.response?.status === 404) setError("This session no longer exists.");
    });
    return () => { cancelled = true; };
  }, [id, onAuth]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading, score]);

  const send = async e => {
    e.preventDefault();
    if (!text.trim() || loading || score) return;
    const msg = text;
    setText("");
    hydratedRef.current = true;
    setMessages(m => [...m, { role: "user", content: msg }]);
    setLoading(true); setError("");
    try {
      const r = await client().post(`/sessions/${id}/message`, { message: msg });
      setMessages(m => [...m, { role: "assistant", content: r.data.reply }]);
      if (r.data.score) setScore(r.data.score);
    } catch (e) {
      setError(e.response?.data?.detail || "The interviewer couldn't respond. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <main className="session">
      <header className="session-head">
        <Link to="/library" className="brand" data-testid="session-brand">
          <span className="brand-mark">CI</span>
          <span className="brand-name">CASE<br/><b>INTERVIEWER</b></span>
        </Link>
        <div className="session-meta">
          {caseMeta && <span className="session-title">{caseMeta.title} <em>· {caseMeta.type}</em></span>}
        </div>
        <span className="session-status"><span className="live-dot"/> SESSION IN PROGRESS</span>
      </header>
      <div className="session-body">
        <motion.aside className="session-aside" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{duration:0.6}}>
          <p className="eyebrow">LIVE CASE</p>
          <h1>Think out loud.<br/><em>Stay curious.</em></h1>
          <div className="rule"/>
          <p className="muted">The interviewer is listening for your <b>structure</b>, not a perfect first thought.</p>
          <div className="aside-stat">
            <Sparkles size={17}/>
            <span>Relevant questions<br/><b>earn more XP</b>. Vague asks cost you.</span>
          </div>
          <ol className="aside-steps">
            <li><span>01</span> Restate objective</li>
            <li><span>02</span> Lay out structure</li>
            <li><span>03</span> Ask for data</li>
            <li><span>04</span> Do the math out loud</li>
            <li><span>05</span> Deliver a <em>so-what</em></li>
          </ol>
        </motion.aside>

        <section className="chat">
          <div className="chat-label">
            <span>INTERVIEW TRANSCRIPT</span>
            <span>AI INTERVIEWER <span className="live-dot"/></span>
          </div>
          <div className="messages">
            {messages.length === 0 && (
              <motion.div className="empty-chat" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}}>
                <div className="avatar">CI</div>
                <h2>Your case is ready.</h2>
                <p>Kick off with your objective and initial structure. Data comes when you ask.</p>
              </motion.div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  className={`bubble-row ${m.role}`}
                  initial={{opacity:0, y:8}}
                  animate={{opacity:1, y:0}}
                  transition={{duration:0.35}}
                >
                  <div className="bubble-avatar">{m.role === "assistant" ? "CI" : "YOU"}</div>
                  <div className="bubble" data-testid={`chat-message-${m.role}-${i}`}>{m.content}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="bubble-row assistant">
                <div className="bubble-avatar">CI</div>
                <div className="bubble typing">Interviewer is thinking<span>•••</span></div>
              </div>
            )}
            {error && <div className="error" data-testid="chat-error">{error}</div>}
            {score && (
              <motion.section className="scorecard" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} data-testid="scorecard">
                <div className="score-banner">
                  <Trophy/>
                  <div>
                    <strong>Case complete · +{score.xp || 0} XP</strong>
                    <p>Your next edge starts here.</p>
                  </div>
                </div>
                <div className="score-details">
                  <div className="score-bars">
                    {DIMS.map(([label, key]) => (
                      <motion.div className="score-line" key={key} initial={{opacity:0}} animate={{opacity:1}}>
                        <span>{label}</span><b>{score[key] ?? 0}/100</b>
                        <i><motion.u initial={{width:0}} animate={{width:`${score[key] ?? 0}%`}} transition={{duration:0.9, ease:"easeOut"}}/></i>
                      </motion.div>
                    ))}
                  </div>
                  <p className="score-feedback" data-testid="scorecard-feedback">
                    {score.feedback || "Review the transcript and identify one sharper question to bring into your next rep."}
                  </p>
                  <div className="score-actions">
                    <Link className="score-link" to="/progress" data-testid="scorecard-progress-link">View history <ArrowRight size={15}/></Link>
                    <Link className="score-link secondary" to="/library" data-testid="scorecard-library-link">Next case <ArrowRight size={15}/></Link>
                  </div>
                </div>
              </motion.section>
            )}
            <div ref={endRef}/>
          </div>
          <form className="chat-form" onSubmit={send}>
            <input
              data-testid="chat-message-input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={score ? "Case complete — head to your progress" : "Ask a question or share your structure…"}
              disabled={!!score}
            />
            <button className="primary send" data-testid="chat-send-button" disabled={loading || !!score}>
              <Send size={15}/>
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
