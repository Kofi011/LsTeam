# AGENTS.md — Operating rules for the Backend coding agent

You are developing the **Backend / API** for **LectureScribe**.
Follow these rules for every session.

## Source of truth

1. `CONTEXT.md` — what you're building, endpoints, database schema, auth spec
2. `TASKS.md` — the checklist to work through, in order
3. `GIT_INSTRUCTIONS.md` — branch workflow and commit conventions

## Git workflow (required)

- Work one task at a time, in the order listed in `TASKS.md`.
- Only commit and push to `dev-backend` — never touch `dev` or `main`.
- After each task is complete **and tested**, commit and push:
  ```bash
  git add .
  git commit -m "type: short description"
  git push origin dev-backend
  ```
- Use prefixes: `feat:` `fix:` `chore:` `docs:` `refactor:`
- Mark the task `[x]` in TASKS.md after committing.
- At the end of each phase, open a PR from `dev-backend` → `dev`.

## Build rules

1. Never expose API keys, JWT secrets, or session secrets to the frontend or git.
2. All passwords must be hashed with bcrypt (cost ≥ 10) before storage.
3. All auth cookies must be `httpOnly`, `sameSite: 'lax'`, and `secure` in production.
4. Use plain, readable code — comments where logic isn't obvious.
5. Handle every error with a specific, structured JSON response the frontend can display.
6. Don't mark a task complete until it has actually been tested.
7. Don't rewrite working code unless the task requires it.
8. Build in the order given in TASKS.md — don't skip ahead.

## Testing before PR (mandatory)

Before opening a PR, you MUST:

1. **Start the server** and verify it runs without errors.
2. **Hit every new endpoint** with valid and invalid inputs (use curl, Postman, or a test script).
3. **Test error cases**: wrong password, duplicate email, invalid file type, expired token, trial exhaustion.
4. **Verify no regressions**: existing endpoints still work.
5. **Document test results** in the PR description.

If a test fails, fix it before pushing. Never push broken code.

## When stuck

- If the AI pipeline (lead's service) isn't ready, mock the transcription/notes response and note the dependency.
- If a requirement is ambiguous, state the assumption and proceed.
- If an API call fails repeatedly, report the exact error.

## Repository

- Remote: `https://github.com/Kofi011/LsTeam.git`
- Your branch: `dev-backend`
