# LsTeam — LectureScribe Team Repository

## What is LectureScribe?

LectureScribe is an AI-powered academic web platform that converts pre-recorded
lecture audio into structured, exam-ready study materials. Students upload
lecture recordings (MP3, WAV, M4A) and receive: a full transcript, organized
section notes, key concept extractions, a terminology glossary, self-test
revision questions, and access to an interactive AI Academic Tutor grounded
in the lecture content.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + CSS (designer's choice) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | bcrypt + JWT + HTTP-only cookies |
| Primary ASR | Groq Whisper API (`whisper-large-v3-turbo`) |
| Specialized ASR | Griot Nano 1 FastAPI Sidecar (`Qlerqly/griot-nano-1`) |
| Note Generation | LLM API (Groq Llama / Qwen) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render / Railway (with managed PostgreSQL) |

## Team Structure

| Role | Branch | Scope |
|---|---|---|
| **Frontend / UI** | `dev/frontend` | All React pages, components, styling, client-side logic |
| **Backend / API** | `dev/backend` | Express server, routes, database, auth, file validation |
| **Team Lead** | `dev/lead` | AI pipeline (Whisper + Griot), deployment, QA, PR reviews |

See [`docs/TEAM.md`](docs/TEAM.md) for full workflow details.

## Getting Started (Local Dev)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your API keys
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Griot Sidecar (Lead only)
```bash
cd griot_sidecar
pip install -r requirements.txt
uvicorn main:app --port 8001
```

## Environment Variables (backend `.env`)

```
GROQ_API_KEY=your_key_here
LLM_API_KEY=your_key_here
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
DATABASE_URL=postgresql://user:pass@host:5432/lecturescribe
PORT=5000
```

Never commit `.env` — it's gitignored. Use `.env.example` as the template.

## Project Documentation

| File | Purpose |
|---|---|
| [`docs/TEAM.md`](docs/TEAM.md) | Team roles, branch map, workflow rules |
| [`docs/team/frontend/`](docs/team/frontend/) | Frontend person's context, tasks, and git instructions |
| [`docs/team/backend/`](docs/team/backend/) | Backend person's context, tasks, and git instructions |
| [`docs/team/lead/`](docs/team/lead/) | Lead's context, tasks, and git instructions |

## Live Link

_Add the deployed URL here once deployment is complete._
