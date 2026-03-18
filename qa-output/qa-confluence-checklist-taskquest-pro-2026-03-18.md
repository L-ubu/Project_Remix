# QA Checklist — TaskFlow Pro — 2026-03-18

> Confluence MCP not available. Copy-paste this body into a new Confluence page.

**QA Run:** TaskFlow Pro — 2026-03-18
**Branch:** cursor/full-qa-run-602f
**Scope:** Frontend, Backend/API, E2E
**Total findings:** 44 (P0: 6, P1: 10, P2: 18, P3: 10)

---

## P0 — Critical (6)

- [ ] **FE-01** Fix null-safe crash on task.priority in list view (P0) — Add null guard at `tasks.tsx:474`; add NOT NULL schema constraints
- [ ] **FE-02** Remove error.stack exposure from ErrorBoundary (P0) — Remove `<pre>{error.stack}</pre>` from `root.tsx:60-62`
- [ ] **API-01** Fix updateStreak side-effect inflating streak on every page load (P0) — Move `updateStreak()` out of `getUserStats()` read path; update `lastActiveDate`
- [ ] **API-02** Prevent XP farming exploit via task status toggle (P0) — Track first completion; only award XP once
- [ ] **API-03** Fix delete button shadowed by hidden intent=update field (P0) — Remove hidden `intent=update` input from form
- [ ] **E2E-01** Fix null-guard on task.priority/status in task list (P0) — Add null coalescing + NOT NULL DB constraints

## P1 — High (10)

- [ ] **FE-03** Add responsive breakpoints to sidebar/main grid (P1) — Use `col-span-12 md:col-span-3` / `col-span-12 md:col-span-9`
- [ ] **FE-04** Add responsive breakpoints to Kanban grid (P1) — Change `grid-cols-3` to `grid-cols-1 md:grid-cols-3`
- [ ] **FE-05** Add responsive breakpoints to quick stats grid (P1) — Change `grid-cols-4` to `grid-cols-2 md:grid-cols-4`
- [ ] **FE-06** Fix delete button intent conflict with hidden field (P1) — Remove hidden intent field; rely on button values
- [ ] **API-04** Validate status enum before DB write (P1) — Validate against `['todo', 'in-progress', 'done']` before DB call
- [ ] **API-05** Validate priority enum before DB write (P1) — Validate against `['low', 'medium', 'high']` before DB call
- [ ] **API-06** Validate pomodoro minutes are positive (P1) — Add `minutes > 0` validation
- [ ] **API-07** Check task existence before recording pomodoro (P1) — Call `getTask(taskId)` before `addPomodoroTime()`
- [ ] **E2E-02** Add confirmation dialog before deleting a task (P1) — Add `window.confirm()` or custom modal
- [ ] **E2E-03** Quick stats bar does not reflect active filters (P1) — Show filtered context or pass filters to `getTaskStats()`

## P2 — Medium (18)

- [ ] **FE-07** Fix PomodoroTimer heading dark mode text color (P2) — Add `dark:text-white` to heading
- [ ] **FE-08** Add dark mode variants to badge CSS classes (P2) — Add `dark:bg-*` / `dark:text-*` to all badge classes
- [ ] **FE-09** Add dark mode variants to btn-secondary (P2) — Add `dark:bg-gray-700 dark:text-gray-300`
- [ ] **FE-10** Fix malformed URLs in filter links (P2) — Use `URLSearchParams` instead of string concatenation
- [ ] **FE-11** Preserve search param in view mode toggle (P2) — Add search to view toggle URLs
- [ ] **FE-12** Fix focus window hardcoded CSS path for Vite (P2) — Use Remix `<Links />` component
- [ ] **FE-13** Replace DOM manipulation in emoji pickers (P2) — Use `useState` for emoji selection
- [ ] **FE-14** Add responsive grid to edit task modal (P2) — Change `grid-cols-2` to `grid-cols-1 lg:grid-cols-2`
- [ ] **FE-15** Add Escape key handler to close modals (P2) — Add `useEffect` with keydown listener
- [ ] **FE-16** Add backdrop click to close modals (P2) — Add `onClick` on backdrop div
- [ ] **FE-17** Add ARIA dialog attributes to modals (P2) — Add `role="dialog"`, `aria-modal`, `aria-labelledby`
- [ ] **FE-18** Add dark mode support to ErrorBoundary (P2) — Add dark mode variants to ErrorBoundary classes
- [ ] **API-08** Prevent double streak increment during completion (P2) — Remove `updateStreak` from `getUserStats()`
- [ ] **API-09** Add loader to API routes, suppress stack traces (P2) — Add `loader` returning 405; strip stack traces
- [ ] **API-10** Add max length validation for title/description (P2) — Limit title ≤ 255 chars, description ≤ 5000
- [ ] **E2E-04** Add missing favicon.ico (P2) — Add favicon to `public/` directory
- [ ] **E2E-05** Add NOT NULL DB constraints for status/priority (P2) — Add `NOT NULL` to column definitions
- [ ] **E2E-06** Hide Focus Mode for completed tasks (P2) — Add `task.status !== 'done'` guard

## P3 — Low (10)

- [ ] **FE-19** Make hover-only quick actions accessible on touch (P3) — Add `group-focus-within:opacity-100` or show on mobile
- [ ] **FE-20** Add aria-labels to icon-only buttons (P3) — Add `aria-label` to ×, ⧉, 🔄 buttons
- [ ] **FE-21** Make FocusMode panel keyboard accessible (P3) — Add keyboard events + `role="dialog"`
- [ ] **FE-22** Add dark mode hover to emoji picker buttons (P3) — Add `dark:hover:bg-gray-700`
- [ ] **FE-23** Add dark mode selected state to emoji picker (P3) — Add `dark:bg-purple-900/20`
- [ ] **FE-24** Add responsive breakpoints to template grid (P3) — Change `grid-cols-3` to `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- [ ] **FE-25** Check color contrast on badge-low (P3) — Change `text-gray-600` to `text-gray-700`
- [ ] **API-11** Return 404 for actions on non-existent tasks (P3) — Check `getTask(taskId)` at start of action
- [ ] **API-12** Handle missing Content-Type gracefully (P3) — Wrap `formData()` in try-catch
- [ ] **E2E-07** Emoji picker lacks keyboard accessibility (P3) — Add ARIA roles + keyboard handlers

---

## Videos / Demos

- `e2e_create_complete_task_and_xp_flow.mp4` — Full E2E: create task, complete with confetti + XP, board view, dark mode
- `e2e_crash_null_priority_status.mp4` — P0 crash reproduction: null status/priority TypeError

## Key Screenshots

- `crash_null_priority.png` — P0 crash
- `evidence_error_stack_exposure.png` — Stack trace exposed to users
- `evidence_kanban_mobile_320px.png` — Broken mobile layout
- `flow4_xp_after.png` — XP increased after task completion
- `flow7_dark_mode.png` — Dark mode view
