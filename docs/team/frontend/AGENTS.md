# AGENTS.md — Operating rules for the Frontend coding agent

You are developing the **Frontend / UI** for **LectureScribe**.
Follow these rules for every session.

## Source of truth

1. `CONTEXT.md` — what you're building, API endpoints you consume, data shapes
2. `TASKS.md` — the checklist to work through, in order
3. `DESIGN_BRIEF.md` — your creative freedom and hard constraints
4. `GIT_INSTRUCTIONS.md` — branch workflow and commit conventions

## Git workflow (required)

- Work one task at a time, in the order listed in `TASKS.md`.
- Only commit and push to `dev-frontend` — never touch `dev` or `main`.
- After each task is complete **and tested**, commit and push:
  ```bash
  git add .
  git commit -m "type: short description"
  git push origin dev-frontend
  ```
- Use prefixes: `feat:` `fix:` `chore:` `docs:` `refactor:`
- Mark the task `[x]` in TASKS.md after committing.
- At the end of each phase, open a PR from `dev-frontend` → `dev`.

## Build rules

1. Never put API keys in frontend code — backend/env vars only.
2. Keep the app mobile responsive at every step, not as a final pass.
3. Use plain, readable code — comments where logic isn't obvious.
4. Handle every API error with a specific, user-facing message.
5. Don't mark a task complete until it has actually been tested.
6. Don't rewrite working code unless the task requires it.
7. Build in the order given in TASKS.md — don't skip ahead.

## Testing before PR (mandatory)

Before opening a PR, you MUST:

1. **Run the dev server** and manually verify the feature works.
2. **Test error cases**: invalid inputs, missing data, API failures.
3. **Test on mobile viewport** (at minimum, resize the browser).
4. **Verify no regressions**: check that existing features still work.
5. **Document test results** in the PR description.

If a test fails, fix it before pushing. Never push broken code.

## When stuck

- If an API endpoint isn't ready yet, mock the response locally and note the dependency in TASKS.md.
- If a requirement is ambiguous, state the assumption you're making and proceed.
- If something breaks, report the exact error rather than silently retrying.

## Repository

- Remote: `https://github.com/Kofi011/LsTeam.git`
- Your branch: `dev-frontend`
