---
name: qa-e2e
description: Run E2E/flow QA: critical user journeys, browser automation, and record videos of issues. Use when the user runs a full QA, /qa-e2e, or asks for E2E QA. Output structured findings and attach or link video evidence.
---

# QA — E2E / Flows

Run end-to-end QA on critical user journeys, use browser automation, and **record the browser** to produce video evidence for findings.

## Input (from user or orchestrator)

- **App URL** (staging or local).
- **Critical flows** to cover (e.g. login, main booking flow, checkout) or infer from repo/docs.
- **Exclusions** (flows or paths to skip).

## Steps

1. **Define critical flows**
   - List 3–5 critical journeys (e.g. "Login as user", "Create reservation", "View dashboard").
   - For each: steps (click, fill, submit, expect).

2. **Run with browser automation**
   - Use Playwright (or available tool) in the Cloud Agent environment to open the app and run each flow.
   - **Record the browser** (video) for the full run or per flow; save to a known path (e.g. `qa-output/e2e-01-login.mp4`).

3. **Identify failures and issues**
   - On failure or unexpected behaviour: note steps, expected vs actual, and the **timestamp or segment** in the recording.
   - Create findings with IDs like `E2E-01`, `E2E-02` in the QA report format.
   - **Evidence:** link to the video file and, if possible, note "See 0:12–0:45 in e2e-01-login.mp4".

4. **Output**
   - Structured list of findings (ID, title, area=E2E, severity, steps, suggestion, evidence = video path/link).
   - List of video files produced (path or artifact URL) so the report merger can attach them to the report and Confluence.

## Notes

- Use the QA report format rule for every finding.
- If Playwright or recording is not available in the environment, say so and output findings without video; suggest manual recording.
- Prefer one video per flow or per failure to keep files manageable.
