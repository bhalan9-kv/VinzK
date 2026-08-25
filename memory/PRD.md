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

## Prioritized backlog
### P1
- Timed interview mode (countdown per session).
- Richer exhibit rendering for tables / chart descriptions inside the interview.
- Verbatim casebook prompt + hidden answer key ingestion (deeper than titles + pages).

### P2
- Streaks + weekly practice targets with reminders.
- Voice mode for interviewer.
- Downloadable feedback summaries.

## Next tasks
1. Add timed interview mode.
2. Ingest verbatim casebook prompts + exhibit data.
3. Weekly streaks + reminders.
