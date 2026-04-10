# Telescope Agents

A collection of custom agent definitions for Claude Code.
Divides the entire project lifecycle into **Discovery (requirements) → Delivery (design & implementation) → Operations (deploy & ops)**, automated by 26 specialized agents.

**[日本語版 README はこちら](README.ja.md)**

```
Discovery Flow ──[DISCOVERY_RESULT.md]──▶ Delivery Flow ──[DELIVERY_RESULT.md]──▶ Operations Flow
 (requirements)                         (design & impl)                        (deploy & ops)
 6 agents                               12 agents                              4 agents
```

User approval is required at each phase completion before proceeding. Non-`service` types (`tool` / `library` / `cli`) skip Operations.

---

## Quick Start

**Prerequisites:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed

```bash
# 1. Copy .claude/ directory to your project
cp -r .claude /path/to/your-project/

# 2. Launch Claude Code in your project directory
cd /path/to/your-project && claude

# 3. Start with a slash command
/discovery-flow I want to build a TODO app
```

The flow orchestrator auto-detects project scale and launches only the agents needed.

---

## Usage Scenarios

### New Project (Full Flow)

End-to-end from requirements exploration to design, implementation, and deployment.

```
/discovery-flow I want to build a blog management system
(after Discovery completes)
/delivery-flow
(after Delivery completes, for services)
/operations-flow
```

### Quick Build (Delivery Only)

When requirements are already clear and you just want design + implementation.

```
/pm I want to build a TODO app
```

### Existing Project (with SPEC / ARCHITECTURE)

Organize bug fixes, feature additions, or refactoring as issues, then proceed to design & implementation.

```
/analyst There's a 500 error on login
(after analysis completes)
/delivery-flow
```

### Existing Project (without SPEC / ARCHITECTURE)

Reverse-engineer spec and architecture docs from existing code first.

```
/codebase-analyzer Analyze this project's spec and design
(after analysis completes)
/analyst I want to add a login feature
/delivery-flow
```

### Command Reference

| Command | Purpose |
|---------|---------|
| `/discovery-flow` | Start requirements exploration flow |
| `/pm` `/delivery-flow` | Start design & implementation flow |
| `/operations-flow` | Start deploy & operations flow |
| `/analyst` | Analyze issues for existing projects |
| `/codebase-analyzer` | Analyze existing projects without specs |

---

## Architecture

### Three-Domain Model

Each domain runs in an independent session, handing off via `.md` files (no automatic chaining).

**Discovery** (requirements) — interviewer → researcher → poc-engineer → concept-validator → rules-designer → scope-planner

**Delivery** (design & impl) — spec-designer → ux-designer → architect → scaffolder → developer → test-designer → tester → security-auditor → reviewer → doc-writer → releaser

**Operations** (deploy & ops) — infra-builder → db-ops → observability → ops-planner

**Standalone** — analyst (issue analysis), codebase-analyzer (existing code analysis)

### Triage System

At flow start, project scale is assessed and agents are selected from 4 tiers automatically.

| Plan | Discovery | Delivery | Operations |
|--------|-----------|----------|------------|
| **Minimal** | interviewer only | minimal (5 agents) | — |
| **Light** | + rules-designer, scope-planner | + reviewer, test-designer | infra + ops-planner |
| **Standard** | + researcher, poc-engineer | + scaffolder, doc-writer | + db-ops |
| **Full** | + concept-validator | + releaser | + observability |

`security-auditor` runs on all plans. `ux-designer` runs only for projects with UI.

---

## Key Features

- **3-domain separation** — Discovery / Delivery / Operations run in independent sessions to prevent context bloat
- **Triage adaptation** — Auto-selects Minimal–Full based on project scale
- **Approval gates** — User approval required at each phase completion
- **Security mandatory** — security-auditor runs on all plans (OWASP Top 10 + dependency vulnerability scanning)
- **Session resume** — TASK.md state management enables mid-task resume
- **Auto rollback** — Root cause analysis and rollback on test failures / review findings (up to 3 times)
- **Multi-language** — Supports Python / TypeScript / Go / Rust
- **Document-driven** — Domains connected via `.md` handoff files for traceability

---

## File Structure

```
.claude/
├── CLAUDE.md              # Common rules for all agents
├── agents/*.md            # Agent definitions (26 files)
└── commands/*.md          # Slash command definitions
```

See [.claude/CLAUDE.md](.claude/CLAUDE.md) for details on agent definitions.

---

## CI/CD

Telescope is a development-time workflow, not a CI/CD runtime. `infra-builder` generates pipeline definitions for GitHub Actions, etc.

## License

MIT
