# Git Conventions

Use Conventional Commits:

```text
feat: add product search
fix: correct cart quantity update
refactor: simplify order service
test: add checkout tests
docs: update payment architecture
chore: update dependencies
```

---

# Rules

- Small, focused commits; one concern per commit. No unrelated mixing.
- Never commit: secrets, `.env*`, `node_modules/`, build output (`.next/`, `out/`), generated credentials.
- Branch: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`; PRs with description + test evidence (`lint/typecheck/test/build` results).
- Main is deployable; tag releases `vX.Y.Z` with CHANGELOG.md entries.
