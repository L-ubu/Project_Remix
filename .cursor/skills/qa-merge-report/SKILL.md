---
name: qa-merge-report
description: Merge QA findings from frontend, backend, and E2E subagents into final report, fix list, Confluence body, and Jira tickets. Post Slack summary when done. Use after parallel QA subagents have finished.
---

# QA — Merge Report & Deliverables

Take structured findings from Frontend, Backend, and E2E QA (and any video paths), then produce final artifacts and push to Jira/Confluence/Slack.

## Input

- **Findings lists** from qa-frontend, qa-backend, qa-e2e (each with ID, title, area, severity, steps, suggestion, evidence).
- **Video paths or URLs** from E2E (and any frontend recordings).
- **Project name** and optional run id (e.g. branch, date).
- **Targets:** Jira project/key, Confluence space/page parent, Slack channel (for summary).

## Steps

1. **Merge and deduplicate**
   - Combine all findings; sort by severity (P0 first) then by area.
   - Re-number IDs if needed (e.g. F-01, B-02, E-03) or keep original IDs.
   - Ensure each finding has all fields required by the QA report format rule.

2. **QA Report (main artifact)**
   - Write the full report in markdown using the QA report format (summary counts, then each finding with steps, expected/actual, suggestion, evidence).
   - Add a "Videos / recordings" section with links or paths to all videos.
   - Save as e.g. `qa-report-[project]-[date].md` or write to a known output path.

3. **Fix list (table for PM / Jira)**
   - Build the table: ID | Title | Severity | Area | Suggested ticket summary.
   - Save as markdown (e.g. `qa-fix-list-[project]-[date].md`) so PM can copy.
   - If Jira MCP is configured and user requested ticket creation: **create one Jira issue per finding** using the suggested summary and description (steps, suggestion, link to video). Use the project key and labels agreed for QA.

4. **Confluence QA checklist**
   - Generate the checklist body in markdown (per QA report format: run info, then `- [ ] [ID] [Title] (Px) — [suggestion]`, then videos section).
   - If Confluence MCP is configured and user requested: **create a Confluence page** with this content under the given parent. Otherwise output markdown for PM to paste.

5. **Slack summary**
   - Post a short message to the configured channel, e.g.:
     - "QA run finished for [project]. Findings: N total (P0: x, P1: x, P2: x, P3: x). Report: [link or path]. Fix list and tickets created/ready for PM."
   - If Slack MCP is not available, skip or note "Slack summary skipped (no MCP)."

6. **Output summary**
   - List all artifacts produced: report path, fix list path, Confluence page link (if created), Jira ticket keys (if created), video paths, Slack message link or confirmation.

## Notes

- Use the QA report format rule for every output (report, fix list, Confluence body, Jira description).
- If MCP create fails (e.g. auth), still produce markdown and say "Create via MCP failed; use the markdown for manual copy."
