# Git Workflow — Backend

**Your branch: `dev-backend`**
**Remote: `https://github.com/Kofi011/LsTeam.git`**

## Initial Setup

```bash
git clone https://github.com/Kofi011/LsTeam.git
cd LsTeam
git checkout -b dev-backend
git push -u origin dev-backend
```

## Rules

1. **Only commit and push to `dev-backend`.** Never push to `dev` or `main` directly.

2. **One task from TASKS.md = one commit.** Use prefixes:
   - `feat:` — new feature, endpoint, or service
   - `fix:` — bug fix
   - `chore:` — config, cleanup, tooling
   - `docs:` — documentation only

3. **Test before committing.** Run the server, hit the endpoint, verify the response. Do not push untested code.

4. **Push to `dev-backend` as soon as a task is done and tested:**
   ```bash
   git add .
   git commit -m "feat: add /api/auth/signup endpoint with bcrypt"
   git push origin dev-backend
   ```

5. **When a phase is complete**, open a PR from `dev-backend` into `dev` on GitHub.
   - Include in the PR description: what was built, how it was tested, any dependencies.

6. **Don't merge your own PR.** Wait for the lead to review and approve.

7. **Pull from `dev` regularly** to stay in sync:
   ```bash
   git checkout dev-backend
   git pull origin dev
   ```

## Quick Reference

```bash
# Start your day
git checkout dev-backend
git pull origin dev

# Work on a task
# ... make changes ...
# ... test locally ...
git add .
git commit -m "feat: short description"
git push origin dev-backend

# Phase complete → Open PR on GitHub: dev-backend → dev
```
