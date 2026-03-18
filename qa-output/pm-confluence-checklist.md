# QA Checklist — TaskFlow Pro

**Date:** 2026-03-18 | **Branch:** `cursor/full-qa-run-602f`
**Findings:** 34 unique (P0: 4, P1: 7, P2: 14, P3: 9) — deduplicated from 44 raw

---

## Frontend

### Task List & Kanban

- [ ] **P0** — Null-priority crash: list view throws TypeError on `task.priority.charAt()` when a task has NULL priority/status `(FE-01, E2E-01)`
- [ ] **P1** — Sidebar + main content grid has no responsive breakpoints; unusable below 768 px `(FE-03)`
- [ ] **P1** — Kanban board columns forced into 3-col grid on mobile `(FE-04)`
- [ ] **P1** — Quick-stats row uses fixed `grid-cols-4`; should match user-stats responsive grid `(FE-05)`
- [ ] **P1** — Stats bar always shows global totals, ignores active filters/search `(E2E-03)`
- [ ] **P2** — Filter links built via string concatenation produce malformed URLs (missing `?`) `(FE-10)`
- [ ] **P2** — View-mode toggle (List/Board) drops the active search query `(FE-11)`
- [ ] **P2** — Focus Mode button shown on completed tasks (should be hidden) `(E2E-06)`
- [ ] **P3** — Hover-only quick actions invisible on touch devices `(FE-19)`

### Task Detail / Edit Modal

- [ ] **P0** — Delete button non-functional: hidden `intent=update` field shadows the delete button's value `(API-03, FE-06)`
- [ ] **P1** — No confirmation dialog before deleting a task `(E2E-02)`
- [ ] **P2** — Modal inner grid not responsive; two columns unusable on mobile `(FE-14)`
- [ ] **P2** — Emoji picker uses direct DOM manipulation instead of React state `(FE-13)`
- [ ] **P2** — No Escape-key or backdrop-click to dismiss modals `(FE-15, FE-16)`
- [ ] **P2** — Modals missing `role="dialog"`, `aria-modal`, `aria-labelledby` `(FE-17)`
- [ ] **P3** — Emoji picker hover/selected states lack dark-mode variants `(FE-22, FE-23)`

### Create Task Modal

- [ ] **P3** — Quick-template grid not responsive `(FE-24)`

### Focus Mode & Pomodoro Timer

- [ ] **P2** — Focus pop-out window hardcodes a CSS path that 404s in Vite builds `(FE-12)`
- [ ] **P2** — PomodoroTimer heading invisible in dark mode (hardcoded light text color) `(FE-07)`
- [ ] **P3** — FocusMode panel uses mouse-only drag; not keyboard-accessible `(FE-21)`
- [ ] **P3** — Emoji picker not keyboard-navigable `(E2E-07)`

### Dark Mode & Theming

- [ ] **P2** — Badge CSS classes (status + priority) have no dark-mode variants `(FE-08)`
- [ ] **P2** — `btn-secondary` has no dark-mode variants `(FE-09)`
- [ ] **P2** — ErrorBoundary page renders in light-mode only `(FE-18)`

### Accessibility

- [ ] **P3** — Icon-only buttons (x, pop-out, reset) lack `aria-label` `(FE-20)`
- [ ] **P3** — `badge-low` color contrast may fail WCAG AA 4.5:1 `(FE-25)`

### Security (Frontend)

- [ ] **P0** — ErrorBoundary exposes full `error.stack` (server paths, framework internals) to end users `(FE-02)`

---

## Backend

### Gamification — XP & Streaks

- [ ] **P0** — Streak inflates on every page load: `updateStreak()` runs inside `getUserStats()` and never updates `lastActiveDate` `(API-01)`
- [ ] **P0** — XP farming exploit: toggling a task todo → done repeatedly awards unlimited XP `(API-02)`
- [ ] **P2** — Double streak increment during a single task-completion flow (`getUserStats` called twice) `(API-08)`

### Task API (`/api/task-status`, route actions)

- [ ] **P1** — Invalid `status` value returns 500 + SQLite stack trace instead of 400 validation error `(API-04)`
- [ ] **P1** — Invalid `priority` value returns 500 + stack trace instead of 400 `(API-05)`
- [ ] **P2** — No max-length validation on title/description (10 000+ chars accepted) `(API-10)`
- [ ] **P3** — Update/delete on non-existent task ID silently returns 302 instead of 404 `(API-11)`

### Pomodoro API (`/api/pomodoro`)

- [ ] **P1** — Negative minutes accepted; corrupts task + global stats `(API-06)`
- [ ] **P1** — Pomodoro on non-existent taskId silently succeeds; inflates global minutes `(API-07)`

### Data Integrity

- [ ] **P2** — Schema allows NULL for `status` and `priority` columns (CHECK constraint does not reject NULL) `(E2E-05)`
- [ ] **P2** — Missing `favicon.ico` causes console 404 on every page load `(E2E-04)`

### Security (Backend)

- [ ] **P2** — GET requests to API routes and empty POSTs leak full stack traces `(API-09, API-12)`

---

## Videos & Evidence

| Asset | Description |
|-------|-------------|
| `e2e_create_complete_task_and_xp_flow.mp4` | Create task, complete with confetti + XP, board view, dark mode |
| `e2e_crash_null_priority_status.mp4` | P0 crash reproduction (null priority TypeError) |
