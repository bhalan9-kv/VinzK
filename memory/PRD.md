# Case Interviewer AI — Product Record

## Original problem statement
Build a professional AI case interviewer for one case session at a time. It must run six case types (profitability, go-to-market, market entry, due diligence/M&A, unconventional, and guesstimate) with a strict Socratic flow: prompt first, structure before data, gated data requests, relevance classification, final scoring, feedback, and XP. Relevant questions earn value; irrelevant questions earn no XP or can reduce XP. The user requested live AI, GPT-5.4 Mini, email/password accounts, persistent history, a six-type library, progress tracking, and a marketing-style landing page.

## Architecture decisions
- React 19 frontend with React Router routes for landing, library, session, and progress.
- FastAPI backend with MongoDB via the existing protected `MONGO_URL` and `DB_NAME` values.
- JWT email/password auth with bcrypt password hashing.
- Emergent LLM integration using GPT-5.4 Mini; each session creates its own LlmChat instance.
- Session messages and completion score are persisted in MongoDB; frontend uses the protected backend URL.

## User personas
- Consulting candidate preparing for case interviews and wanting realistic pressure.
- Ambitious student or career switcher who needs measurable practice feedback.

## Core requirements (static)
- Six case archetypes and case library.
- Socratic interviewer with relevant/irrelevant request handling.
- Structure-before-data behavior and final recommendation scoring.
- Five score dimensions: structuring, data efficiency, math accuracy, synthesis, creativity.
- XP rewards, penalties, scorecard feedback, and persistent progress.
- Account registration and login.

## Implemented
- 2026-08-25: Editorial high-contrast landing page with hero image, method section, and navigation.
- 2026-08-25: Six-case library with gated authenticated start flow.
- 2026-08-25: Email/password registration and login with protected session/progress APIs.
- 2026-08-25: Live GPT-5.4 Mini interviewer integration and persistent transcript storage.
- 2026-08-25: Scorecard UI with five score bars, feedback, XP, and progress link.
- 2026-08-25: Progress dashboard with completed sessions and earned XP.
- 2026-08-25: Responsive mobile layout and friendly API error states.

## Prioritized backlog
### P0
- None remaining for the current MVP.

### P1
- Add a dedicated scorecard history detail page for each completed session.
- Add configurable case difficulty and timed interview mode.
- Add richer exhibit rendering for tables and chart descriptions.

### P2
- Add streaks and weekly practice targets.
- Add interviewer voice mode and downloadable feedback summaries.

## Next tasks
1. Build detailed scorecard history views.
2. Add a timed interview mode.
3. Add weekly practice streaks and reminders.