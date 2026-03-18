---
name: qa-backend
description: Run Backend/API QA: contracts (request/response), error handling, basic security. Use when the user runs a full QA, /qa-backend, or asks for backend-only QA. Output structured findings in the QA report format.
---

# QA — Backend / API

Run backend/API-focused QA and output findings in the shared QA report format (severity, steps, suggestion, evidence).

## Input (from user or orchestrator)

- **Repo path** (and optional branch).
- **API base URL** or OpenAPI/Swagger URL (if available).
- **Exclusions** (paths to skip, e.g. legacy or generated code).

## Steps

1. **Identify API surface**
   - Find API definitions (OpenAPI, Symfony routes, Drupal endpoints, or inline docs).
   - List main endpoints (auth, CRUD, critical flows).

2. **Contracts**
   - For each critical endpoint: check request shape (body, query, headers) and response shape (status, body, errors).
   - Compare to client usage (frontend or SDK): mismatches = findings (wrong type, missing field, wrong status).
   - Output findings with IDs like `API-01`, `API-02`; use QA report format.

3. **Error handling**
   - Trigger error cases (invalid input, 401, 404, 500) where possible (e.g. curl or script).
   - Check: consistent error body shape, appropriate status codes, no stack traces or secrets in response.
   - Add findings (title, severity, steps, suggestion).

4. **Basic security**
   - Note: auth on protected routes, no sensitive data in URLs or logs, CORS/headers if relevant.
   - Flag obvious issues (e.g. password in query param, missing auth on admin endpoint); do not run full pentest.

5. **Output**
   - Emit a structured list of findings (ID, title, area=Backend or API, severity, steps, expected/actual, suggestion).
   - Do not merge with frontend/E2E findings; the orchestrator or report-merger will combine them.

## Notes

- Use the QA report format rule for every finding.
- If no API spec or base URL is given, say so and skip contract/error steps or infer from code only.
