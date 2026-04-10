# CLAUDE.md — Telescope Workflow Common Rules

This file defines the common rules referenced by all agents in the Telescope workflow.
Agent-specific rules are documented in the individual files under `.claude/agents/`.

> **For flow orchestrators:** Orchestrator-specific rules (triage, handoff file specification, approval gate, error handling, phase execution loop, rollback rules) are defined in `.claude/orchestrator-rules.md`. Read this file at startup.

---

## Telescope Workflow Model

Telescope divides the entire project lifecycle into three domains — **Discovery (requirements exploration) → Delivery (design & implementation) → Operations (deploy & operations)** — each managed by an independent orchestrator (flow).

### Design Principles

- **Domain separation**: Each domain runs in an independent session
- **File handoff**: Domains are connected via `.md` files (DISCOVERY_RESULT.md, DELIVERY_RESULT.md). No automatic chaining
- **Session isolation**: Each flow orchestrator runs in its own session to prevent context window bloat
- **Triage adaptation**: Each flow orchestrator assesses project characteristics at flow start and selects from 4 tiers: Minimal / Light / Standard / Full
- **Independent invocation**: Any agent can be invoked standalone as long as its input files are available

### Domain and Flow Overview

```
Discovery Flow ──[DISCOVERY_RESULT.md]──▶ Delivery Flow ──[DELIVERY_RESULT.md]──▶ Operations Flow
 (requirements)                         (design & impl)                       (deploy & ops)
 6 agents                               12 agents                              4 agents
```

### Branching by Product Type

| PRODUCT_TYPE | Discovery | Delivery | Operations |
|-------------|-----------|----------|------------|
| `service` | Run | Run | Run |
| `tool` / `library` / `cli` | Run | Run | **Skip** |

---

## Directory Structure

Agent definitions are stored in `.claude/agents/` (the standard Claude Code location).

```
.claude/agents/
├── discovery-flow.md       # Discovery Flow (orchestrator)
├── interviewer.md
├── researcher.md
├── poc-engineer.md
├── concept-validator.md
├── scope-planner.md
├── rules-designer.md
├── delivery-flow.md        # Delivery Flow (orchestrator)
├── spec-designer.md
├── ux-designer.md
├── architect.md
├── scaffolder.md
├── developer.md
├── test-designer.md
├── e2e-test-designer.md
├── tester.md
├── reviewer.md
├── security-auditor.md
├── doc-writer.md
├── releaser.md
├── analyst.md
├── codebase-analyzer.md    # Standalone (existing project onboarding)
├── operations-flow.md      # Operations Flow (orchestrator)
├── infra-builder.md
├── db-ops.md
├── observability.md
└── ops-planner.md
```

---

## Language Rules

- Code, variable names, commit messages: **English**
- Agent definition files (instructions, rules, guidelines): **English**
- Code comments, user-facing documentation, reports to user: **Japanese**
- AGENT_RESULT block keys/values: **English**
- User-facing CLI output (AskUserQuestion content, approval gates, progress displays): **Japanese**

---

## Inter-Agent Communication Protocol

### AGENT_RESULT Block (Required)

All agents must output an `AGENT_RESULT` block upon work completion.
Each domain's flow orchestrator parses this output to determine next-phase decisions.

> **Flow orchestrator exception:** Discovery Flow / Delivery Flow / Operations Flow themselves do not output `AGENT_RESULT`. The flow orchestrator's final artifact is the handoff file (e.g., DISCOVERY_RESULT.md), and completion is reported via the approval gate.

```
AGENT_RESULT: {agent-name}
STATUS: success | error | failure | suspended | blocked | approved | conditional | rejected
...(agent-specific fields)
NEXT: {next-agent-name | done | suspended}
```

### STATUS Definitions

| STATUS | Meaning | Orchestrator Action |
|--------|---------|-------------------|
| `success` | Completed successfully | Proceed to approval gate |
| `error` | Failed to complete due to error | Report to user and ask for decision |
| `failure` | Quality issue (e.g., test failure) | Follow rollback rules |
| `suspended` | Session interrupted | Prompt user to resume |
| `blocked` | Cannot continue due to design ambiguity | Flow orchestrator launches lightweight query to the target agent |
| `approved` / `conditional` / `rejected` | Review result | Rollback or completion decision |

### blocked STATUS Usage

Used when `developer` discovers design ambiguity or contradiction during implementation.

```
AGENT_RESULT: developer
STATUS: blocked
BLOCKED_REASON: {reason}
BLOCKED_TARGET: architect
CURRENT_TASK: TASK-005
NEXT: suspended
```

---

## Git Rules

### Commit Granularity
- One commit per task (do not bundle multiple tasks)
- Test code is committed the same way as implementation code

### Staging (Important)
- `git add -A` is **prohibited** (prevents accidental inclusion of sensitive/unnecessary files)
- Use `git add {target-files}` to stage explicitly
- Never commit `.env`, `credentials.*`, `*.secret`, etc.

### Commit Message Format

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

---

## Document Versioning

### Recording Update History

When updating any design document (SPEC.md, ARCHITECTURE.md, UI_SPEC.md, TEST_PLAN.md), record the update date at the beginning of the file.

```markdown
> 最終更新: {YYYY-MM-DD}
> 更新履歴:
>   - {YYYY-MM-DD}: {変更概要}
```

### Traceability

- `architect` records which version of SPEC.md was used as the basis for design at the top of `ARCHITECTURE.md`
- `developer` records which version of ARCHITECTURE.md was used as the basis for implementation in `TASK.md`
- Each flow orchestrator records the artifact version from the previous domain in the handoff file

### TASK.md Format

State file used by `developer` to persist implementation progress across sessions.
Generated at implementation start and updated upon each task completion.

```markdown
# TASK.md

> 参照元: ARCHITECTURE.md ({バージョン or 最終更新日})

## フェーズ: {フェーズ名}
最終更新: {日時}
ステータス: 進行中

## タスク一覧

### Phase {N}
- [ ] TASK-001: {タスク名} | 対象ファイル: src/...
- [ ] TASK-002: {タスク名} | 対象ファイル: src/...

## 直近のコミット
（タスク完了のたびに git log --oneline -3 を記録する）

## 中断時のメモ
（セッション中断時に状況をここに記録する）
```

---

## File Operation Principles

- Always `Read` the contents of an existing file before overwriting it
- Do not delete files (unless the user explicitly instructs it)
- Do not create directories not listed in design documents (SPEC.md / ARCHITECTURE.md)

---

## User Questions

When there are unclear points, **stop work and ask**. Prioritize confirmation over guessing.

### AskUserQuestion Tool (Recommended)

For questions where choices can be presented, always use the `AskUserQuestion` tool.
Users can select options with arrow keys, making it more efficient than text input.

```json
{
  "questions": [{
    "question": "{具体的な質問文}？",
    "header": "{短いラベル}",
    "options": [
      {"label": "{選択肢1}", "description": "{補足説明}"},
      {"label": "{選択肢2}", "description": "{補足説明}"}
    ],
    "multiSelect": false
  }]
}
```

**Usage Guidelines:**

| Situation | Tool to Use |
|-----------|------------|
| Questions with 2-4 choices | `AskUserQuestion` |
| Multiple independent questions bundled together (max 4) | `AskUserQuestion` (multiple questions) |
| Questions requiring multiple selections | `AskUserQuestion` (`multiSelect: true`) |
| Code/mockup comparisons needed | `AskUserQuestion` (`preview` field) |
| Free-text only questions with no presentable choices | Text output |

**Notes:**
- Each question should have 2-4 options (users can always use "Other" for free-text input)
- Place recommended options first with `(推奨)` suffix
- Up to 4 questions per call. Bundle related questions together

### Text Output Fallback

Use text output only for free-text questions where choices cannot be presented:
```
⏸ 確認事項があります

{質問内容を箇条書きで記載}

回答をいただいてから作業を再開します。
```

---

## Build Verification Commands by Tech Stack

### Syntax Check + Lint/Format Gate

Developer runs syntax checks plus lint/format upon task completion.
Lint errors **must be fixed before testing**.

| Language/FW | Syntax Check | Lint/Format | Test Execution |
|-------------|-------------|-------------|---------------|
| Python | `python -m py_compile {file}` | `uv run ruff check . && uv run ruff format --check .` | `uv run pytest` or `pytest` |
| TypeScript | `npx tsc --noEmit` | `npx eslint . && npx prettier --check .` | `npm test` or `npx vitest` |
| Go | `go build ./...` | `go vet ./... && gofmt -l .` | `go test ./...` |
| Rust | `cargo check` | `cargo clippy && cargo fmt --check` | `cargo test` |
| Node.js (JS) | `node --check {file}` | `npx eslint .` | `npm test` |

If lint/format tools are not installed, run syntax checks only and note this in the report.

### E2E / GUI Test Execution Commands

| Project Type | Tool | Install | Execute |
|-------------|------|---------|---------|
| Web (Python) | Playwright | `uv add pytest-playwright && playwright install` | `uv run pytest tests/e2e/` |
| Web (TypeScript) | Playwright | `npm i -D @playwright/test && npx playwright install` | `npx playwright test` |
| Desktop (Windows) | pywinauto | `uv add pywinauto` | `uv run pytest tests/gui/` |
| Desktop (cross-platform) | pyautogui | `uv add pyautogui Pillow` | `uv run pytest tests/gui/` |
| Desktop (Electron) | Playwright | Same as Web | `uv run pytest tests/e2e/` |

E2E tests are designed by `e2e-test-designer` and executed by `tester`. They run only when `HAS_UI: true`.

---

## security-auditor Mandatory Execution Rule

`security-auditor` **must run on all Delivery plans (including Minimal)**.

Verification items:
1. OWASP Top 10 verification
2. Dependency vulnerability scanning
3. Authentication/authorization implementation gap detection
4. Hardcoded secrets detection
5. Input validation verification
6. CWE checklist

---

## Library Usage Policy

Before implementing from scratch, search for existing libraries that can solve the problem concisely.
However, follow these guidelines to ensure security and maintainability.

### Core Principles

1. **Prefer standard libraries** — Use the language's standard library when it can accomplish the task
2. **Avoid reinventing the wheel** — Do not build custom solutions in areas where established libraries exist (encryption, auth, date handling, validation, etc.)
3. **Minimize dependencies** — Do not introduce libraries with large dependency trees for small features

### Adoption Criteria

When adopting a library, verify:

- **Actively maintained** — Recent releases exist; issues/PRs are being addressed
- **Widely adopted** — Community track record (download counts, GitHub stars, etc.)
- **No known vulnerabilities** — No unpatched CVEs or security advisories
- **License compatible** — MIT / Apache-2.0 / BSD etc., no conflict with project license
- **Reasonable dependency depth** — Transitive dependencies are not excessive

If any of the above are uncertain, confirm with the user before adoption.

### Responsibility Distribution

| Agent | Role |
|-------|------|
| **architect** | List major libraries in ARCHITECTURE.md. Perform library selection during tech stack selection and record adoption rationale |
| **developer** | Follow ARCHITECTURE.md library list. Search for libraries only when needed functionality is not in the list. Verify adoption criteria before use. Record added libraries in TASK.md |
| **security-auditor** | Final verification via dependency vulnerability scanning (pip-audit / npm audit, etc.) |

### Vulnerability Scanning Commands

| Language | Command |
|----------|---------|
| Python | `pip-audit` or `uv run pip-audit` |
| Node.js | `npm audit` |
| Go | `govulncheck ./...` |
| Rust | `cargo audit` |

---

## Non-Python Project Support

Each agent includes Python (FastAPI) based default examples, but these are **defaults, not requirements**.

- Always prioritize the tech stack determined in SPEC.md
- Substitute Python-specific references with equivalent tools for the target tech stack
- If in doubt, confirm with the user
