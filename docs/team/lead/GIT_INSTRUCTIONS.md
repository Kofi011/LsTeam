# Git Workflow — Team Lead

**Your branch: `dev/lead`**
**Remote: `https://github.com/Kofi011/LsTeam.git`**

## Initial Setup

```bash
git clone https://github.com/Kofi011/LsTeam.git
cd LsTeam
git checkout -b dev
git push -u origin dev
git checkout -b dev/lead
git push -u origin dev/lead
git checkout -b dev/frontend
git push -u origin dev/frontend
git checkout -b dev/backend
git push -u origin dev/backend
git checkout dev/lead
```

## Rules

1. **Your own work goes to `dev/lead`.** Commit AI pipeline, infra, and QA work there.

2. **One task = one commit.** Use prefixes: `feat:`, `fix:`, `chore:`, `docs:`

3. **Test before committing.** Run the code, verify the feature, test edge cases.

4. **Push to `dev/lead` as soon as a task is done and tested:**
   ```bash
   git add .
   git commit -m "feat: implement dual-engine routing logic"
   git push origin dev/lead
   ```

5. **Open a PR from `dev/lead` into `dev`** for your own work.

6. **You review and merge all team PRs into `dev`:**
   - Review PRs from `dev/frontend` → `dev`
   - Review PRs from `dev/backend` → `dev`
   - Verify the PR description includes test results
   - Merge after approval

7. **You are the only one who merges `dev` → `main`:**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

8. **Pull from `dev` regularly:**
   ```bash
   git checkout dev/lead
   git pull origin dev
   ```

## Quick Reference

```bash
# Start your day
git checkout dev/lead
git pull origin dev

# Work on a task
git add .
git commit -m "feat: short description"
git push origin dev/lead

# Review teammate's PR on GitHub → Approve → Merge into dev

# Deploy to production
git checkout main
git merge dev
git push origin main
```
