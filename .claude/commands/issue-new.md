Create a new planning document in `docs/design-notes/` and a matching GitHub Issue atomically.

## Behaviour

### Step 1 — Collect inputs via AskUserQuestion

Gather the four required fields in a single multi-question call:

```json
{
  "questions": [
    {
      "question": "What is the title of the new issue?",
      "header": "Title",
      "options": []
    },
    {
      "question": "What category best describes this change?",
      "header": "Category",
      "options": [
        {"label": "feat", "description": "New feature or capability"},
        {"label": "fix", "description": "Bug fix"},
        {"label": "chore", "description": "Tooling, config, maintenance"},
        {"label": "docs", "description": "Documentation only"},
        {"label": "refactor", "description": "Code refactoring without feature change"},
        {"label": "ci", "description": "CI/CD pipeline changes"},
        {"label": "ops", "description": "Infrastructure / operations"}
      ],
      "multiSelect": false
    },
    {
      "question": "Write a 1–3 sentence summary (used as both the GitHub issue body and the planning-doc Section 1 stub).",
      "header": "Summary"
    },
    {
      "question": "Enter a kebab-case slug for the planning doc filename (docs/design-notes/<slug>.md). Pre-fill from the slugified title; you can override here.",
      "header": "Slug"
    }
  ]
}
```

### Step 2 — Slug collision check

Before doing anything else, verify the target file does not already exist:

```bash
test -e docs/design-notes/<slug>.md
```

If the file exists, **abort immediately** with the following message and do not create a GitHub issue:

```
Error: docs/design-notes/<slug>.md already exists.
Please choose a more specific slug, or extend the existing document directly.
No GitHub issue was created.
```

Rationale: overwriting risks silent loss of an existing design note; auto-suffixing
(`<slug>-2.md`) creates near-duplicate filenames that fragment context. Aborting
forces the user to make the correct decision.

### Step 3 — Check gh auth status

```bash
gh auth status
```

If this command fails, set a flag `GH_AVAILABLE=false` and continue. The planning doc
will be created with `> GitHub Issue: skipped (no gh auth)` instead of the real link.
No error is surfaced — the user gets a local design note they can wire up to a GitHub
issue later.

### Step 4 — Create the planning doc skeleton

Write the file at `docs/design-notes/<slug>.md` using the template below.
Substitute placeholders as instructed:

- `<Title>` — the title from Step 1
- `<short-sha>` — output of `git rev-parse --short HEAD`
- `<YYYY-MM-DD>` — today's date (`date +%Y-%m-%d`)
- `<summary>` — the summary from Step 1

```markdown
# <Title>

> Reference: current `main` (HEAD `<short-sha>`, <YYYY-MM-DD>)
> Created: <YYYY-MM-DD>
> Author: analyst (design-only phase — no implementation yet)
> Scope: design / planning document; the change will be executed in a follow-up `developer` phase
> GitHub Issue: TBD

---

## 1. Background & Motivation

<summary>

---

## 2. Proposed approach

TBD — to be filled in by analyst or developer when picked up.

---

## 3. Out of scope

TBD.
```

### Step 5 — Create the GitHub issue (if GH_AVAILABLE)

Display the resolved invocation to the user before running it so they can abort
if the title or summary looks wrong:

```
About to run:
  gh issue create --title "<category>: <title>" --body "<summary>"

Press Ctrl-C to abort, or wait 3 seconds to continue.
```

Then run:

```bash
gh issue create \
  --title "<category>: <title>" \
  --body "<summary>"
```

Capture the output to extract the issue number `N` and the full issue URL.

### Step 6 — Wire the issue number into the planning doc

Replace the `TBD` placeholder in the doc header:

```
> GitHub Issue: TBD
```

with:

```
> GitHub Issue: [#N](https://github.com/<owner>/<repo>/issues/N)
```

Where `<owner>/<repo>` is obtained from `gh repo view --json nameWithOwner -q .nameWithOwner`.

If `GH_AVAILABLE=false`, replace with:

```
> GitHub Issue: skipped (no gh auth)
```

### Step 7 — Report to the user

Output a summary:

```
Planning doc created: docs/design-notes/<slug>.md
GitHub issue:         <issue URL>   (or "skipped — no gh auth")
```

---

## Permission note

`gh issue create` is an `external_net` (recommended) category command under
`sandbox-policy.md`. Because the user explicitly invoked `/issue-new`, sandbox-runner
delegation is not required. The resolved `gh` invocation is shown to the user in
Step 5 before execution so they can abort if needed.

---

## Error handling

| Condition | Action |
|-----------|--------|
| Slug collision (`docs/design-notes/<slug>.md` exists) | Abort before creating GitHub issue; tell user to choose a different slug |
| `gh` not installed / not authenticated | Skip GitHub issue creation; write `skipped (no gh auth)` in doc header |
| `gh issue create` fails after display | Surface the error; the planning doc already written can be kept or deleted by the user |
