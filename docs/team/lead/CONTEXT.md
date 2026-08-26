# CONTEXT.md — Team Lead (AI Pipeline + Deployment + QA)

## What you're responsible for

LectureScribe is an AI-powered academic web platform that converts lecture audio into structured study notes. As lead, you own: the entire AI/ML pipeline (transcription, notes generation, tutor), deployment infrastructure, end-to-end testing, PR reviews, and the final merge to `main`.

## AI Pipeline — What you build

### 1. Dual Transcription Engine

**Engine 1: Groq Whisper API**
- Model: `whisper-large-v3-turbo`
- Call via Groq SDK with `verbose_json` response format
- Returns: transcript, detected language, per-segment metrics (`avg_logprob`, `no_speech_prob`)
- Use for: clear English lectures

**Engine 2: Griot Nano 1 Sidecar**
- Model: `Qlerqly/griot-nano-1` (ConformerCTC)
- Runs as FastAPI container: `POST /transcribe`, `GET /health`
- Use for: African-accented English, multilingual speech
- Dependencies: `transformers`, `torch`, `torchaudio`, `soundfile`, `fastapi`, `uvicorn`

### 2. Intelligent ASR Routing

```
Audio file received
       │
       ▼
Extract ~20-30s sample → Send to Whisper (verbose_json)
       │
       ▼
Evaluate: language, avg_logprob, no_speech_prob
       │
  ┌────┴────┐
  ▼         ▼
High-conf   Low-conf / Non-English
English          │
  │              ▼
  ▼         Griot Nano 1
Whisper          │
(full file)      │
  │              │
  └──────┬───────┘
         ▼
Normalized: { transcript, language, engine }
```

### 3. Notes Generation (LLM)

Prompt the LLM (Groq Llama / Qwen) to produce:

| Field | Type | Description |
|---|---|---|
| `title` | string | Suggested lecture title |
| `overview` | string | 2-3 sentence summary |
| `study_notes` | array | `[{ heading, bullets[] }]` — section notes |
| `key_concepts` | array | Core ideas |
| `main_arguments` | array | Main theses |
| `important_terms` | array | `[{ term, definition }]` — glossary |
| `key_takeaways` | array | Most important points |
| `revision_questions` | array | `[{ question, answer }]` — self-test |
| `notes_markdown` | string | Complete Markdown document |

### 4. AI Academic Tutor

Receives `{ message, transcript, history }`, returns `{ reply }`.
- Answers only from transcript content (no hallucination)
- Uses conversation history for multi-turn context
- Refuses questions not covered by the transcript

## What you expose to the backend

The backend person calls your services internally:

1. **`transcribe(filePath)`** → `{ transcript, language, engine }`
2. **`generateNotes(transcript)`** → full structured notes object (JSON)
3. **`chat({ message, transcript, history })`** → `{ reply }`

Coordinate with the backend person on function signatures or HTTP endpoints.

## Lead Responsibilities

### PR Reviews & Merging
- Review and merge all PRs from `dev-frontend` and `dev-backend` into `dev`
- You are the only one who merges `dev` → `main`

### Deployment
- Deploy backend to Render / Railway with managed PostgreSQL
- Deploy frontend to Vercel
- Deploy Griot sidecar (if hosted separately)
- Configure production env vars on all platforms

### E2E Testing & QA
- Test full pipeline: upload → transcribe → notes → export
- Test with MP3, WAV, M4A of varying quality and accents
- Test trial gating, auth flows, workspace CRUD
- Test error cases: invalid files, API failures, expired sessions
- Verify mobile responsiveness

## Cross-role integration points

| Integration | Frontend needs | Backend provides | You provide (AI) |
|---|---|---|---|
| Upload flow | POST `/api/upload` response | Endpoint + validation | Transcription + notes |
| Auth flow | Cookie-based sessions | Auth endpoints + JWT | — |
| Trial gating | Trial status + 403 handling | Trial cookie + gating | — |
| Tutor chat | POST `/api/chat` response | Endpoint + rate limiting | Grounded Q&A |
| Lecture library | GET `/api/lectures` | CRUD endpoints | — |

## Environment variables

```
GROQ_API_KEY=your_key_here
LLM_API_KEY=your_key_here
HF_TOKEN=your_hf_token
GRIOT_SIDECAR_URL=http://localhost:8001
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
DATABASE_URL=postgresql://...
PORT=5000
```

## Tech stack you use
- **Groq SDK** (`groq-sdk`) — Whisper API + LLM calls
- **Python / FastAPI** — Griot Nano 1 sidecar
- **PyTorch + Transformers** — model runtime
- **Vercel** — frontend deploy
- **Render / Railway** — backend deploy
