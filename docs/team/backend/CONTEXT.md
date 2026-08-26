# CONTEXT.md — Backend / API

## What you're building

LectureScribe is an AI-powered academic web platform that converts lecture audio into structured study notes. Your job is the Express server, all API routes, PostgreSQL database, authentication system, trial gating, file upload handling, security middleware, and the glue between the frontend and the AI pipeline.

## What you own

1. **Express server** (`backend/src/server.js`) — entry point, middleware stack, route mounting
2. **Auth system** — signup, login, logout, session validation, bcrypt hashing, JWT cookies
3. **Trial gating** — server-side signed session cookie tracking 3 anonymous uploads
4. **File upload handling** — multer config, file type/size/duration validation, temp file cleanup
5. **Database layer** — PostgreSQL connection pool, migrations, queries for users and lectures
6. **Lectures CRUD** — full create/read/update/delete API for persisted lecture records
7. **Security middleware** — helmet headers, CORS config, express-rate-limit on key routes
8. **Integration point** — receive audio from frontend, hand to AI pipeline (built by lead), return results

## API Endpoints you build

### Authentication
| Method | Endpoint | Request | Response | Rate Limited |
|---|---|---|---|---|
| POST | `/api/auth/signup` | `{ email, password }` | `{ user: { id, email } }` + set auth cookie | Yes |
| POST | `/api/auth/login` | `{ email, password }` | `{ user: { id, email } }` + set auth cookie | Yes |
| POST | `/api/auth/logout` | — | `{ message: 'Logged out' }` + clear cookie | No |
| GET | `/api/auth/me` | — (reads cookie) | `{ user: { id, email } }` or 401 | No |

### Upload & Processing
| Method | Endpoint | Description | Rate Limited |
|---|---|---|---|
| POST | `/api/upload` | Accept audio file, validate, pass to AI pipeline, return results | Yes |
| GET | `/api/trial-status` | `{ trialsRemaining, trialsUsed, maxTrials: 3, isAuthenticated }` | No |

**Upload behavior by auth state:**
- **Authenticated (JWT cookie valid)**: process → auto-save to `lectures` table → return results
- **Unauthenticated**: check trial cookie → if `trials_used < 3`, process + increment → if `>= 3`, return 403 `TRIAL_EXHAUSTED`

### Lectures CRUD (all require authentication)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/lectures` | List all lectures for authenticated user |
| GET | `/api/lectures/:id` | Single lecture with full data |
| POST | `/api/lectures` | Save/import a lecture record |
| PUT | `/api/lectures/:id` | Update lecture title or notes |
| DELETE | `/api/lectures/:id` | Delete lecture record |
| POST | `/api/lectures/:id/tutor` | Append to persisted tutor conversation history |

### AI Tutor (forwarded to lead's pipeline)
| Method | Endpoint | Description | Rate Limited |
|---|---|---|---|
| POST | `/api/chat` | Forward `{ message, transcript, history }` to AI pipeline, return `{ reply }` | Yes |

## Database Schema (PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  overview TEXT,
  duration_sec INTEGER,
  engine_used VARCHAR(50),
  language VARCHAR(50),
  file_name VARCHAR(255),
  transcript TEXT,
  key_concepts JSONB DEFAULT '[]',
  main_arguments JSONB DEFAULT '[]',
  important_terms JSONB DEFAULT '[]',
  study_notes JSONB DEFAULT '[]',
  key_takeaways JSONB DEFAULT '[]',
  revision_questions JSONB DEFAULT '[]',
  notes_markdown TEXT,
  tutor_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);
```

## Authentication specification

- **Passwords**: bcrypt with cost factor ≥ 10. Never store plain text.
- **Session tokens**: JWT signed with `JWT_SECRET` from `.env`.
- **Auth cookie**: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production
- **Trial cookie** (`lecture_trial_session`): signed HTTP-only, contains `{ trials_used: 0..3 }`

## What the lead (AI pipeline) gives you

The lead builds the transcription, notes, and tutor services. You call them internally:
- **Transcription service**: audio file path → `{ transcript, language, engine }`
- **Notes service**: transcript → full structured notes object (JSON)
- **Chat service**: `{ message, transcript, history }` → `{ reply }`

Coordinate with the lead on function signatures or HTTP endpoints.

## File handling
- Accept MP3, WAV, M4A via `multer`
- Validate: MIME type + extension, size (~15 MB max), duration (~10 min via `music-metadata`)
- Store temp files in `backend/uploads/`, clean up after processing

## Environment variables (backend `.env`)

```
GROQ_API_KEY=your_key_here
LLM_API_KEY=your_key_here
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
DATABASE_URL=postgresql://user:pass@host:5432/lecturescribe
PORT=5000
```

## Tech stack
- **Runtime**: Node.js (ES modules)
- **Framework**: Express
- **Database**: PostgreSQL (`pg`)
- **Auth**: `bcryptjs` + `jsonwebtoken` + `cookie-parser`
- **Upload**: `multer` + `music-metadata`
- **Security**: `helmet` + `express-rate-limit` + `cors`
- **Deploy**: Render or Railway
