# Contributing

This project uses a branch and pull request workflow so teammates and AI agents do not overwrite each other.

## Workflow

1. Pick or create a GitHub Issue for the task.
2. Assign one owner to the issue.
3. Create a new branch from the latest `main`.
4. Make the change.
5. Run the build.
6. Open a pull request.
7. Ask for review.
8. Merge only after the branch is up to date and checks pass.

## Do Not Work Directly On Main

`main` should always represent the latest stable version. All changes should enter through pull requests.

Recommended repository settings:

- Private repository
- Require pull request before merge
- Require branch to be up to date before merge
- Require status checks to pass
- Require at least one approval
- Restrict who can push to `main`

## Task Ownership

Use Issues to avoid overlap:

- One issue per feature, bug, or experiment.
- One main owner per issue.
- Comment before starting work.
- If two people need the same file, agree who edits first.

## Pull Request Checklist

Before opening a PR:

- [ ] The branch name matches the task.
- [ ] The PR touches only files related to the task.
- [ ] `npm run build` passes.
- [ ] UI changes include screenshots.
- [ ] The PR explains risks or follow-up work.

## Local Development

```powershell
npm install
npm run dev
npm run build
npm run preview
```

On Windows, use this if PowerShell blocks `npm`:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

## Data And Security

Do not commit:

- `.env` files
- API keys
- customer documents
- private Excel files
- database dumps
- generated credentials

Use sample/demo data only.
