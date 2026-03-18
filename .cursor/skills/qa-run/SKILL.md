---
name: qa-run
description: Orchestrate a full QA run: spawn parallel subagents for Frontend, Backend, and E2E QA, then merge results into report, fix list, Jira tickets, Confluence checklist, and Slack summary. Use when the user says /qa, /qa-full, "run QA", "full QA", or "QA this project".
---

# QA Run — Orchestrator

Run a full QA pass by executing Frontend, Backend, and E2E QA in parallel, then merging and delivering all artifacts.

## Input (from user)

Gather or prompt for:

- **Repo:** path or URL + branch (required).
- **Links (optional):** Storybook URL, staging/app URL, API base URL.
- **Exclusions (optional):** paths or areas to skip.
- **Deliverables:** Report + fix list (always). Jira tickets (via MCP if configured). Confluence page (via MCP if configured). Slack summary (if Slack MCP configured). Videos (when E2E runs with recording).

## Phase 1 — Parallel QA (subagents)

Spawn **three parallel subagents** (or parallel tasks), each with the same repo and options:

1. **Frontend QA** — Invoke the qa-frontend skill (Storybook, visual, responsive). Pass: repo, Storybook URL, app URL, exclusions. Output: list of findings with IDs like FE-xx.

2. **Backend QA** — Invoke the qa-backend skill (contracts, errors, basic security). Pass: repo, API base URL, exclusions. Output: list of findings with IDs like API-xx.

3. **E2E QA** — Invoke the qa-e2e skill (critical flows, browser recording). Pass: app URL, list of critical flows or "infer from repo", exclusions. Output: list of findings + video file paths.

Wait for all three to complete. If a subagent cannot run (e.g. no Storybook URL), it returns an empty or partial list and a note; do not block the rest.

## Phase 2 — Merge and deliver

Invoke the **qa-merge-report** skill with:

- All findings from Frontend, Backend, E2E.
- Video paths from E2E (and any from Frontend if applicable).
- Project name (from repo or user).
- Run id (e.g. branch name or date).
- Targets: Jira project/key, Confluence space/parent, Slack channel (from user or config).

The merger produces:

- QA report (markdown file).
- Fix list (markdown table).
- Jira tickets (if MCP and user requested).
- Confluence QA checklist page (if MCP and user requested).
- Slack summary post (if MCP configured).
- List of video artifacts.

## Phase 3 — Confirm to user

Summarise what was done:

- "QA run complete. Report: [path]. Fix list: [path]. Jira: [N tickets created or 'copy from fix list']. Confluence: [link or 'markdown ready']. Videos: [paths]. Slack: [channel] updated."

If something failed (e.g. MCP create), say so and point to the markdown artifacts for manual steps.

## Commands (how users can trigger)

- **Full QA:** `/qa` or `/qa-full` — run all three areas + merge + all deliverables.
- **Targeted:** `/qa-frontend`, `/qa-backend`, `/qa-e2e` — run only that area, then still run the merger with only those findings (no need for parallel subagents).
- **Report only:** `/qa-report-only` — if findings already exist, run only the merger to regenerate report/fix list/Confluence/Jira/Slack.

## Notes

- Use the QA report format rule for any finding or artifact you write.
- Subagents are "parallel" by instructing the agent to run the three skills concurrently (e.g. "Run qa-frontend, qa-backend, and qa-e2e in parallel; collect all findings; then run qa-merge-report").
- If the environment cannot run Playwright or record video, E2E still runs and reports findings; evidence will be "manual recording suggested."
