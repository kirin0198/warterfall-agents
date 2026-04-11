# Git Rules

## Commit Granularity
- One commit per task (do not bundle multiple tasks)
- Test code is committed the same way as implementation code

## Staging (Important)
- `git add -A` is **prohibited** (prevents accidental inclusion of sensitive/unnecessary files)
- Use `git add {target-files}` to stage explicitly
- Never commit `.env`, `credentials.*`, `*.secret`, etc.

## Commit Message Format

```
{prefix}: {task-name} (TASK-{N})

- {bullet points of implementation details}
- Related UC: UC-XXX (if applicable)
```

| prefix | Usage |
|--------|-------|
| `feat:` | New feature / new endpoint |
| `fix:` | Bug fix |
| `refactor:` | Refactoring |
| `test:` | Test additions/modifications |
| `docs:` | Documentation additions/modifications |
| `chore:` | Configuration / environment |
| `ci:` | CI/CD related |
| `ops:` | Infrastructure / operations related |
