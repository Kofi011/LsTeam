# TASKS.md — Team Lead (AI Pipeline + Deployment + QA)

**Branch: `dev-lead`**
**Repo: `https://github.com/Kofi011/LsTeam.git`**

Push to `dev-lead` after each task. Open PR into `dev` at the end of each phase.
**Test every feature before committing — do not push untested code.**

---

## Phase 0 — Repo & Branch Setup

- [x] Initialize LsTeam repo with `.gitignore`, `README.md`, and `docs/` → commit + push to `main`
- [x] Create `dev` branch off `main` → push
- [x] Create `dev-frontend`, `dev-backend`, `dev-lead` branches off `dev` → push all
- [x] Add team documentation (`docs/TEAM.md`, `docs/team/` role folders) → commit + push
- [x] Create `.env.example` with all placeholder keys → commit + push
- [x] Verify all collaborators can clone and checkout their branches

## Phase 1 — Griot Nano 1 Sidecar

- [x] Set up `griot_sidecar/` with FastAPI, `requirements.txt` → commit + push
- [x] Implement `GET /health` endpoint → commit + push
- [x] Load `Qlerqly/griot-nano-1` model (ConformerCTC) → commit + push
- [x] Implement `POST /transcribe`: accept audio, preprocess, inference, return `{ transcript, language, engine: "griot-nano-1" }` → commit + push
- [x] Handle errors: unsupported format, model loading, inference timeout → commit + push
- [x] **TEST**: Transcribe MP3, WAV, M4A files; verify output shape and error handling → commit + push

## Phase 2 — Groq Whisper Integration

- [x] Set up Groq SDK in Node.js (`groq-sdk`) → commit + push
- [x] Implement Whisper transcription: send audio to `whisper-large-v3-turbo` with `verbose_json` → commit + push
- [x] Parse response: extract transcript, language, `avg_logprob`, `no_speech_prob` → commit + push
- [x] Return normalized: `{ transcript, language: "en", engine: "whisper" }` → commit + push
- [x] Handle errors: rate limits, timeouts, invalid audio → specific error codes → commit + push
- [x] **TEST**: Transcribe clear English audio; verify transcript quality and metadata → commit + push

## Phase 3 — Intelligent ASR Routing

- [x] Implement ~20-30s audio sample extraction for routing decisions → commit + push
- [x] Implement routing logic: evaluate Whisper sample's language + confidence signals → commit + push
- [x] Route: high-confidence English → Whisper; low confidence / non-English → Griot → commit + push
- [x] Implement fallback: if Griot unreachable → Whisper-only with warning → commit + push
- [x] Normalize both engines to `{ transcript, language, engine }` → commit + push
- [x] **TEST**: Clear English → Whisper; accented → Griot; sidecar down → Whisper fallback → commit + push

## Phase 4 — Notes Generation (LLM)

- [ ] Design summarization prompt producing all required fields as valid JSON → commit + push
- [ ] Implement LLM call: transcript + prompt → Groq Llama/Qwen → parse response → commit + push
- [ ] Handle malformed JSON: detect, retry once, return structured error → commit + push
- [ ] Validate output: check all required fields present → commit + push
- [ ] **TEST**: Generate notes from 1-min, 5-min, 10-min transcripts; verify all fields populated → commit + push

## Phase 5 — AI Academic Tutor

- [ ] Design tutor system prompt: answer only from transcript, refuse off-topic → commit + push
- [ ] Implement tutor function: `{ message, transcript, history }` → LLM call → `{ reply }` → commit + push
- [ ] **TEST**: Ask covered questions → answers; ask uncovered questions → refuses; multi-turn → uses history → commit + push

## Phase 6 — Pipeline Integration with Backend

- [ ] Expose clean interfaces for backend: `transcribe(filePath)`, `generateNotes(transcript)`, `chat({...})` → commit + push
  - **Coordinate with backend**: agree on function signatures or HTTP contracts
- [ ] Test full pipeline end-to-end: audio → routing → transcription → notes → tutor → commit + push
- [ ] Test edge cases: very short audio, max length, silence, noisy audio → commit + push
- [ ] Document tunable parameters (routing thresholds, prompt templates) → commit + push
- [ ] **TEST**: Complete pipeline produces valid results for all supported file types and durations → commit + push

## Phase 7 — Local Dev Environment Verification

- [ ] Verify frontend dev server runs and displays all pages → commit + push
- [ ] Verify backend dev server runs, health check passes → commit + push
- [ ] Verify Griot sidecar runs, `/health` returns OK → commit + push
- [ ] Verify frontend ↔ backend communication (CORS, proxy) → commit + push
- [ ] Document full local setup in root `README.md` → commit + push

## Phase 8 — Integration Testing (E2E)

- [ ] Test full upload flow: frontend upload → backend validation → AI transcription → notes → results display → commit + push
- [ ] Test with MP3 (clear English) → Whisper engine used → commit + push
- [ ] Test with WAV → accepted and processed → commit + push
- [ ] Test with M4A → accepted and processed → commit + push
- [ ] Test with accented audio → Griot routing triggers → commit + push
- [ ] Test invalid file type → client + server rejection → commit + push
- [ ] Test oversized file → rejection with error → commit + push
- [ ] Test over-length audio → rejection with error → commit + push

## Phase 9 — Auth & Trial Integration Testing

- [ ] Test signup → login → session persistence → logout → commit + push
- [ ] Test trial gating: 3 uploads succeed → 4th returns 403 → UI shows CTA → commit + push
- [ ] Test authenticated upload bypasses trial → lecture auto-saved → commit + push
- [ ] Test workspace: library loads, detail view works, tutor persists → commit + push
- [ ] Test all export formats: copy, .txt, .md, .json, branded PDF → commit + push

## Phase 10 — Pre-Deployment Audit

- [ ] Mobile responsiveness audit across all pages → commit + push
- [ ] Security audit: no API keys in frontend, cookies HTTP-only, rate limits work → commit + push
- [ ] Error handling audit: every error path tested → commit + push
- [ ] **TEST**: Full walkthrough of every feature on mobile and desktop → commit + push

## Phase 11 — Deployment

- [ ] Merge `dev` into `main` (after all tests pass)
- [ ] Deploy backend to Render/Railway: set production env vars, run migrations → verify health
- [ ] Deploy frontend to Vercel: set backend URL → verify pages load
- [ ] Deploy Griot sidecar (if separate) → verify `/health`
- [ ] E2E test on live deployment: full upload → notes → tutor → export → commit + push
- [ ] Update `README.md` with live URL → commit + push
