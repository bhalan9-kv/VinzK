import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cases as casesApi, sessions as sessionsApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TimerDisplay({ seconds, limit }) {
  const pct = limit > 0 ? seconds / limit : 1;
  const cls = pct > 0.5 ? 'timer-safe' : pct > 0.2 ? 'timer-warning' : 'timer-danger';

  return (
    <div className={`timer ${cls}`}>
      <span style={{ fontSize: '1rem' }}>
        {pct > 0.5 ? '🟢' : pct > 0.2 ? '🟡' : '🔴'}
      </span>
      <span>{formatTime(seconds)}</span>
    </div>
  );
}

const FRAMEWORK_HINTS = {
  profitability: [
    'Revenue vs Cost decomposition',
    'Volume × Price analysis',
    'Fixed vs Variable costs',
    'Product mix / Channel mix',
    'Competitive dynamics',
    'Internal vs External factors',
  ],
  market_entry: [
    'Market attractiveness (TAM/SAM/SOM)',
    'Competitive landscape',
    'Company capabilities & fit',
    'Entry mode (organic vs M&A vs JV)',
    'Regulatory / cultural factors',
    'Financial projections',
  ],
  gtm: [
    'Customer segmentation',
    'Value proposition per segment',
    'Channel strategy',
    'Pricing model',
    'Competitive positioning',
    'Go-to-market timeline',
  ],
  dd_ma: [
    'Target valuation & synergies',
    'Revenue & cost synergies',
    'Integration risks',
    'Deal structure & financing',
    'Regulatory approval',
    'Stakeholder management',
  ],
  guesstimate: [
    'Clarify the question',
    'Break into components',
    'Estimate each component',
    'Cross-check with benchmarks',
    'State assumptions clearly',
    'Give a range, not a point',
  ],
  unconventional: [
    'Define the problem clearly',
    'Stakeholder analysis',
    'Creative solution generation',
    'Feasibility assessment',
    'Risk evaluation',
    'Implementation roadmap',
  ],
  revenues: [
    'Revenue drivers (volume × price)',
    'Customer segments',
    'Growth levers (organic vs inorganic)',
    'Pricing power & elasticity',
    'Market share dynamics',
    'Competitive moat',
  ],
  cost_reduction: [
    'Cost category analysis',
    'Benchmarking vs industry',
    'Process inefficiencies',
    'Automation opportunities',
    'Supplier renegotiation',
    'Quick wins vs structural changes',
  ],
  growth: [
    'Current growth drivers',
    'Market expansion opportunities',
    'Product-market fit signals',
    'Scalability assessment',
    'Competitive dynamics',
    'Resource requirements',
  ],
  pricing: [
    'Value-based pricing analysis',
    'Willingness to pay research',
    'Competitive pricing landscape',
    'Price elasticity',
    'Segment-specific pricing',
    'Bundling & tiering strategy',
  ],
  customer_satisfaction: [
    'NPS/CSAT drivers',
    'Customer journey mapping',
    'Pain point identification',
    'Retention vs acquisition',
    'Service quality benchmarks',
    'Recovery & loyalty programs',
  ],
};

const QUICK_TIPS = [
  '💡 Start with a clear structure before diving into data',
  '📊 Quantify everything — numbers make your analysis credible',
  '🎯 Always tie analysis back to a recommendation',
  '🔄 Use "So what?" to push for actionable insights',
  '⚖️ Consider both sides — what could go wrong?',
  '🧠 Show your thinking process, not just conclusions',
];

export default function Interview() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [timeLimit, setTimeLimit] = useState(1500);
  const [timeRemaining, setTimeRemaining] = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showTimerSetup, setShowTimerSetup] = useState(true);
  const [difficulty, setDifficulty] = useState('medium');
  const [showHints, setShowHints] = useState(false);
  const [showTip, setShowTip] = useState(0);
  const [terminated, setTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    casesApi.get(caseId).then(d => setCaseData(d.case));
  }, [caseId]);

  // Cycle through tips
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      setShowTip(prev => (prev + 1) % QUICK_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  // Timer logic
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    if (timeRemaining === 0 && timedMode) {
      handleComplete();
    }
  }, [timerActive, timedMode]); // eslint-disable-line

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.start(caseId, timedMode, timedMode ? timeLimit : null, difficulty);
      setSessionId(res.session_id);
      setMessages([{ role: 'assistant', content: res.message }]);
      setSessionStarted(true);
      setShowTimerSetup(false);
      if (timedMode) {
        setTimeRemaining(timeLimit);
        setTimerActive(true);
      }
      setTimeout(() => inputRef.current?.focus(), 500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await sessionsApi.message(sessionId, userMsg, timedMode ? timeRemaining : null);
      setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
      if (res.terminated_early) {
        setTerminated(true);
        setTerminationReason(res.phase === 'terminated' ? 'The interviewer ended the session due to insufficient performance.' : 'Session terminated early.');
        setTimerActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error: ' + err.message }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleComplete = async () => {
    if (!sessionId || completing) return;
    setCompleting(true);
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await sessionsApi.complete(sessionId);
      navigate(`/scorecard/${sessionId}`);
    } catch (err) {
      alert(err.message);
      setCompleting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!caseData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: 'var(--text-muted)' }}>
      Loading case...
    </div>
  );

  const hints = FRAMEWORK_HINTS[caseData.type] || FRAMEWORK_HINTS.profitability;

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/library')}>← Back</button>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', lineHeight: 1.3 }}>{caseData.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{caseData.company}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {sessionStarted && (
            <button
              className={`btn btn-sm ${showHints ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowHints(!showHints)}
            >
              💡 {showHints ? 'Hide' : 'Show'} Hints
            </button>
          )}
          {sessionStarted && timedMode && (
            <TimerDisplay seconds={timeRemaining} limit={timeLimit} />
          )}
          {sessionStarted && !terminated && (
            <button className="btn btn-secondary btn-sm" onClick={handleComplete} disabled={completing}>
              {completing ? 'Scoring...' : 'End Session'}
            </button>
          )}
          {terminated && (
            <button className="btn btn-primary btn-sm" onClick={handleComplete} disabled={completing}>
              {completing ? 'Scoring...' : 'View Scorecard →'}
            </button>
          )}
        </div>
      </div>

      {/* Framework hints panel */}
      <AnimatePresence>
        {showHints && sessionStarted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderBottom: '1px solid var(--border)' }}
          >
            <div style={{ padding: '16px 24px', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--cyan)' }}>
                  🧭 Framework Hints — {caseData.type?.replace('_', ' ')}
                </h4>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {hints.map((h, i) => (
                  <span key={i} className="tag tag-cyan" style={{ cursor: 'default' }}>{h}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer setup screen */}
      <AnimatePresence>
        {showTimerSetup && !sessionStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '40px' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚡</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '8px' }}>
                {caseData.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                {caseData.context}
              </p>

              {/* Case metadata */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
                <span className={`tag tag-${caseData.difficulty === 'easy' ? 'green' : caseData.difficulty === 'hard' ? 'red' : 'amber'}`}>
                  {caseData.difficulty}
                </span>
                <span className="tag tag-cyan">{caseData.type?.replace('_', ' ')}</span>
              </div>

              {/* Mode selection */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <button
                  className={`btn ${!timedMode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setTimedMode(false)}
                >
                  🧘 Untimed
                </button>
                <button
                  className={`btn ${timedMode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setTimedMode(true)}
                >
                  ⏱️ Timed
                </button>
              </div>

              {timedMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '12px' }}>
                    Time Limit
                  </label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[600, 900, 1200, 1500, 1800].map(t => (
                      <button
                        key={t}
                        className={`btn btn-sm ${timeLimit === t ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTimeLimit(t)}
                      >
                        {t / 60} min
                      </button>
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px' }}>
                    ⚡ Finish early for a time bonus!
                  </p>
                </motion.div>
              )}

              {/* Difficulty selection */}
              <div style={{ marginTop: '24px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '12px' }}>
                  Difficulty Level
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[
                    { value: 'easy', label: '🟢 Easy', desc: 'Guided hints when you miss something' },
                    { value: 'medium', label: '🟡 Medium', desc: 'Brief hints (3C,1P notation)' },
                    { value: 'hard', label: '🔴 Hard', desc: 'No hints — silent point deductions' },
                  ].map(d => (
                    <button
                      key={d.value}
                      className={`btn btn-sm ${difficulty === d.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setDifficulty(d.value)}
                      style={{ flex: 1, flexDirection: 'column', padding: '12px 8px' }}
                    >
                      <span>{d.label}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px' }}>{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick tip */}
              <div style={{
                marginTop: '20px', padding: '12px 16px',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
                fontSize: '0.85rem', color: 'var(--text-secondary)',
                textAlign: 'left',
              }}>
                {QUICK_TIPS[0]}
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '24px' }}
                onClick={startSession}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Begin Interview →'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area */}
      {sessionStarted && (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`chat-msg ${m.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}
            >
              {m.role === 'assistant' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ Interviewer
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat-msg chat-msg-ai">
              <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                <span style={{ animation: 'pulse 1.4s infinite 0s', color: 'var(--cyan)' }}>●</span>
                <span style={{ animation: 'pulse 1.4s infinite 0.2s', color: 'var(--cyan)' }}>●</span>
                <span style={{ animation: 'pulse 1.4s infinite 0.4s', color: 'var(--cyan)' }}>●</span>
              </div>
            </motion.div>
          )}

          {/* Rotating tip */}
          {!loading && messages.length > 0 && messages.length % 3 === 0 && (
            <motion.div
              key={showTip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center', fontSize: '0.85rem',
                color: 'var(--text-muted)', padding: '8px',
              }}
            >
              {QUICK_TIPS[showTip]}
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      )}

      {/* Termination overlay */}
      {terminated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(255,45,45,0.1), rgba(255,45,45,0.05))',
            borderTop: '2px solid #ff2d2d',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⛔</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#ff2d2d', marginBottom: '8px' }}>
            Interview Ended by Interviewer
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', maxWidth: '500px', margin: '0 auto 16px' }}>
            {terminationReason}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
            In real consulting interviews, the interviewer can end the session early if the candidate is clearly not meeting the bar.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? 'Scoring...' : 'View Scorecard →'}
          </button>
        </motion.div>
      )}

      {/* Input */}
      {sessionStarted && !terminated && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
            <textarea
              ref={inputRef}
              className="input"
              placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || completing}
              rows={1}
              style={{ flex: 1, resize: 'none', minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={loading || !input.trim() || completing}
            >
              Send
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {messages.length} messages · {timedMode ? formatTime(timeRemaining) + ' remaining' : 'Untimed'}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
