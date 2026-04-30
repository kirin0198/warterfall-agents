---
template_version: 1.0
doc_type: api-reference
language: en
---
# API Reference: {{project.name}}

<!-- template_version: 1.0 -->
<!-- generated_at: {{doc.generated_at}} -->

> **Document Type:** API Reference
> **Project:** {{project.name}} (`{{project.slug}}`)
> **Language:** {{doc.lang}}
> **Generated:** {{doc.generated_at}}

---

## 1. Authentication

> _Describe how clients authenticate with the API._
> _Source: ARCHITECTURE.md §5 API Design and SPEC.md security requirements._

### 1.1 Authentication Method

| Method | Description | Where to Set |
|--------|-------------|--------------|
| _derived from ARCHITECTURE.md_ | | |

### 1.2 Obtaining Credentials

> _Step-by-step instructions for obtaining API keys / tokens._

```bash
# Example: obtain access token
# POST /auth/token
# Content-Type: application/json
# {"client_id": "...", "client_secret": "..."}
```

### 1.3 Using Credentials in Requests

```http
# Authorization header example
Authorization: Bearer <access_token>
```

---

## 2. Common Specifications

### 2.1 Base URL

| Environment | Base URL |
|-------------|---------|
| Production | `https://api.{{project.slug}}.example.com/v1` |
| Staging | `https://staging-api.{{project.slug}}.example.com/v1` |

### 2.2 Request Format

- Content-Type: `application/json`
- Character encoding: UTF-8
- Date/time format: ISO 8601 (`2026-04-30T12:00:00Z`)

### 2.3 Response Format

```json
{
  "data": { },
  "meta": {
    "request_id": "...",
    "timestamp": "2026-04-30T12:00:00Z"
  }
}
```

### 2.4 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": []
  }
}
```

### 2.5 Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `VALIDATION_ERROR` | Request parameter validation failed |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server-side error |

---

## 3. Endpoints

{{spec.use_cases}}

> _Document each API endpoint in a sub-section. Derived from ARCHITECTURE.md
> §5 API Design, SPEC.md use cases, and src/** endpoint scan._
> _If openapi.yaml / openapi.json is present, treat it as the authoritative source._

### 3.x `{METHOD} {path}`

> _Repeat this section for each endpoint._

**Description:** _Brief description of what this endpoint does._

**Use Case:** _Reference to SPEC.md use case (e.g., UC-001)._

**Request**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| | | | |

**Request Body** (when applicable)

```json
{
  // Example request body
}
```

**Response** (200 OK)

```json
{
  // Example success response
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | |
| 404 | `NOT_FOUND` | |

---

## 4. Code Samples

> _Provide ready-to-run code samples in common languages._

### 4.1 cURL

```bash
# Example request
curl -X GET \
  "https://api.{{project.slug}}.example.com/v1/resource" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### 4.2 Python

```python
import requests

response = requests.get(
    "https://api.{{project.slug}}.example.com/v1/resource",
    headers={"Authorization": "Bearer <token>"}
)
print(response.json())
```

### 4.3 JavaScript / TypeScript

```typescript
const response = await fetch(
  "https://api.{{project.slug}}.example.com/v1/resource",
  {
    headers: {
      Authorization: "Bearer <token>",
      "Content-Type": "application/json",
    },
  }
);
const data = await response.json();
```

---

## 5. Rate Limits

| Plan | Requests per Minute | Requests per Day | Notes |
|------|--------------------|--------------------|-------|
| _derived from ARCHITECTURE.md or SPEC.md_ | | | |

### 5.1 Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when window resets |

### 5.2 Handling Rate Limits

> _Recommended backoff strategy when `429 Too Many Requests` is received._

---

## 6. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | {{doc.generated_at}} | Initial release |

---

## Appendix A: SDK and Client Libraries

> _List official or community SDK options for consuming this API._

---

## Appendix B: Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| HLD | `docs/deliverables/{{project.slug}}/hld.{{doc.lang}}.md` | System Architecture |
| LLD | `docs/deliverables/{{project.slug}}/lld.{{doc.lang}}.md` | Detailed Design |
| ARCHITECTURE.md | `ARCHITECTURE.md` | Source architecture document |
