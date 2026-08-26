# TASKS.md — Frontend / UI

**Branch: `dev-frontend`**
**Repo: `https://github.com/Kofi011/LsTeam.git`**

Push to `dev-frontend` after each task. Open PR into `dev` at the end of each phase.
**Test every feature before committing — do not push untested code.**

---

## Phase 1 — Project Setup

- [ ] Initialize frontend (React + Vite + your CSS framework of choice, see DESIGN_BRIEF.md) → commit + push
- [ ] Set up base design system: color tokens, typography, button styles, spacing scale → commit + push
- [ ] Document your design choices in a new `DESIGN.md` in this folder → commit + push

## Phase 2 — Landing Page & Upload UI

- [ ] Build landing page hero section (headline, CTA buttons) → commit + push
- [ ] Build feature highlights section (e.g. 3-card grid) → commit + push
- [ ] Build mid-page CTA card linking to trial flow → commit + push
- [ ] Build contact/inquiry section → commit + push
- [ ] Build footer component → commit + push
- [ ] Build upload card component (file picker, drag-and-drop) → commit + push
- [ ] Add client-side file validation: accepted formats (MP3/WAV/M4A), file size (~15 MB), duration (~10 min) with specific error messages → commit + push
- [ ] **TEST**: Verify all validation messages display correctly for invalid files → commit + push

## Phase 3 — Processing Status UI

- [ ] Build staged processing indicator (Uploaded → Transcribing → Summarizing → Complete) → commit + push
- [ ] Build error state UI for each failure type (validation, API timeout, server error) → commit + push
- [ ] Add loading states/spinners for all async actions → commit + push
- [ ] **TEST**: Simulate each processing stage and error state to verify display → commit + push

## Phase 4 — Results View

- [ ] Build tab switcher (Transcript / Notes tabs) → commit + push
- [ ] Build Transcript tab: full transcript display with engine/language badge → commit + push
- [ ] Build Notes tab: structured Markdown renderer (headings, bullets, key concepts, terms, takeaways, revision questions) → commit + push
- [ ] Add Copy Notes button (clipboard with confirmation toast) → commit + push
- [ ] Add Download buttons: .txt, .md, .json exports → commit + push
- [ ] Build branded PDF export with LectureScribe Verified Stamp & Seal → commit + push
- [ ] **TEST**: Verify copy, all downloads produce correct output, and PDF renders properly → commit + push

## Phase 5 — Audio Player

- [ ] Build minimalist audio player (play/pause, scrubber, timestamp) → commit + push
- [ ] Add playback speed toggles (1x, 1.25x, 1.5x, 2x) → commit + push
- [ ] Integrate player into results view → commit + push
- [ ] **TEST**: Verify playback, seeking, and speed changes work with a test audio file → commit + push

## Phase 6 — Navigation & Routing

- [ ] Build top nav bar: wordmark logo (left) + Menu pill button (right) → commit + push
- [ ] Build menu dropdown: HOME, TRY LECTURESCRIBE, LOGIN, ABOUT (exact order) → commit + push
- [ ] Add active route visual indicator → commit + push
- [ ] Build mobile navigation modal/drawer → commit + push
- [ ] Set up React Router: `/`, `/trial`, `/login`, `/workspace`, `/about` → commit + push
- [ ] **TEST**: Navigate all routes on desktop and mobile, verify active state → commit + push

## Phase 7 — About Page

- [ ] Build About page: hero, problem/solution narrative, 3-card philosophy grid → commit + push
- [ ] Confirm mobile responsiveness across all pages built so far → commit + push
- [ ] **TEST**: Verify layout on phone, tablet, and desktop viewports → commit + push

## Phase 8 — Auth Page UI

- [ ] Build auth page (`/login`): centered card with toggle between "Log in" and "Create account" → commit + push
- [ ] Build form inputs (email, password) with validation feedback → commit + push
- [ ] Build submit button and error messaging container → commit + push
- [ ] Wire auth forms to backend: `POST /api/auth/signup`, `POST /api/auth/login` → commit + push
  - **Depends on backend**: endpoints must be deployed and returning `{ user: { id, email } }` with auth cookie
- [ ] Implement auth state management: check `GET /api/auth/me` on app load, store user state, handle 401 → commit + push
- [ ] Add logout flow: call `POST /api/auth/logout`, clear state, redirect to landing → commit + push
- [ ] **TEST**: Full signup → login → session persistence → logout cycle → commit + push

## Phase 9 — Trial Mode UI

- [ ] Build trial page (`/trial`): reuse upload/processing/results components → commit + push
- [ ] Display remaining trial credits by calling `GET /api/trial-status` → commit + push
  - **Depends on backend**: `/api/trial-status` must be deployed
- [ ] Build trial exhaustion state: "You've completed your 3 free trials" + signup CTA → commit + push
- [ ] Handle 403 `TRIAL_EXHAUSTED` response gracefully → commit + push
- [ ] **TEST**: Complete 3 trial uploads, verify 4th shows exhaustion UI → commit + push

## Phase 10 — Workspace UI

- [ ] Build workspace page (`/workspace`): route guard redirecting unauthenticated users → commit + push
- [ ] Build workspace header: user email badge + "Log out" button → commit + push
- [ ] Build unlimited upload zone (no trial limits) → commit + push
- [ ] Build past lecture library grid from `GET /api/lectures` → commit + push
  - **Depends on backend**: `GET /api/lectures` must be deployed
- [ ] Build lecture detail view: load from `GET /api/lectures/:id`, show transcript + notes + tutor → commit + push
- [ ] Wire workspace upload to `POST /api/upload` (authenticated) → auto-save → commit + push
- [ ] **TEST**: Upload, view library, open past lecture, verify all data displays → commit + push

## Phase 11 — AI Tutor UI

- [ ] Build tutor drawer/panel: chat interface with input, send button, conversation display → commit + push
- [ ] Wire to `POST /api/chat`: send `{ message, transcript, history }`, display reply → commit + push
  - **Depends on backend + lead (AI pipeline)**: `/api/chat` must return grounded replies
- [ ] Integrate tutor into results view (trial and workspace) → commit + push
- [ ] Wire tutor persistence: `POST /api/lectures/:id/tutor` → commit + push
- [ ] **TEST**: Ask questions, verify responses, check conversation persists across reloads → commit + push

## Phase 12 — Polish

- [ ] Full mobile responsiveness audit → commit + push
- [ ] Accessible contrast and type-size verification → commit + push
- [ ] Add micro-animations and transitions → commit + push
- [ ] Final design consistency pass → commit + push
- [ ] **TEST**: Complete walkthrough of every page and interaction on mobile and desktop → commit + push
