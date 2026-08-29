# Case Interviewer AI — Product Record

## Original problem statement
Build a professional AI case interviewer for one case session at a time. Six case types (profitability, GTM, market entry, due diligence/M&A, unconventional, guesstimate) with a strict Socratic flow: prompt first, structure before data, gated data requests, relevance classification, final scoring, feedback, and XP. Email/password accounts, persistent history, marketing landing page.

## Architecture
- React 19 frontend split into `pages/` and `components/` folders, Framer Motion for interactions.
- FastAPI backend, MongoDB via Motor, JWT + bcrypt auth.
- Emergent LLM Key with GPT-5.4 Mini for each session (LlmChat per message with system prompt).
- Bookmarks + sessions persisted per-user in Mongo.

## User personas
- Consulting candidate preparing for case interviews and wanting realistic pressure.
- Ambitious student or career switcher who needs measurable practice feedback.

## Core requirements (static)
- Six case archetypes + 95 imported FMS Consulting CaseBook cases.
- Socratic interviewer with gated data reveals and exact irrelevant response.
- Structure-before-data behavior and final scoring across five dimensions.
- XP rewards, penalties, scorecard feedback, and persistent progress.
- Bookmarked cases + scorecard history.

## Implemented
- 2026-08-25: Landing page, six-case seed library, JWT auth, session persistence, GPT-5.4 Mini interviewer, scorecard UI, progress dashboard.
- 2026-08-25: Imported FMS Consulting CaseBook 2024-25 catalog (95 cases), difficulty + section filters, bookmarks with protected persistence, hardened JWT secret.
- 2026-08-26: **Frontend refactored** into `pages/` + `components/`; new Fraunces + Instrument Sans + JetBrains Mono type stack; grain texture; Framer Motion micro-animations.
- 2026-08-26: **Bookmark view** as All / Bookmarked tab in library (client-side toggle).
- 2026-08-26: **Scorecard history** — Summary + History tabs in progress page, per-session expandable scorecard with animated bars.
- 2026-08-26: New backend endpoints `GET /api/sessions` and `GET /api/sessions/{id}`.
- 2026-08-26: Category-specific interviewer guidance per case type (profitability, GTM, market entry, DD/M&A, unconventional, guesstimate, revenues, cost reduction, growth, pricing, customer satisfaction).
- 2026-08-26: Streak calculation + strongest-case-type stat on progress.
- 2026-08-29: **Full rebuild — dark aesthetic UI overhaul.** Pitch black (#000) canvas with neon accents (cyan #00f0ff, magenta #ff2daa, purple, green, amber). Glass morphism cards, gradient text, noise texture, ambient glow orbs. Space Grotesk + Inter + JetBrains Mono fonts. Framer Motion page transitions.
- 2026-08-29: **Timed interview mode.** Select timed/untimed before session starts. 5 preset time limits (10/15/20/25/30 min). Live countdown with color-coded urgency (green→yellow→red) and pulsing glow at danger. Auto-complete when time expires. Time bonus XP for early finish.
- 2026-08-29: **95 cases seeded** across 11 types: profitability, market entry, GTM, DD/M&A, guesstimate, unconventional, revenues, cost reduction, growth, pricing, customer satisfaction.
- 2026-08-29: Landing page redesigned — hero with ambient orbs, gradient headline, stat bar, feature cards with glow hover, CTA sections, footer.
- 2026-08-29: Case library — grid layout with color-coded type/difficulty tags, bookmark stars, search, type & difficulty filters, All/Bookmarked tabs.
- 2026-08-29: Interview page — pre-session mode picker (timed vs untimed), chat bubbles with AI indicator, typing animation, textarea with Enter-to-send.
- 2026-08-29: Scorecard page — animated score bars, dimension breakdown, strengths/improvements feedback, time bonus display, XP earned.
- 2026-08-29: Progress dashboard — XP total, sessions count, streak, avg score, strongest type, case type distribution bars, session history list.

## Prioritized backlog
### P1
- Richer exhibit rendering for tables / chart descriptions inside the interview (currently exhibits are JSON in system prompt).
- Verbatim casebook prompt + hidden answer key ingestion (deeper than titles + pages).
- Visual scorecard charts (radar chart, bar comparisons).

### P2
- Voice mode for interviewer (Web Speech API).
- Downloadable PDF feedback summaries.
- Weekly streak targets with email reminders.
- Case difficulty auto-adjustment based on performance.

## Next tasks
1. Add richer exhibit rendering inside the chat UI.
2. Ingest verbatim casebook prompts + exhibit data.
3. Add voice mode for the interviewer.
