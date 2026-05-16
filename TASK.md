# TASK.md

> Source: docs/design-notes/agent-definition-simplification-design.md (2026-05-15)

## Phase: PR-1 — Agent definition deduplication (#131 §①+§②)
Last updated: 2026-05-16T06:00:00Z
Status: In progress

## Task List

### Phase 1 — Commit 1 (§②)
- [x] TASK-001: Add `### Project-rules consultation (all agents)` section to `src/.claude/rules/aphelion-overview.md` | Target file: src/.claude/rules/aphelion-overview.md
- [x] TASK-002: Remove `## Project-Specific Behavior` section from all 40 agent files | Target files: .claude/agents/*.md (40 files)
- [x] TASK-003: Commit 1 (§②) + push | git

### Phase 2 — Commit 2 (§①)
- [x] TASK-004: Add `## Field Reference` section to `src/.claude/rules/agent-communication-protocol.md` before `## STATUS Definitions` | Target file: src/.claude/rules/agent-communication-protocol.md
- [x] TASK-005: Replace "Output on Completion" templates in 37 agent files with 5-line short form | Target files: .claude/agents/*.md (37 files, excl. discovery/delivery/operations-flow)
- [ ] TASK-006: Commit 2 (§①) + push | git

### Phase 3 — Commit 3 (chore)
- [ ] TASK-007: Update CHANGELOG.md Unreleased entry + reset TASK.md to placeholder | CHANGELOG.md, TASK.md
- [ ] TASK-008: Commit 3 (chore) + push + PR creation | git, gh

## Recent Commits
(Record git log --oneline -3 after each task completion.)

## Session Interruption Notes
(Record the situation here when a session is interrupted.)
