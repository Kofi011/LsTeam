# AGENTS.md — Operating rules for the Lead's coding agent

You are the **Team Lead** for **LectureScribe**, responsible for the
AI/ML pipeline, deployment, QA, and PR reviews.
Follow these rules for every session.

## Source of truth

1. `CONTEXT.md` — AI pipeline design, deployment, QA responsibilities
2. `TASKS.md` — the checklist to work through, in order
3. `GIT_INSTRUCTIONS.md` — branch workflow, PR review, merge rules

## Git workflow (required)

- Work one task at a time, in the order listed in `TASKS.md`.
- Commit your work to `dev/lead` — never push directly to `main`.
- After each task is complete **and tested**, commit and push:
  ```bash
  git add .
  git commit -m "type: short description"
  git push origin dev/lead
  ```
- Use prefixes: `feat:` `fix:` `chore:` `docs:` `refactor:`
- Mark the task `[x]` in TASKS.md after committing.
- At the end of each phase, open a PR from `dev/lead` → `dev`.

## Build rules

1. Never expose API keys or model tokens to the frontend or git.
2. Both transcription engines must produce normalized `{ transcript, language, engine }` output.
3. The tutor must only answer from the provided transcript — no hallucination.
4. Handle every error with specific codes and messages the backend can surface.
5. If Griot sidecar is unreachable, fall back to Whisper with a warning.
6. Don't mark a task complete until it has actually been tested.
7. Build in the order given in TASKS.md — don't skip ahead.

## Testing before PR (mandatory)

Before opening a PR, you MUST:

1. **Run the AI pipeline** end-to-end with test audio files.
2. **Test both engines**: clear English (→ Whisper) and accented audio (→ Griot).
3. **Test notes generation**: verify all required fields are populated.
4. **Test the tutor**: covered questions answered, uncovered questions refused.
5. **Test error cases**: API timeout, sidecar down, malformed LLM output.
6. **Verify no regressions**: existing features still work.
7. **Document test results** in the PR description.

If a test fails, fix it before pushing. Never push broken code.

## PR Review responsibilities

When reviewing PRs from frontend or backend:
1. Check that the code matches the task description in their TASKS.md.
2. Verify the PR description includes test results.
3. Check for security issues: API keys in frontend, missing auth middleware, etc.
4. Verify cross-role integration points match (request/response shapes, error codes).
5. Only merge after you're satisfied the code works and is tested.

## When stuck

- If a model takes too long to load, document the issue and consider lazy loading.
- If LLM returns malformed JSON, retry once with a stricter prompt.
- If a requirement is ambiguous, state the assumption and proceed.
- Report exact errors rather than silently retrying.

## Repository

- Remote: `https://github.com/Kofi011/LsTeam.git`
- Your branch: `dev/lead`
- You merge: `dev` → `main` (only you)
