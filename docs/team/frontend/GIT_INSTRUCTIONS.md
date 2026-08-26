# Git Workflow — Frontend

**Your branch: `dev/frontend`**
**Remote: `https://github.com/Kofi011/LsTeam.git`**

## Initial Setup

```bash
git clone https://github.com/Kofi011/LsTeam.git
cd LsTeam
git checkout -b dev/frontend
git push -u origin dev/frontend
```

## Rules

1. **Only commit and push to `dev/frontend`.** Never push to `dev` or `main` directly.

2. **One task from TASKS.md = one commit.** Use prefixes:
   - `feat:` — new feature or UI component
   - `fix:` — bug fix
   - `chore:` — config, cleanup, tooling
   - `docs:` — documentation only

3. **Test before committing.** Run your code locally, verify the feature works, test error cases. Do not push untested code.

4. **Push to `dev/frontend` as soon as a task is done and tested:**
   ```bash
   git add .
   git commit -m "feat: build landing page hero section"
   git push origin dev/frontend
   ```

5. **When a phase is complete**, open a PR from `dev/frontend` into `dev` on GitHub.
   - Include in the PR description: what was built, how it was tested, any dependencies on other members' work.

6. **Don't merge your own PR.** Wait for the lead to review and approve.

7. **Pull from `dev` regularly** to stay in sync:
   ```bash
   git checkout dev/frontend
   git pull origin dev
   ```

## Quick Reference

```bash
# Start your day
git checkout dev/frontend
git pull origin dev

# Work on a task
# ... make changes ...
# ... test locally ...
git add .
git commit -m "feat: short description"
git push origin dev/frontend

# Phase complete → Open PR on GitHub: dev/frontend → dev
```
