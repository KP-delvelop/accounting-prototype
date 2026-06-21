# Codex Team Rules

This repository is shared by KP-delvelop, teammates, and AI coding agents. Read this file before making changes.

## Golden Rules

- Never push directly to `main`.
- Work on one task per branch.
- Keep branches small and focused.
- Stage only files related to the current task.
- Open a pull request before merging.
- Run `npm run build` before asking for review.
- Do not commit secrets, API keys, customer files, database exports, or private documents.
- Do not run destructive git commands such as `git reset --hard` unless KP-delvelop explicitly asks.

## Branch Names

Use short, clear branch names:

- `feature/journal-entry-approval`
- `feature/report-export`
- `fix/trial-balance-total`
- `codex/account-search`
- `docs/team-workflow`

## Start Of Every Task

1. Check the current branch and status.
2. Confirm the task scope.
3. Create or switch to a task branch.
4. Pull or merge the latest `main` before heavy edits.
5. Avoid editing files already being changed by another active task.

Useful commands:

```powershell
git status -sb
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feature/my-task
```

## Before Opening A PR

Run:

```powershell
npm run build
git status -sb
```

The PR should explain:

- what changed
- why it changed
- how it was tested
- screenshots for UI changes
- any risks or follow-up work

## Conflict Rules

If `main` changed while you were working:

1. Fetch latest `main`.
2. Merge or rebase carefully.
3. Resolve conflicts by preserving both people's intended work.
4. Re-run `npm run build`.
5. Mention the conflict in the PR.

If the conflict touches accounting logic, ask KP-delvelop before guessing.

## AI Agent Rules

When Codex or another AI works here:

- Read `AGENTS.md` first.
- State the branch and task before editing.
- Do not include unrelated local changes in a commit.
- Prefer small commits and a draft PR.
- Do not deploy to Netlify unless KP-delvelop asks.
- Do not change repository permissions or secrets.
- Ask before changing accounting rules, data model, auth, payments, or production deployment.

## Current App Commands

```powershell
npm install
npm run dev
npm run build
npm run preview
```

Use `C:\Program Files\nodejs\npm.cmd` on Windows if PowerShell blocks `npm.ps1`.
