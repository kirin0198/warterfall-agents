---
template_version: 1.0
doc_type: user-manual
language: en
---
# User Manual: {{project.name}}

<!-- template_version: 1.0 -->
<!-- generated_at: {{doc.generated_at}} -->

> **Document Type:** End-User Manual
> **Project:** {{project.name}} (`{{project.slug}}`)
> **Language:** {{doc.lang}}
> **Generated:** {{doc.generated_at}}

> _Note: This manual is structured by use case. Each chapter covers one
> primary use case as defined in SPEC.md._

---

## Introduction

### Who This Manual Is For

This manual is for end users of **{{project.name}}**. It provides step-by-step
instructions for all major tasks you can perform in the system.

### How to Use This Manual

- Each chapter covers one **use case** (a specific goal you want to achieve)
- Within each chapter, operations are described **step by step**
- Screenshots and screen references are included where available

### Prerequisites

> _List the prerequisites end users need before using the system:_
> _(e.g., account creation, browser requirements, permissions)_

---

## Getting Started

### 1. Accessing the System

> _How to access and log in to the system._

[Insert screenshot here]

### 2. Navigation Overview

> _Brief orientation to the main screen areas / menus._

{{ui_spec.screens}}

[Insert screenshot here]

---

## Use Cases

{{spec.use_cases}}

> _The following chapters are generated from SPEC.md use cases._
> _Each UC-xxx maps to one chapter below._

---

## Chapter 1: [UC-001 Title]

> _Replace this section with the actual UC-001 content._

### Overview

**Goal:** _What the user wants to achieve_
**Who:** _Which user role performs this task_
**When:** _Typical scenario when this use case is triggered_

### Step-by-Step Instructions

1. Navigate to **[Screen Name]**

   [Insert screenshot here]

2. _Describe the action_

   [Insert screenshot here]

3. _Continue steps as needed_

### Expected Result

> _Describe the expected outcome when the task is completed successfully._

### Troubleshooting

| Problem | Cause | Solution |
|---------|-------|---------|
| | | |

---

## Chapter 2: [UC-002 Title]

> _Repeat the Chapter 1 structure for each additional use case._

---

## Frequently Asked Questions

> _Common questions from end users, derived from SPEC.md non-functional
> requirements or common UI patterns._

**Q: How do I reset my password?**
> _Answer here._

**Q: What should I do if I encounter an error?**
> _Answer here. Reference §Troubleshooting or contact support._

---

## Glossary

| Term | Definition |
|------|-----------|
| _List key terms used in this system_ | |

---

## Support

> _Contact information for user support._

| Channel | Contact | Hours |
|---------|---------|-------|
| Help Desk | | |
| Email | | |
| Documentation | | |

---

## Appendix: Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| API Reference | `docs/deliverables/{{project.slug}}/api-reference.{{doc.lang}}.md` | For developer users |
| SPEC.md | `SPEC.md` | System specification |
