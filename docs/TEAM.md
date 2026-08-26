# TEAM.md — LectureScribe Team Structure

## Team (3 Members)

| Role | Branch | Scope |
|---|---|---|
| **Frontend / UI** | `dev/frontend` | All React pages, components, styling, client-side logic, PDF export |
| **Backend / API** | `dev/backend` | Express server, all API routes, PostgreSQL, auth, trial gating, file validation, security |
| **Team Lead** | `dev/lead` | AI pipeline (Groq Whisper + Griot Nano 1 + LLM notes + Tutor), deployment, infra, E2E QA, PR reviews |

## Branch Map

```
main                ← Production. Only lead merges here.
 └── dev            ← Integration branch. PRs land here first.
      ├── dev/frontend     ← Frontend person's working branch
      ├── dev/backend      ← Backend person's working branch
      └── dev/lead         ← Lead's working branch (AI pipeline + infra)
```

## Workflow

1. Each member commits and pushes **only to their own branch**.
2. When a meaningful chunk of work is ready, open a **PR from `dev/{role}` into `dev`**.
3. **The lead reviews and merges PRs into `dev`**. No one merges their own PR without review.
4. **Only the lead merges `dev` into `main`** — after E2E testing and team sign-off.
5. **Every agent must test code before opening a PR** — run the relevant test suite, verify the feature works, and include test results in the PR description.

## Lead's Extra Responsibilities

- Reviews and merges all PRs into `dev`
- Only person who merges `dev` → `main`
- Owns the entire AI/ML pipeline (transcription, notes generation, tutor)
- Owns deployment to Vercel (frontend) and Render/Railway (backend)
- Runs end-to-end integration tests after merging PRs
- Breaks ties on scope decisions and cross-role conflicts
- Keeps root documentation in sync with team progress

## Testing Requirements (All Members)

Before opening a PR, every member must:

1. **Run their code locally** and verify the feature works as described in their TASKS.md
2. **Test error cases** — invalid inputs, missing data, edge cases
3. **Verify no regressions** — existing features still work after changes
4. **Include in PR description**:
   - What was built/changed
   - How it was tested
   - Any known limitations or dependencies on other members' work

## Role Documentation

| Role | Folder | Contents |
|---|---|---|
| Frontend / UI | [`docs/team/frontend/`](docs/team/frontend/) | CONTEXT.md, TASKS.md, GIT_INSTRUCTIONS.md, DESIGN_BRIEF.md, AGENTS.md |
| Backend / API | [`docs/team/backend/`](docs/team/backend/) | CONTEXT.md, TASKS.md, GIT_INSTRUCTIONS.md, AGENTS.md |
| Team Lead | [`docs/team/lead/`](docs/team/lead/) | CONTEXT.md, TASKS.md, GIT_INSTRUCTIONS.md, AGENTS.md |

Hand each person their folder. They read CONTEXT.md first, then follow TASKS.md in order. AGENTS.md tells their coding agent how to operate.
