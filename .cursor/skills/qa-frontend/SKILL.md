---
name: qa-frontend
description: Run Frontend/UI QA: Storybook coverage and visual checks, responsive behaviour, component consistency. Use when the user runs a full QA, /qa-frontend, or asks for frontend-only QA. Output structured findings in the QA report format.
---

# QA — Frontend / UI

Run frontend-focused QA and output findings in the shared QA report format (severity, steps, suggestion, evidence).

## Input (from user or orchestrator)

- **Repo path** (and optional branch).
- **Storybook URL** or path (e.g. local `npm run storybook` or deployed URL).
- **Staging or app URL** (if available) for full-page checks.
- **Exclusions** (paths to skip).

## Steps

1. **Identify frontend surface**
   - List React/UI entry points (e.g. `src/`, theme folder).
   - Locate Storybook config and stories (e.g. `*.stories.tsx`).

2. **Storybook**
   - If Storybook is available (URL or run locally): list all story IDs; note components without stories.
   - Open a sample of stories; check for layout breaks, missing props, console errors.
   - Output findings with IDs like `FE-01`, `FE-02`, using the QA report format (title, severity, steps, suggestion, evidence).

3. **Visual / responsive**
   - If staging or app URL is given: check key pages at 320px, 768px, 1280px (or project breakpoints).
   - Note overflow, broken layout, touch targets, text truncation.
   - Add findings in the same format.

4. **Component consistency**
   - Scan for repeated patterns (buttons, forms, cards); note deviations or missing variants.
   - Optional: compare to design tokens or theme (if documented).

5. **Output**
   - Emit a structured list of findings (ID, title, area=Frontend, severity, steps, expected/actual, suggestion, evidence).
   - If you captured screenshots or recordings, reference them in evidence (path or link).
   - Do not merge with backend/E2E findings; the orchestrator or report-merger skill will combine them.

## Notes

- Use the QA report format rule for every finding.
- Prefer P1/P2 for user-visible issues; P3 for polish.
- If Storybook or URLs are missing, say so in the output and skip those steps.
