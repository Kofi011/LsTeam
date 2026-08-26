# CONTEXT.md — Frontend / UI

## What you're building

LectureScribe is an AI-powered academic web platform that converts lecture audio into structured study notes. Your job is every screen the user sees and interacts with — React components, pages, routing, styling, client-side validation, and responsive design.

## Platform pages you own

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing Page | Hero headline, feature highlights, example notes, mid-page CTA, contact section |
| `/trial` | Trial Page | Upload flow for anonymous users (3 free uploads), remaining credits display |
| `/login` | Auth Page | Unified login / signup toggle, form validation, auth state management |
| `/workspace` | Protected Workspace | Unlimited uploads, past lecture library grid, full study toolkit |
| `/about` | About Page | Mission statement, problem/solution narrative, 3-card architecture grid |

## Key UI components you own

- **Nav** — Top bar with wordmark logo (left) and Menu pill button (right); dropdown with HOME, TRY LECTURESCRIBE, LOGIN, ABOUT
- **UploadCard** — File picker, drag-and-drop, format/size/duration validation feedback
- **ProcessingPage** — Staged indicator: Uploaded → Transcribing → Summarizing → Complete
- **ResultsPage** — Tab switcher (Transcript / Notes), copy/download buttons, export options
- **AudioPlayer** — Minimalist player with play/pause, scrubber, speed toggles (1x, 1.25x, 1.5x, 2x)
- **MarkdownRenderer** — Renders structured notes (headings, bullets, key concepts, terms)
- **LectureTutorDrawer** — AI Tutor chat interface (sends messages to `/api/chat`, displays responses)
- **HeroSection, HowItWorks, DarkHeroCard, InfiniteMarquee** — Landing page sections
- **ContactSection** — Contact form on landing page
- **Footer** — Site-wide footer

## What the backend gives you

You consume these API endpoints (built by the backend person). Don't build these — just call them.

### Auth
- `POST /api/auth/signup` — `{ email, password }` → `{ user: { id, email } }` + sets auth cookie
- `POST /api/auth/login` — `{ email, password }` → `{ user: { id, email } }` + sets auth cookie
- `POST /api/auth/logout` — clears auth cookie
- `GET /api/auth/me` — returns `{ user: { id, email } }` or 401

### Upload & Trial
- `POST /api/upload` — multipart form with audio file → returns transcript + notes JSON
  - If authenticated: processes and auto-saves to database
  - If unauthenticated: checks trial cookie, processes if < 3 used, returns 403 `TRIAL_EXHAUSTED` if ≥ 3
- `GET /api/trial-status` — `{ trialsRemaining, trialsUsed, maxTrials: 3, isAuthenticated }`

### Lectures (authenticated only)
- `GET /api/lectures` — list of all user's lectures
- `GET /api/lectures/:id` — single lecture with full data
- `POST /api/lectures` — save/import lecture
- `PUT /api/lectures/:id` — update title/notes
- `DELETE /api/lectures/:id` — delete lecture

### AI Tutor
- `POST /api/chat` — `{ message, transcript, history }` → `{ reply }`
- `POST /api/lectures/:id/tutor` — append tutor conversation to persisted history

## Uploaded file constraints (validate client-side)
- Accepted formats: MP3, WAV, M4A
- Max duration: ~10 minutes
- Max file size: ~15 MB
- Show specific error messages for each validation failure

## Response data shape (what you render)

The upload endpoint returns a JSON object you'll render across tabs:

```json
{
  "title": "Suggested Lecture Title",
  "overview": "Brief summary paragraph",
  "transcript": "Full transcript text...",
  "key_concepts": ["Concept 1", "Concept 2"],
  "main_arguments": ["Argument 1", "Argument 2"],
  "important_terms": [{ "term": "...", "definition": "..." }],
  "study_notes": [{ "heading": "...", "bullets": ["..."] }],
  "key_takeaways": ["Takeaway 1", "Takeaway 2"],
  "revision_questions": [{ "question": "...", "answer": "..." }],
  "notes_markdown": "Full structured markdown notes...",
  "engine_used": "whisper | griot-nano-1",
  "language": "en",
  "duration_sec": 360
}
```

## Export formats you implement
- **Copy to clipboard** — formatted notes with confirmation toast
- **Download .txt** — plain text
- **Download .md** — Markdown
- **Download .json** — complete JSON with all fields
- **Download PDF** — branded PDF with LectureScribe Verified Stamp & Seal (client-side, e.g. jsPDF or html2pdf)

## Tech stack
- **React** (JSX, functional components, hooks)
- **CSS framework**: your choice — see `DESIGN_BRIEF.md`
- **Routing**: React Router
- **Build**: Vite
- **Deploy**: Vercel

## Non-functional requirements
- Mobile-responsive across all pages (phones, tablets, desktops)
- Accessible contrast and readable type at every size
- Specific, human-readable error messages for all failure types
- Loading states for all async actions
- No API keys in frontend code — ever
