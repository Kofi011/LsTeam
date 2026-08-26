# TASKS.md — Backend / API

**Branch: `dev-backend`**
**Repo: `https://github.com/Kofi011/LsTeam.git`**

Push to `dev-backend` after each task. Open PR into `dev` at the end of each phase.
**Test every feature before committing — do not push untested code.**

---

## Phase 1 — Project Setup

- [ ] Initialize backend (Node.js + Express, ES modules, `package.json`) → commit + push
- [ ] Configure environment variables: create `.env.example` with all placeholder keys, add `.env` to `.gitignore` → commit + push
- [ ] Set up basic Express server with health check endpoint (`GET /api/health`) → commit + push
- [ ] Install and configure core middleware: `cors`, `cookie-parser`, `dotenv` → commit + push
- [ ] **TEST**: Verify server starts, health check returns 200 → commit + push

## Phase 2 — File Upload & Validation

- [ ] Configure `multer` for multipart file upload (`POST /api/upload`) with temp storage in `backend/uploads/` → commit + push
- [ ] Add server-side file type validation: accept only MP3, WAV, M4A (MIME + extension) → commit + push
- [ ] Add server-side file size validation: reject > ~15 MB with specific error → commit + push
- [ ] Add server-side duration validation: use `music-metadata`, reject > ~10 min → commit + push
- [ ] Add temp file cleanup after processing completes or fails → commit + push
- [ ] Return specific, structured error responses for each validation failure → commit + push
- [ ] **TEST**: Upload valid MP3/WAV/M4A → accepted; upload PDF/oversized/over-length → rejected with correct errors → commit + push

## Phase 3 — Database Setup

- [ ] Set up PostgreSQL connection pool using `pg` (support `DATABASE_URL` from env) → commit + push
- [ ] Create `users` table migration: UUID PK, email UNIQUE, password_hash, timestamps + email index → commit + push
- [ ] Create `lectures` table migration: all fields per schema in CONTEXT.md + indexes → commit + push
- [ ] Test database connection and table creation → commit + push
- [ ] **TEST**: Connect to local PostgreSQL, verify tables created, run a test INSERT + SELECT → commit + push

## Phase 4 — Authentication Service

- [ ] Build `POST /api/auth/signup`: validate, bcrypt hash (rounds ≥ 10), insert user, set JWT cookie, return `{ user }` → commit + push
- [ ] Build `POST /api/auth/login`: validate, verify bcrypt hash, set JWT cookie, return `{ user }` → commit + push
- [ ] Build `POST /api/auth/logout`: clear auth cookie → commit + push
- [ ] Build `GET /api/auth/me`: read + verify JWT from cookie, return user or 401 → commit + push
- [ ] Build auth middleware: verify JWT, attach `req.user`, return 401 if invalid → commit + push
- [ ] Configure cookie settings: `httpOnly`, `sameSite`, `secure` in production → commit + push
- [ ] Add rate limiting on `/api/auth/signup` and `/api/auth/login` → commit + push
- [ ] **TEST**: Full cycle — signup → login → /me returns user → logout → /me returns 401; test duplicate email, wrong password → commit + push

## Phase 5 — Trial Gating

- [ ] Implement signed trial session cookie (`lecture_trial_session`): `{ trials_used: 0..3 }` → commit + push
- [ ] Build trial check middleware: read cookie, increment on success, reject at ≥ 3 with 403 `TRIAL_EXHAUSTED` → commit + push
- [ ] Build `GET /api/trial-status`: return `{ trialsRemaining, trialsUsed, maxTrials: 3, isAuthenticated }` → commit + push
- [ ] Update `POST /api/upload`: authenticated → bypass trial; unauthenticated → check trial cookie → commit + push
- [ ] **TEST**: 3 uploads succeed, 4th returns 403; authenticated user bypasses limit → commit + push

## Phase 6 — Lectures CRUD

- [ ] Build `POST /api/lectures`: save lecture record to database → commit + push
- [ ] Build `GET /api/lectures`: list all lectures for `req.user.id`, ordered by `created_at DESC` → commit + push
- [ ] Build `GET /api/lectures/:id`: single lecture, verify ownership → commit + push
- [ ] Build `PUT /api/lectures/:id`: update fields, verify ownership → commit + push
- [ ] Build `DELETE /api/lectures/:id`: delete record, verify ownership → commit + push
- [ ] Build `POST /api/lectures/:id/tutor`: append to `tutor_history` JSONB, verify ownership → commit + push
- [ ] All lecture endpoints require auth middleware → commit + push
- [ ] **TEST**: Create, list, read, update, delete lectures; verify ownership enforcement (user A can't access user B's lectures) → commit + push

## Phase 7 — AI Pipeline Integration

- [ ] Wire `POST /api/upload` to call the lead's transcription service: pass file path → receive `{ transcript, language, engine }` → commit + push
  - **Depends on lead**: transcription service must be callable
- [ ] Wire `POST /api/upload` to call the lead's notes service: pass transcript → receive structured notes → commit + push
  - **Depends on lead**: notes service must be callable
- [ ] Build `POST /api/chat`: receive `{ message, transcript, history }`, forward to lead's tutor service, return `{ reply }` → commit + push
  - **Depends on lead**: tutor service must be callable
- [ ] Add rate limiting on `/api/upload` and `/api/chat` → commit + push
- [ ] On authenticated upload: auto-save full result to `lectures` table → commit + push
- [ ] **TEST**: Full upload → transcription → notes pipeline returns valid JSON; chat returns grounded reply → commit + push

## Phase 8 — Security Hardening

- [ ] Install and configure `helmet` middleware → commit + push
- [ ] Configure CORS for deployed frontend origin (via env var) → commit + push
- [ ] Audit all endpoints: auth middleware where required, input validation everywhere → commit + push
- [ ] Verify `.env` is gitignored, no secrets committed → commit + push
- [ ] **TEST**: Verify security headers in response, rate limits trigger correctly, CORS blocks unauthorized origins → commit + push
