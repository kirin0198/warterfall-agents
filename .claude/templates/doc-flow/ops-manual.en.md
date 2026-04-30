---
template_version: 1.0
doc_type: ops-manual
language: en
---
# Operations Manual: {{project.name}}

<!-- template_version: 1.0 -->
<!-- generated_at: {{doc.generated_at}} -->

> **Document Type:** Operations Manual
> **Project:** {{project.name}} (`{{project.slug}}`)
> **Language:** {{doc.lang}}
> **Generated:** {{doc.generated_at}}

---

## 1. System Overview (Operations Perspective)

{{spec.summary}}

### 1.1 Operational Architecture

> _Describe the deployment topology: servers / containers / cloud regions._
> _Source: Dockerfile, docker-compose.yml, infra/**._

### 1.2 System Endpoints

| Endpoint | Protocol | Port | Purpose |
|----------|----------|------|---------|
| _derived from infra artifacts_ | | | |

### 1.3 Environment Inventory

| Environment | Purpose | URL / Host | Notes |
|-------------|---------|------------|-------|
| Production | Live traffic | | |
| Staging | Pre-release verification | | |
| Development | Internal testing | | |

---

## 2. Startup and Shutdown Procedures

> _Step-by-step instructions for controlled system startup and shutdown._

### 2.1 Startup Checklist

1. Verify infrastructure prerequisites (database, external services, secrets)
2. Pull latest container images or deploy new release
3. Run database migrations (if applicable)
4. Start services in dependency order
5. Confirm health checks pass on all components

```bash
# Example startup commands (replace with actual commands from infra artifacts)
# docker-compose up -d
# kubectl apply -f infra/k8s/
```

### 2.2 Shutdown Procedure

1. Announce planned maintenance window to users
2. Stop incoming traffic (update load balancer rules)
3. Wait for in-flight requests to complete
4. Shutdown services in reverse dependency order
5. Backup data if required
6. Record shutdown completion

### 2.3 Rollback Procedure

> _Steps to roll back to the previous known-good version._

---

## 3. Monitoring and Alerting

{{ops.runbook}}

### 3.1 Key Metrics

| Metric | Collection Method | Alert Threshold | Response |
|--------|------------------|-----------------|---------|
| _derived from OBSERVABILITY.md and OPS_PLAN.md_ | | | |

### 3.2 Dashboard

> _Reference monitoring dashboards (Grafana, CloudWatch, etc.)._
> _Source: OBSERVABILITY.md._

### 3.3 Alert Runbook

| Alert Name | Severity | Condition | First Response |
|-----------|----------|-----------|---------------|
| | | | |

---

## 4. Backup and Restore

### 4.1 Backup Schedule

| Data Type | Frequency | Retention | Storage Location |
|-----------|-----------|-----------|-----------------|
| Database | | | |
| File Storage | | | |
| Configuration | | | |

### 4.2 Restore Procedure

> _Step-by-step restore instructions from backup._

1. Identify backup target (date/version)
2. Verify backup integrity
3. Stop affected services
4. Restore from backup
5. Run integrity checks
6. Restart services and verify functionality

---

## 5. Incident Response

### 5.1 Severity Classification

| Severity | Definition | Response Time | Examples |
|----------|------------|--------------|---------|
| P1 (Critical) | Full system outage | 15 min | Database down, payment failure |
| P2 (High) | Major feature degraded | 1 hour | Login issues, data corruption risk |
| P3 (Medium) | Minor feature degraded | 4 hours | Non-critical API errors |
| P4 (Low) | Cosmetic / trivial | Next sprint | UI glitches, minor performance |

### 5.2 Incident Response Flow

1. **Detect** — Alert fires or user report received
2. **Acknowledge** — On-call engineer acknowledges within SLA
3. **Triage** — Assess severity, identify blast radius
4. **Contain** — Apply immediate mitigation
5. **Resolve** — Fix root cause
6. **Postmortem** — Root cause analysis and prevention plan

---

## 6. Maintenance Windows

### 6.1 Recurring Maintenance

| Task | Frequency | Duration | Impact |
|------|-----------|----------|--------|
| Security patching | Monthly | 30 min | Minimal (rolling restart) |
| Database vacuum | Weekly | 10 min | No downtime |
| Certificate renewal | Yearly | 5 min | No downtime (auto-renew) |

### 6.2 Change Management

> _Describe the change approval process for production modifications._

---

## 7. Contact and Escalation

### 7.1 On-Call Rotation

> _List the on-call schedule, rotation, and contact method._

### 7.2 Escalation Path

| Level | Role | Contact | SLA |
|-------|------|---------|-----|
| L1 | On-call Ops | | 15 min |
| L2 | Senior Engineer | | 1 hour |
| L3 | Architecture Owner | | 4 hours |

### 7.3 External Contacts

| System | Contact | Support Hours | Notes |
|--------|---------|--------------|-------|
| _List third-party dependencies and their support contacts_ | | | |

---

## Appendix A: Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| _derived from infra artifacts / docker-compose.yml_ | | | |

---

## Appendix B: Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| HLD | `docs/deliverables/{{project.slug}}/hld.{{doc.lang}}.md` | System Architecture |
| Handover | `docs/deliverables/{{project.slug}}/handover.{{doc.lang}}.md` | Handover Package |
| OPS_PLAN.md | `OPS_PLAN.md` | Source operations plan |
