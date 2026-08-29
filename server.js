const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ══════════════════════════════════════════════════════════════
// In-Memory Database (with file persistence fallback)
// ══════════════════════════════════════════════════════════════
const DB_FILE = path.join(__dirname, 'data.json');

let db = {
  users: [],
  sessions: [],
  cases: [],
  bookmarks: [],
  nextUserId: 1,
  nextSessionId: 1,
  nextCaseId: 1,
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(raw);
      console.log(`[DB] Loaded ${db.users.length} users, ${db.sessions.length} sessions, ${db.cases.length} cases`);
    }
  } catch (e) {
    console.log('[DB] Starting fresh:', e.message);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('[DB] Save error:', e.message);
  }
}

loadDB();

// ══════════════════════════════════════════════════════════════
// Auth Helpers
// ══════════════════════════════════════════════════════════════
const JWT_SECRET = process.env.JWT_SECRET || 'caseflow-dev-secret-' + crypto.randomBytes(16).toString('hex');

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(pw, salt, 64).toString('hex');
  return hash === test;
}

function createToken(userId) {
  const payload = { userId, exp: Date.now() + 72 * 3600 * 1000 };
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(JSON.stringify(payload)).digest('hex');
  return Buffer.from(JSON.stringify(payload)).toString('base64') + '.' + sig;
}

function verifyToken(token) {
  try {
    const [payloadB64, sig] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (payload.exp < Date.now()) return null;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(JSON.stringify(payload)).digest('hex');
    if (sig !== expected) return null;
    return payload;
  } catch { return null; }
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ detail: 'No token' });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ detail: 'Invalid token' });
  const user = db.users.find(u => u.id === payload.userId);
  if (!user) return res.status(401).json({ detail: 'User not found' });
  req.user = user;
  next();
}

// ══════════════════════════════════════════════════════════════
// Auth Routes
// ══════════════════════════════════════════════════════════════
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ detail: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ detail: 'Password must be at least 6 characters' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ detail: 'Email already registered' });

  const user = {
    id: db.nextUserId++,
    email,
    name: name || email.split('@')[0],
    password: hashPassword(password),
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDB();

  const token = createToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, xp: user.xp } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastActiveDate) {
    const last = new Date(user.lastActiveDate);
    const diff = Math.floor((new Date(today) - last) / 86400000);
    if (diff === 1) user.streak++;
    else if (diff > 1) user.streak = 1;
  } else {
    user.streak = 1;
  }
  user.lastActiveDate = today;
  saveDB();

  const token = createToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, xp: user.xp } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name, xp: req.user.xp, streak: req.user.streak } });
});

// ══════════════════════════════════════════════════════════════
// Cases Routes
// ══════════════════════════════════════════════════════════════
app.get('/api/cases', authMiddleware, (req, res) => {
  const cases = db.cases.map(c => ({
    id: c.id, title: c.title, company: c.company, type: c.type,
    difficulty: c.difficulty, context: c.context,
    hasExhibits: c.exhibits && c.exhibits.length > 0,
  }));
  res.json({ cases });
});

app.get('/api/cases/:id', authMiddleware, (req, res) => {
  const c = db.cases.find(c => String(c.id) === String(req.params.id));
  if (!c) return res.status(404).json({ detail: 'Case not found' });
  res.json({ case: { ...c, exhibits: undefined, questions: undefined } });
});

// ══════════════════════════════════════════════════════════════
// Session Routes
// ══════════════════════════════════════════════════════════════
app.post('/api/sessions', authMiddleware, (req, res) => {
  const { case_id, timed, time_limit_seconds, difficulty } = req.body;
  const caseData = db.cases.find(c => String(c.id) === String(case_id));
  if (!caseData) return res.status(404).json({ detail: 'Case not found' });

  const diff = difficulty || 'medium';
  const greeting = generateGreeting(caseData, !!timed, diff);
  const session = {
    id: db.nextSessionId++,
    userId: req.user.id,
    caseId: case_id,
    caseTitle: caseData.title,
    caseType: caseData.type,
    difficulty: diff,
    timed: !!timed,
    timeLimitSeconds: timed ? (time_limit_seconds || 1500) : null,
    timeRemainingSeconds: timed ? (time_limit_seconds || 1500) : null,
    startedAt: new Date().toISOString(),
    completed: false,
    messages: [{ role: 'assistant', content: greeting, timestamp: new Date().toISOString() }],
    metadata: { phase: 'clarifying', clarifyingRounds: 0, frameworkEvaluated: false, frameworkScore: 0 },
    scorecard: null,
    xpEarned: 0,
  };
  db.sessions.push(session);
  saveDB();

  res.json({
    session_id: session.id,
    message: greeting,
    timed: session.timed,
    time_limit_seconds: session.timeLimitSeconds,
  });
});

app.post('/api/sessions/:id/message', authMiddleware, (req, res) => {
  const session = db.sessions.find(s => String(s.id) === String(req.params.id) && s.userId === req.user.id);
  if (!session) return res.status(404).json({ detail: 'Session not found' });
  if (session.completed) return res.status(400).json({ detail: 'Session already completed' });

  const caseData = db.cases.find(c => String(c.id) === String(session.caseId));
  if (!caseData) return res.status(404).json({ detail: 'Case not found' });

  const { content, time_remaining_seconds } = req.body;
  session.messages.push({ role: 'user', content, timestamp: new Date().toISOString() });

  const reply = generateReply(session, caseData);
  session.messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });

  if (time_remaining_seconds !== undefined && time_remaining_seconds !== null) {
    session.timeRemainingSeconds = time_remaining_seconds;
  }

  // Check if session was terminated early by the interviewer
  const terminatedEarly = session.metadata?.terminatedEarly || session.metadata?.phase === 'terminated';

  saveDB();
  res.json({ message: reply, terminated_early: terminatedEarly, phase: session.metadata?.phase });
});

app.post('/api/sessions/:id/complete', authMiddleware, (req, res) => {
  const session = db.sessions.find(s => String(s.id) === String(req.params.id) && s.userId === req.user.id);
  if (!session) return res.status(404).json({ detail: 'Session not found' });
  if (session.completed) return res.status(400).json({ detail: 'Already completed' });

  const caseData = db.cases.find(c => String(c.id) === String(session.caseId));
  const scorecard = generateScorecard(session, caseData);

  // Handle terminated-early sessions — reduced XP and flag in scorecard
  const wasTerminated = session.metadata?.terminatedEarly || session.metadata?.phase === 'terminated';
  const timeBonus = session.timed && session.timeRemainingSeconds > 0
    ? Math.floor(session.timeRemainingSeconds / 30) : 0;
  // Terminated sessions get reduced XP (max 20 instead of normal scoring)
  const baseXP = wasTerminated ? Math.min(20, Math.floor(scorecard.overall * 0.5)) : Math.max(10, Math.floor(scorecard.overall * 1.5));
  const xpEarned = baseXP + timeBonus;

  scorecard.xp_earned = xpEarned;
  scorecard.time_bonus = timeBonus;
  scorecard.terminated_early = wasTerminated;
  if (wasTerminated) {
    scorecard.termination_reason = session.metadata.terminationReason || 'Session ended by interviewer';
  }

  session.completed = true;
  session.scorecard = scorecard;
  session.xpEarned = xpEarned;

  // Update user XP
  req.user.xp = (req.user.xp || 0) + xpEarned;

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  if (req.user.lastActiveDate !== today) {
    const last = new Date(req.user.lastActiveDate || session.startedAt);
    const diff = Math.floor((new Date(today) - last) / 86400000);
    if (diff <= 1) req.user.streak = (req.user.streak || 0) + 1;
    else req.user.streak = 1;
    req.user.lastActiveDate = today;
  }

  saveDB();
  res.json({ scorecard, xp_earned: xpEarned });
});

app.get('/api/sessions', authMiddleware, (req, res) => {
  const sessions = db.sessions
    .filter(s => s.userId === req.user.id)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 50)
    .map(s => ({
      id: s.id, case_title: s.caseTitle, case_type: s.caseType,
      timed: s.timed, completed: s.completed,
      started_at: s.startedAt, xp_earned: s.xpEarned,
      overall_score: s.completed && s.scorecard ? s.scorecard.overall : null,
    }));
  res.json({ sessions });
});

app.get('/api/sessions/:id', authMiddleware, (req, res) => {
  const s = db.sessions.find(s => String(s.id) === String(req.params.id) && s.userId === req.user.id);
  if (!s) return res.status(404).json({ detail: 'Session not found' });
  res.json({
    session: {
      id: s.id, case_title: s.caseTitle, case_type: s.caseType,
      timed: s.timed, time_limit_seconds: s.timeLimitSeconds,
      completed: s.completed, messages: s.messages,
      scorecard: s.scorecard, xp_earned: s.xpEarned,
      started_at: s.startedAt,
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Bookmarks Routes
// ══════════════════════════════════════════════════════════════
app.get('/api/bookmarks', authMiddleware, (req, res) => {
  const bookmarks = db.bookmarks.filter(b => b.userId === req.user.id).map(b => b.caseId);
  res.json({ bookmarks });
});

app.post('/api/bookmarks', authMiddleware, (req, res) => {
  const { case_id } = req.body;
  if (!db.bookmarks.find(b => b.userId === req.user.id && b.caseId === case_id)) {
    db.bookmarks.push({ userId: req.user.id, caseId: case_id });
    saveDB();
  }
  res.json({ ok: true });
});

app.delete('/api/bookmarks/:caseId', authMiddleware, (req, res) => {
  db.bookmarks = db.bookmarks.filter(b => !(b.userId === req.user.id && b.caseId === req.params.caseId));
  saveDB();
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
// Progress Routes
// ══════════════════════════════════════════════════════════════
app.get('/api/progress', authMiddleware, (req, res) => {
  const userSessions = db.sessions.filter(s => s.userId === req.user.id && s.completed);
  const caseTypes = {};
  const scores = [];
  let totalXP = req.user.xp || 0;

  userSessions.forEach(s => {
    caseTypes[s.caseType] = (caseTypes[s.caseType] || 0) + 1;
    if (s.scorecard) scores.push(s.scorecard.overall);
  });

  const strongest = Object.entries(caseTypes).sort((a, b) => b[1] - a[1])[0];

  // Recent trend (last 5 sessions)
  const recent = userSessions.slice(0, 5).map(s => ({
    score: s.scorecard?.overall || 0,
    date: s.startedAt,
    type: s.caseType,
  }));

  res.json({
    total_xp: totalXP,
    completed_sessions: userSessions.length,
    streak: req.user.streak || 0,
    strongest_type: strongest ? strongest[0] : null,
    case_type_distribution: caseTypes,
    average_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    recent_trend: recent,
  });
});

// ══════════════════════════════════════════════════════════════
// Interview Engine — 3-Phase Structured Flow
// ══════════════════════════════════════════════════════════════
//
// PHASE 1: CLARIFYING QUESTIONS (the 5 Cs)
//   Candidate must ask questions about: Company, Competitors,
//   Customers, Context, Products/Services before building a framework.
//   Easy mode: explicitly tell them what they missed.
//   Medium mode: hint with (3C,1P) notation.
//   Hard mode: deduct silently, move on.
//
// PHASE 2: FRAMEWORK
//   Candidate proposes an analytical framework.
//   If framework is weak/missing → say so clearly, deduct points.
//   If framework is good → probe deeper, move to data analysis.
//
// PHASE 3: DATA ANALYSIS & RECOMMENDATION
//   Candidate analyzes data, forms hypotheses, gives recommendation.
//   Score at the end.

const THE_5_CS = {
  company: {
    label: 'Company',
    aliases: ['company', 'firm', 'business', 'organization', 'client', 'revenue', 'profit', 'margin', 'financial', 'operations', 'cost', 'spending'],
    description: 'About the company itself — its size, financials, operations, structure',
  },
  competitors: {
    label: 'Competitors',
    aliases: ['competitor', 'competition', 'rival', 'market share', 'benchmark', 'industry', 'peer', 'alternative', 'substitute'],
    description: 'Competitive landscape — who are the competitors, their positioning',
  },
  customers: {
    label: 'Customers',
    aliases: ['customer', 'client', 'user', 'buyer', 'segment', 'demographic', 'demand', 'satisfaction', 'churn', 'retention'],
    description: 'Target customers — segments, behavior, satisfaction, trends',
  },
  context: {
    label: 'Context',
    aliases: ['context', 'background', 'situation', 'trend', 'macro', 'economic', 'regulation', 'season', 'time', 'recent', 'change', 'event'],
    description: 'External context — market trends, regulatory, economic conditions, recent events',
  },
  products: {
    label: 'Products/Services',
    aliases: ['product', 'service', 'offering', 'portfolio', 'line', 'pricing', 'quality', 'feature', 'launch', 'discontinue'],
    description: 'Products and services — portfolio, pricing, quality, recent changes',
  },
};

const TYPE_GUIDANCE = {
  profitability: 'Focus on revenue vs cost decomposition. Push the candidate to identify whether the issue is revenue decline or cost increase, then dig into drivers.',
  gtm: 'Focus on market sizing, customer segmentation, channel strategy, and competitive positioning.',
  market_entry: 'Focus on market attractiveness (TAM/SAM/SOM), competitive landscape, entry mode, and capability assessment.',
  dd_ma: 'Focus on valuation, synergies, integration risks, and deal structure.',
  unconventional: 'Push creative problem-solving. Evaluate structured thinking and hypothesis formation.',
  guesstimate: 'Evaluate estimation methodology, assumptions, and the ability to break down ambiguous problems.',
  revenues: 'Focus on revenue drivers, pricing power, customer segments, and growth levers.',
  cost_reduction: 'Focus on cost categories, benchmarking, process inefficiencies, and reduction levers.',
  growth: 'Focus on growth vectors, market expansion, product-market fit, and scalability.',
  pricing: 'Focus on pricing strategy, willingness to pay, competitive pricing, and value capture.',
  customer_satisfaction: 'Focus on NPS/CSAT drivers, customer journey pain points, and retention levers.',
};

function detectAskedCs(userMessage) {
  const lower = userMessage.toLowerCase();
  const asked = {};
  for (const [key, info] of Object.entries(THE_5_CS)) {
    asked[key] = info.aliases.some(alias => lower.includes(alias));
  }
  return asked;
}

function getMissingCs(asked) {
  return Object.entries(THE_5_CS)
    .filter(([key]) => !asked[key])
    .map(([key, info]) => info.label);
}

function isBlankOrNoApproach(msg) {
  const lower = msg.toLowerCase().trim();
  const blankPatterns = [
    /^i\s*(don'?t|do\s+not|have\s+no|am\s+not|can'?t|cannot|won'?t)\s*(know|have|think|see|understand|sure)/,
    /^(no|nah|nope|blank|nothing|idk|unsure|dunno|no\s*idea)/,
    /i\s*am\s*blank/i,
    /i\s*have\s*no\s*(approach|idea|framework|clue)/i,
    /^(umm|uhh|uh|hmm|let\s*me\s*think|give\s*me\s*a\s*sec)/,
    /^(a|an|the|um|uh|so|well|okay|ok|yes|yeah|yep|sure|right)$/,
  ];
  return blankPatterns.some(p => p.test(lower)) || lower.length < 5;
}

function isWeakFramework(msg) {
  const lower = msg.toLowerCase();
  // Very short or vague responses
  if (msg.length < 30) return true;
  // Only mentions 1 area (not a framework)
  const hasAnalysis = /\b(analyze|analysis|examine|investigate|look at|assess|evaluate|break down|decompose|framework|structure|approach|strategy)\b/i.test(msg);
  const areaWords = ['revenue', 'cost', 'price', 'volume', 'market', 'customer', 'competitor', 'profit', 'growth', 'margin', 'channel', 'product', 'brand', 'operations', 'supply', 'demand', 'financial', 'strategic'];
  const areaCount = areaWords.filter(a => lower.includes(a)).length;
  return !hasAnalysis && areaCount < 2;
}

function getFrameworkQuality(msg) {
  const lower = msg.toLowerCase();
  let score = 0;
  const feedback = [];

  // MECE check
  if (/mece|mutually exclusive|exhaustive/i.test(msg)) {
    score += 2;
    feedback.push('Good MECE thinking');
  }

  // Structure indicators
  const structureWords = ['framework', 'approach', 'structure', 'break down', 'analyze', 'decompose', 'lens', 'pillar', 'driver'];
  if (structureWords.some(w => lower.includes(w))) score += 1;

  // Multiple areas covered
  const areas = ['revenue', 'cost', 'price', 'volume', 'margin', 'market', 'customer', 'competitor', 'channel', 'product', 'growth', 'profit'];
  const coveredAreas = areas.filter(a => lower.includes(a));
  score += Math.min(coveredAreas.length, 4);

  // Hypothesis-driven
  if (/hypothesis|because|therefore|suggest|believe|think.*because|likely/i.test(msg)) {
    score += 2;
    feedback.push('Hypothesis-driven approach');
  }

  // Quantitative framing
  if (/\d|percent|\$|million|billion|ratio|metric|kpi/i.test(msg)) {
    score += 1;
    feedback.push('Quantitative framing');
  }

  return { score: Math.min(score, 10), areas: coveredAreas, feedback };
}

function generateGreeting(caseData, isTimed, difficulty) {
  const timedNote = isTimed
    ? ' This is a timed session — manage your time wisely. You can finish early for a time bonus.'
    : '';
  const diffNote = difficulty === 'hard'
    ? ' I will not give you hints if you miss something.'
    : difficulty === 'easy'
    ? ' I will guide you if you miss important questions.'
    : '';
  return `Welcome to your case interview. I'll be your interviewer today.

**The Case: ${caseData.title}**
**Company:** ${caseData.company}

${caseData.context}${timedNote}${diffNote}

Before we jump into any framework or analysis, I need you to ask me some clarifying questions first. A good consultant always gathers information before proposing a solution.

**What questions do you have for me about this case?**
Think about what you need to know about the company, its competitors, customers, market context, and products.`;
}

function getPhase(session) {
  // Count user messages (excluding the greeting)
  const userMsgs = session.messages.filter(m => m.role === 'user');
  const assistantMsgs = session.messages.filter(m => m.role === 'assistant');
  const userCount = userMsgs.length;
  // Track phase in session metadata
  if (!session.metadata) session.metadata = { phase: 'clarifying', clarifyingRounds: 0, frameworkEvaluated: false, frameworkScore: 0 };
  return session.metadata;
}

function generateReply(session, caseData) {
  const meta = getPhase(session);
  const difficulty = session.difficulty || 'medium';
  const userMsgs = session.messages.filter(m => m.role === 'user');
  const lastUserMsg = userMsgs.slice(-1)[0]?.content || '';
  const userCount = userMsgs.length;
  const guidance = TYPE_GUIDANCE[caseData.type] || '';

  // ── EARLY TERMINATION: Interviewer discretion ──────────────
  // Track consecutive poor responses to detect if candidate is unsuitable
  if (!meta.consecutiveBlanks) meta.consecutiveBlanks = 0;
  if (!meta.totalPoorResponses) meta.totalPoorResponses = 0;
  if (!meta.terminationWarnings) meta.terminationWarnings = 0;

  if (isBlankOrNoApproach(lastUserMsg)) {
    meta.consecutiveBlanks++;
    meta.totalPoorResponses++;
  } else if (lastUserMsg.length < 40) {
    meta.totalPoorResponses++;
  } else {
    meta.consecutiveBlanks = 0; // Reset on good response
  }

  // After 2+ consecutive blanks OR 4+ total poor responses, consider termination
  if (meta.consecutiveBlanks >= 2 || meta.totalPoorResponses >= 4) {
    meta.terminationWarnings++;

    if (meta.terminationWarnings >= 3) {
      // Final termination — interviewer ends the session
      meta.phase = 'terminated';
      meta.terminatedEarly = true;
      meta.terminationReason = meta.consecutiveBlanks >= 2
        ? 'Candidate repeatedly unable to provide substantive responses'
        : 'Candidate responses have been consistently insufficient throughout the case';
      session.completed = true;
      return `I'm going to stop you here. After multiple attempts, I'm not seeing the level of analytical thinking required for this role.

**Here's what went wrong:**
- You were unable to formulate clarifying questions when asked
- You didn't propose a structured framework for analysis
- Your responses have been too brief or off-topic to continue productively

**This is what a real consulting interview would look like** — the interviewer has the discretion to end early if the candidate is clearly not meeting the bar. It's better to recognize this now than to waste both parties' time.

**My advice:** Before your next practice session, review the basics:
1. The 5 Cs — always start by asking about Company, Competitors, Customers, Context, Products
2. Frameworks — practice building structured approaches (profitability, market entry, pricing)
3. Hypothesis-driven thinking — always state what you believe and how you'd test it

You can end this session to see your scorecard, but I strongly recommend studying the fundamentals first.

Click **End Session** to finish.`;
    }

    if (meta.terminationWarnings === 1 && meta.consecutiveBlanks >= 2) {
      return `I notice you've given me blank or very brief responses multiple times now. In a real case interview, this would raise serious concerns.

Let me be direct: **you need to engage with the case.** Here's what I need from you:

- Ask me questions about the Company, Competitors, Customers, Context, or Products
- OR propose a framework if you think you have enough information
- Even a rough attempt is better than no attempt

This is your last chance to show me something. **What would you like to ask or propose?**`;
    }

    if (meta.terminationWarnings === 2 && meta.totalPoorResponses >= 4) {
      return `I'm being honest with you — your responses have been consistently weak throughout this case. You've given me ${meta.totalPoorResponses} responses that were too brief or lacked substance.

I need to see **real analytical thinking** before we can continue. Give me something substantial:

- A structured framework with 3-4 areas
- Specific questions about the business
- Any hypothesis about what might be causing the problem

**This is your final opportunity.** Show me your best attempt.`;
    }
  }

  // ── PHASE 1: CLARIFYING QUESTIONS ────────────────────────
  if (meta.phase === 'clarifying') {
    meta.clarifyingRounds++;

    // Check if candidate jumped straight to framework without asking questions
    const jumpedToFramework = /\b(framework|approach|structure|break down|analyze|decompose|lens|pillar|driver|i would (look|examine|investigate|analyze))\b/i.test(lastUserMsg);
    const askedBlank = isBlankOrNoApproach(lastUserMsg);

    if (askedBlank) {
      return `It's okay to feel uncertain, but a consultant never starts without asking questions first. Let me help you.

Before proposing any framework, you need to understand the situation better. Ask me questions about:

- **Company** — What's going on with the company? Revenue, costs, operations?
- **Competitors** — Who are the competitors? How are they performing?
- **Customers** — Who buys from them? Are customer behaviors changing?
- **Context** — Any recent events, economic trends, or regulatory changes?
- **Products** — Are there changes to the product lineup, pricing, or quality?

**What questions do you have?** A good case interview starts with 3-5 clarifying questions.`;
    }

    if (jumpedToFramework) {
      // Candidate jumped to framework without asking questions
      meta.frameworkPenalty = (meta.frameworkPenalty || 0) + 15;
      meta.phase = 'framework';
      return `Hold on — you jumped straight to a framework without asking any clarifying questions. In a real case interview, this would be a significant mistake.

A good consultant always asks questions first to understand:
- What exactly is the problem?
- What's the context?
- What data is available?

You skipped the clarifying phase entirely. I'm noting this as a **-15 point deduction** on your structure score.

Now, since you've already started thinking about a framework — **please walk me through your proposed framework in detail.** What are the key areas you would analyze, and how would you structure your approach?`;
    }

    // Detect which Cs were asked
    const asked = detectAskedCs(lastUserMsg);
    const missing = getMissingCs(asked);
    const askedCount = Object.values(asked).filter(Boolean).length;

    if (askedCount >= 3) {
      // Enough questions asked — move to framework
      meta.phase = 'framework';
      meta.clarifyingScore = Math.min(100, askedCount * 20);

      let transition = `Good questions. You've covered ${askedCount} of the 5 key areas. `;
      if (missing.length > 0 && difficulty === 'easy') {
        transition += `Before we move on, you didn't ask about **${missing.join(', ')}**. In a real interview, you'd want to cover all 5 areas. But let's proceed.`;
      } else if (missing.length > 0 && difficulty === 'medium') {
        transition += `Note: you missed asking about **${missing.length} area${missing.length > 1 ? 's' : ''}** (${missing.map(m => m.charAt(0)).join(', ')}). Remember the 5 Cs for next time.`;
      }
      transition += `

Now, based on what you know — **walk me through your analytical framework.** How would you structure your approach to solve this problem?`;      
      return transition;
    }

    if (meta.clarifyingRounds >= 3) {
      // Candidate has had 3 rounds of questions — gently move on
      meta.phase = 'framework';
      meta.clarifyingScore = Math.min(100, askedCount * 20);
      let msg = `You've asked about ${askedCount} of the 5 key areas. `;
      if (missing.length > 0 && difficulty !== 'hard') {
        const missingFormatted = difficulty === 'easy'
          ? `You forgot to ask about: **${missing.join(', ')}**. These are important — always cover all 5 Cs.`
          : `You're missing questions about **${missing.length} area${missing.length > 1 ? 's' : ''}** (${missing.map(m => m.charAt(0)).join(', ')}).`;
        msg += missingFormatted + ' ';
      }
      msg += `

Let's move forward. **Based on what you know, what is your analytical framework?** How would you break this problem down?`;
      return msg;
    }

    // Still in clarifying — give feedback on what they asked
    if (askedCount === 0) {
      return `I don't see any specific questions in your response. Remember, before building a framework, you need to gather information.

Ask me about the **Company**, **Competitors**, **Customers**, **Context**, or **Products**. What would you like to know?`;
    }

    let feedback = `Good — you asked about ${Object.entries(asked).filter(([,v]) => v).map(([k]) => THE_5_CS[k].label).join(', ')}.

`;
    if (missing.length > 0) {
      feedback += `You still haven't asked about: **${missing.join(', ')}**. `;
      if (difficulty === 'easy') {
        feedback += `These are important — always cover all 5 areas before building a framework.`;
      } else if (difficulty === 'medium') {
        feedback += `(${missing.length} remaining — ${missing.map(m => m.charAt(0)).join(',')})`;
      }
    }
    feedback += `

Any more questions, or are you ready to propose a framework?`;
    return feedback;
  }

  // ── PHASE 2: FRAMEWORK ────────────────────────────────────
  if (meta.phase === 'framework') {
    // Check if candidate is still confused/blank
    if (isBlankOrNoApproach(lastUserMsg)) {
      return `I need you to propose a framework. This is the most important part of the case interview.

A framework is your structured approach to analyzing the problem. For a ${caseData.type} case like this, consider:

${guidance}

**Give me your framework.** List the key areas you would analyze and explain why each is important.`;
    }

    // Evaluate framework quality
    const quality = getFrameworkQuality(lastUserMsg);
    const isWeak = isWeakFramework(lastUserMsg);
    meta.frameworkScore = quality.score;
    meta.frameworkAreas = quality.areas;
    meta.phase = 'analysis';

    if (isWeak) {
      meta.frameworkPenalty = (meta.frameworkPenalty || 0) + 10;
      return `I'm going to be honest with you — **that's not a strong framework.** Here's why:

- It's too vague and doesn't break the problem into specific, analyzable components
- A good framework should have 3-4 distinct pillars or areas, each with clear sub-questions
- You need to be more specific about what you would investigate in each area

Let me show you what a better framework looks like for a ${caseData.type} case:

**Better framework:**
1. **Revenue analysis** — Price × Volume trends, customer segments, channel mix
2. **Cost structure** — Fixed vs variable costs, cost drivers, benchmarking
3. **Market/competitive dynamics** — Market trends, competitor performance, market share shifts
4. **Internal operations** — Efficiency, capacity, recent changes

I'm deducting **-10 points** for framework quality. But let's continue.

Now, using this improved framework — **can you walk me through the analysis?** Start with the area you think is most important and tell me what you'd want to investigate.`;
    }

    // Good framework
    let response = `That's a solid framework. ${quality.feedback.length > 0 ? quality.feedback.join('. ') + '.' : ''} You've covered ${quality.areas.length} key area${quality.areas.length > 1 ? 's' : ''}.

`;
    if (quality.areas.length < 3) {
      response += `One suggestion — you might want to expand to cover more areas. A strong framework typically has 3-4 distinct pillars.

`;
    }
    response += `Now let's put it to work. **Which area would you start with, and what specific questions would you ask?**`;
    if (caseData.exhibits && caseData.exhibits.length > 0) {
      response += ` I have data available from the company.`;
    }
    return response;
  }

  // ── PHASE 3: ANALYSIS & RECOMMENDATION ─────────────────────
  if (meta.phase === 'analysis') {
    meta.analysisRounds = (meta.analysisRounds || 0) + 1;

    // Check for recommendation keywords
    const hasRecommendation = /\b(recommend|suggest|should|propose|action|next step|in conclusion|to summarize|my recommendation)\b/i.test(lastUserMsg);
    const isAskingForData = /\b(data|numbers|figure|show|tell|what|how much|revenue|cost|profit|exhibit|available)\b/i.test(lastUserMsg);
    const hasHypothesis = /\b(because|therefore|hypothesis|think|believe|likely|probably|suggest|the issue is|the problem is|driven by|caused by)\b/i.test(lastUserMsg);
    const hasQuant = /\d/.test(lastUserMsg);

    if (hasRecommendation && meta.analysisRounds >= 2) {
      meta.phase = 'recommendation';
      return `Good — you're moving to a recommendation. Before we conclude, I want you to give me a **structured final answer.**

Please organize your recommendation as:

1. **Situation** — Brief recap of the core problem (1-2 sentences)
2. **Recommendation** — Your top-line recommendation
3. **Key evidence** — The 2-3 most important data points supporting your recommendation
4. **Risks** — What could go wrong
5. **Next steps** — What you would do in the first 30 days

Take a moment to organize your thoughts, then deliver your final recommendation.`;
    }

    if (isAskingForData && caseData.exhibits && caseData.exhibits.length > 0) {
      const exhibitIdx = Math.min(meta.exhibitsShown || 0, caseData.exhibits.length - 1);
      const exhibit = caseData.exhibits[exhibitIdx];
      meta.exhibitsShown = (meta.exhibitsShown || 0) + 1;
      return `Here's the data I can share:

**${exhibit.title}:**
\`\`\`\n${JSON.stringify(exhibit.data, null, 2)}\n\`\`\`\n
Based on this data, **what insights can you draw?** And how does this change or support your hypothesis?`;
    }

    if (hasHypothesis) {
      return `Interesting hypothesis. Let me challenge you on a few things:

- **How would you test this?** What specific data would confirm or refute your hypothesis?
- **What's the magnitude?** Can you quantify the impact?
- **Are there alternative explanations?** What else could be driving this?

${caseData.exhibits && (meta.exhibitsShown || 0) < caseData.exhibits.length ? `I have more data available. Would you like to see it?` : `Push yourself to go one level deeper.`}`;
    }

    if (hasQuant) {
      return `Good quantitative thinking. Now:

- **What's the so-what?** Given that number, what action would you recommend?
- **How does this compare** to industry benchmarks or competitors?
- **What are the second-order effects** of what you've identified?

Remember — in consulting, every number should lead to an actionable insight.`;
    }

    if (meta.analysisRounds >= 5) {
      meta.phase = 'recommendation';
      return `We've gone through quite a bit of analysis. Let's move to the conclusion.

**Please give me your final recommendation.** Structure it as:
1. Situation
2. Recommendation  
3. Key evidence
4. Risks
5. Next steps`;
    }

    return `I need you to dig deeper. ${guidance}

Can you be more specific? Form a hypothesis and tell me what data you'd need to test it.`;
  }

  // ── PHASE 4: RECOMMENDATION ────────────────────────────────
  if (meta.phase === 'recommendation') {
    meta.phase = 'done';
    const hasStructure = /\b(situation|recommend|evidence|risk|next step|first 30|implementation)\b/i.test(lastUserMsg);
    
    if (!hasStructure && lastUserMsg.length < 100) {
      meta.phase = 'recommendation'; // Stay in recommendation
      return `That's too brief for a final recommendation. I need a structured answer with:

1. **Situation** — What's the problem?
2. **Recommendation** — What should they do?
3. **Key evidence** — Why?
4. **Risks** — What could go wrong?
5. **Next steps** — First 30 days

Please give me a complete, structured recommendation.`;
    }

    return `Thank you for your recommendation. That concludes our case interview.

Let me summarize what I observed:
${meta.frameworkPenalty ? `- Framework phase: deduction of ${meta.frameworkPenalty} points for skipping clarifying questions or weak framework\n` : ''}- Analysis depth: ${meta.analysisRounds || 0} rounds of back-and-forth
- You can now end the session to see your full scorecard.

Click **End Session** when you're ready to see your scores.`;
  }

  // Default fallback
  return `I'm not sure how to respond to that. Can you try again? Remember:
- In **clarifying phase**: ask me questions about the case
- In **framework phase**: propose your analytical approach
- In **analysis phase**: dig into the data and form hypotheses
- In **recommendation phase**: give me your final structured answer`;
}

function generateScorecard(session, caseData) {
  const meta = session.metadata || {};
  const userMsgs = session.messages.filter(m => m.role === 'user');
  const msgCount = userMsgs.length;
  const avgLength = userMsgs.reduce((sum, m) => sum + m.content.length, 0) / Math.max(msgCount, 1);

  // Analyze content
  const hasFramework = userMsgs.some(m => /\b(framework|approach|structure|break down|analyze|decompose|pillar|driver|lens)\b/i.test(m.content));
  const hasHypothesis = userMsgs.some(m => /\b(hypothesis|because|therefore|think|believe|likely|probably|suggest|the issue is|driven by|caused by)\b/i.test(m.content));
  const hasQuant = userMsgs.some(m => /\d+[%$KMB]|\b(percent|million|billion|increase|decrease|revenue|cost|profit|margin|ratio)\b/i.test(m.content));
  const hasRecommendation = userMsgs.some(m => /\b(recommend|suggest|should|propose|action|next step|in conclusion|my recommendation|situation.*recommend)\b/i.test(m.content));
  const askedClarifying = userMsgs.some(m => /\b(company|competitor|customer|market|product|revenue|profit|cost|pricing|segment|industry|regulation|trend)\b/i.test(m.content));

  // ── STRUCTURE SCORE ──────────────────────────
  let structureBase = 20; // Base for showing up
  if (askedClarifying) structureBase += 15; // Asked clarifying questions
  if (meta.clarifyingScore) structureBase += Math.floor(meta.clarifyingScore / 5); // Quality of clarifying
  if (hasFramework) structureBase += 25; // Proposed a framework
  if (meta.frameworkScore) structureBase += meta.frameworkScore * 2; // Framework quality
  // Penalty for skipping clarifying
  if (meta.frameworkPenalty) structureBase -= meta.frameworkPenalty;
  const structureScore = Math.max(5, Math.min(95, structureBase));

  // ── HYPOTHESIS SCORE ──────────────────────────
  let hypothesisBase = 15;
  if (hasHypothesis) hypothesisBase += 40;
  hypothesisBase += Math.min(meta.analysisRounds || 0, 5) * 5;
  const hypothesisScore = Math.max(5, Math.min(95, hypothesisBase));

  // ── QUANTITATIVE SCORE ────────────────────────
  let quantBase = 15;
  if (hasQuant) quantBase += 40;
  quantBase += Math.min(avgLength / 50, 20);
  const quantScore = Math.max(5, Math.min(95, quantBase));

  // ── COMMUNICATION SCORE ───────────────────────
  let commBase = 30;
  commBase += Math.min(msgCount * 3, 25);
  if (avgLength > 100) commBase += 15;
  if (avgLength > 200) commBase += 10;
  const commScore = Math.max(5, Math.min(95, commBase));

  // ── INSIGHT SCORE ─────────────────────────────
  let insightBase = 15;
  if (hasRecommendation) insightBase += 35;
  if (meta.analysisRounds >= 3) insightBase += 15;
  if (hasHypothesis && hasQuant) insightBase += 10;
  const insightScore = Math.max(5, Math.min(95, insightBase));

  const vary = () => Math.floor(Math.random() * 6) - 3;
  const clamp = v => Math.max(5, Math.min(95, v + vary()));

  const scores = {
    structure: { score: clamp(structureScore), reason: getReason('structure', structureScore, meta) },
    hypothesis: { score: clamp(hypothesisScore), reason: getReason('hypothesis', hypothesisScore, meta) },
    quantitative: { score: clamp(quantScore), reason: getReason('quantitative', quantScore, meta) },
    communication: { score: clamp(commScore), reason: getReason('communication', commScore, meta) },
    insight: { score: clamp(insightScore), reason: getReason('insight', insightScore, meta) },
  };

  const overall = Math.round(Object.values(scores).reduce((s, d) => s + d.score, 0) / 5);

  const strengths = [];
  const improvements = [];
  if (scores.structure.score >= 60) strengths.push('Strong structured approach with good clarifying questions');
  else improvements.push('Always start by asking clarifying questions (the 5 Cs) before proposing a framework');
  if (scores.hypothesis.score >= 60) strengths.push('Good hypothesis-driven analysis');
  else improvements.push('Be more explicit about forming and testing hypotheses');
  if (scores.quantitative.score >= 60) strengths.push('Effective use of quantitative reasoning');
  else improvements.push('Incorporate more quantitative analysis and benchmarks');
  if (scores.communication.score >= 60) strengths.push('Clear and organized communication');
  else improvements.push('Provide more detailed, structured responses');
  if (scores.insight.score >= 60) strengths.push('Arrived at actionable recommendations');
  else improvements.push('Push for more specific, actionable recommendations with risks and next steps');

  if (strengths.length === 0) strengths.push('Participated in the case discussion');
  if (improvements.length === 0) improvements.push('Continue practicing to maintain consistency');

  const recommendation = overall >= 80 ? 'Strong Hire' : overall >= 60 ? 'Hire' : overall >= 40 ? 'Weak Hire' : 'No Hire';

  return {
    scores,
    overall,
    summary: `You completed a ${caseData?.type || ''} case. ${meta.frameworkPenalty ? `Framework deduction: -${meta.frameworkPenalty} pts. ` : ''}${overall >= 70 ? 'Solid performance.' : overall >= 50 ? 'Decent effort — review the feedback below.' : 'Needs significant improvement — focus on the structured approach below.'}`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    recommendation,
  };
}

function getReason(dim, score, meta) {
  const reasons = {
    structure: {
      high: 'Strong framework with good clarifying questions covering multiple areas',
      mid: 'Framework was adequate but could be more MECE and comprehensive',
      low: 'Weak or missing framework. Always start with clarifying questions before proposing an approach.',
    },
    hypothesis: {
      high: 'Formed clear, testable hypotheses and validated them with data',
      mid: 'Some hypothesis-driven thinking but could be more explicit',
      low: 'Lacked explicit hypothesis formation. Always state what you believe and how you would test it.',
    },
    quantitative: {
      high: 'Strong quantitative analysis with specific numbers and benchmarks',
      mid: 'Some quantitative reasoning but could incorporate more data',
      low: 'Insufficient quantitative analysis. Numbers drive credibility in consulting.',
    },
    communication: {
      high: 'Clear, structured, and well-articulated responses',
      mid: 'Generally clear but could be more organized',
      low: 'Responses were too brief or disorganized. Structure your answers clearly.',
    },
    insight: {
      high: 'Actionable recommendations backed by analysis with clear next steps',
      mid: 'Some insight but recommendations could be more specific',
      low: 'Recommendations were vague or missing. Always end with a clear, actionable recommendation.',
    },
  };
  const level = score >= 65 ? 'high' : score >= 40 ? 'mid' : 'low';
  return reasons[dim]?.[level] || 'No feedback available';
}

// ══════════════════════════════════════════════════════════════
// Seed Cases
// ══════════════════════════════════════════════════════════════
const CASES = require('./cases.json');

if (db.cases.length === 0) {
  db.cases = CASES.map((c, i) => ({ ...c, id: i + 1 }));
  db.nextCaseId = db.cases.length + 1;
  saveDB();
  console.log(`[DB] Seeded ${db.cases.length} cases`);
}

// ══════════════════════════════════════════════════════════════
// Serve React Build
// ══════════════════════════════════════════════════════════════
const buildPath = path.join(__dirname, 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n⚡ CaseFlow server running on http://0.0.0.0:${PORT}\n`);
});
