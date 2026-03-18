# Jira Tickets — TaskFlow Pro QA — 2026-03-18

> Jira MCP not available. Copy-paste each block below into Jira as a new Bug issue.
> Labels: `qa`, `qa-2026-03`

---

## Ticket 1: FE-01 / E2E-01

**Summary:** [Bug] Fix null-safe crash on task.priority/status in list view

**Description:**
The `/tasks` list view crashes with `TypeError: Cannot read properties of null (reading 'charAt')` at `tasks.tsx:474` when any task has a null priority or status value.

**Steps to reproduce:**
1. Insert a task with NULL priority into the database (or trigger via corrupted data).
2. Navigate to `/tasks`.
3. Page crashes with ErrorBoundary.

**Expected:** Page renders gracefully with fallback for tasks with missing priority.
**Actual:** Entire layout crashes, blocking access to all task management features.

**Fix suggestion:**
- Add null guard: `(task.priority ?? 'medium').charAt(0).toUpperCase()` in `app/routes/tasks.tsx:474`.
- Add null guards on `task.status` at line 471.
- Add `NOT NULL` constraints to status and priority columns in `db.server.ts`.

**Priority:** Critical (P0)
**Labels:** qa, qa-2026-03, frontend

---

## Ticket 2: FE-02

**Summary:** [Bug] Remove error.stack exposure from ErrorBoundary

**Description:**
The ErrorBoundary in `app/root.tsx` displays the full error stack trace to end users, including server file paths, framework internals, and `node_modules` paths. This is a security and UX issue.

**Steps to reproduce:**
1. Trigger any unhandled error (e.g., FE-01).
2. Observe the ErrorBoundary page.

**Expected:** User-friendly error message without technical details.
**Actual:** Full stack trace displayed: `/workspace/app/routes/tasks.tsx:474:50`, etc.

**Fix suggestion:**
- Remove `<pre>{error.stack}</pre>` block at `app/root.tsx:60-62`.
- Log stack trace server-side only.

**Priority:** Critical (P0)
**Labels:** qa, qa-2026-03, security

---

## Ticket 3: API-01

**Summary:** [Bug] Fix updateStreak side-effect inflating streak on every page load

**Description:**
`getUserStats()` calls `updateStreak()` on every invocation, which happens on every page load. When `lastActiveDate` is from the previous day, `currentStreak` increments unboundedly because `lastActiveDate` is never updated by `updateStreak()`.

**Steps to reproduce:**
1. Set `lastActiveDate` to yesterday.
2. Load `/tasks` three times.
3. Check `currentStreak` — it will be 3 higher than expected.

**Expected:** Streak increments once per day maximum.
**Actual:** Streak increments on every page load.

**Fix suggestion:**
- Move `updateStreak()` out of `getUserStats()` read path.
- Call it explicitly only in `awardXP()` after XP write.
- Always update `lastActiveDate` to today after incrementing.

**Priority:** Critical (P0)
**Labels:** qa, qa-2026-03, backend

---

## Ticket 4: API-02

**Summary:** [Bug] Prevent XP farming exploit via task status toggle

**Description:**
Users can earn unlimited XP by toggling a task between `todo` and `done` status. Each cycle awards full XP (10 base + priority bonus + bonuses). Observed: totalXP 50→95→140 across two re-completions.

**Steps to reproduce:**
1. POST `/api/task-status` with `taskId=1&status=done` (awards XP).
2. POST `/api/task-status` with `taskId=1&status=todo`.
3. Repeat step 1 — XP awarded again.

**Expected:** XP awarded only on first completion.
**Actual:** Unlimited XP per todo→done cycle.

**Fix suggestion:**
- Track first completion (e.g., `completedCount` column or keep `completedAt` non-null).
- Only award XP on the first completion, or limit re-awards.

**Priority:** Critical (P0)
**Labels:** qa, qa-2026-03, backend, gamification

---

## Ticket 5: API-03 / FE-06

**Summary:** [Bug] Fix delete button in task detail form — non-functional due to hidden intent field

**Description:**
The delete button in the task detail form (`tasks.$taskId.tsx`) is non-functional. The form contains a hidden `<input name="intent" value="update">` that shadows the delete button's `name="intent" value="delete"`. `formData.get("intent")` returns the hidden field's value ("update"), so the action always enters the update branch.

**Steps to reproduce:**
1. Open any task detail page.
2. Click "Delete Task".
3. Task is updated, not deleted.

**Expected:** Task is deleted, user redirected to `/tasks`.
**Actual:** Task is updated (or update fails), not deleted.

**Fix suggestion:**
- Remove the hidden `intent=update` input from line 127.
- The "Save Changes" button already has `name="intent" value="update"`, which is sufficient.

**Priority:** Critical (P0)
**Labels:** qa, qa-2026-03, frontend, backend

---

## Ticket 6: FE-03 / FE-04 / FE-05

**Summary:** [Bug] Add responsive breakpoints to sidebar, Kanban grid, and quick stats

**Description:**
Multiple layout grids have no responsive breakpoints, making the app unusable on mobile:
- Sidebar `col-span-3` / main `col-span-9` with no responsive variant.
- Kanban `grid-cols-3` with no responsive variant.
- Quick stats `grid-cols-4` with no responsive variant (unlike user stats which correctly uses `grid-cols-2 md:grid-cols-4`).

**Steps to reproduce:**
1. Open `/tasks?view=kanban` at 320px viewport width.
2. Observe sidebar and Kanban columns squeezed.

**Expected:** Sidebar stacks on mobile; Kanban columns stack vertically.
**Actual:** All elements forced side-by-side, unreadable.

**Fix suggestion:**
- Sidebar: `col-span-12 md:col-span-3` / main: `col-span-12 md:col-span-9`.
- Kanban: `grid-cols-1 md:grid-cols-3`.
- Quick stats: `grid-cols-2 md:grid-cols-4`.

**Priority:** High (P1)
**Labels:** qa, qa-2026-03, frontend, responsive

---

## Ticket 7: API-04 / API-05

**Summary:** [Bug] Validate status and priority enums before DB write

**Description:**
Invalid `status` or `priority` values cause unhandled 500 errors with full SQLite CHECK constraint errors and stack traces exposed to clients. No server-side enum validation exists.

**Steps to reproduce:**
1. POST `/api/task-status` with `status=invalid_status`.
2. POST `/tasks/new` with `priority=critical`.

**Expected:** 400 response with validation error.
**Actual:** 500 with `SqliteError: CHECK constraint failed` and stack trace.

**Fix suggestion:**
- Validate status against `['todo', 'in-progress', 'done']` before DB call.
- Validate priority against `['low', 'medium', 'high']` before DB call.
- Apply in all route actions: `api.task-status.tsx`, `tasks.new.tsx`, `tasks.$taskId.tsx`.

**Priority:** High (P1)
**Labels:** qa, qa-2026-03, api, validation

---

## Ticket 8: API-06 / API-07

**Summary:** [Bug] Validate pomodoro input — reject negative minutes and non-existent tasks

**Description:**
Two issues in `/api/pomodoro`:
1. Negative minutes are accepted and stored, corrupting both task and global stats.
2. Pomodoro on a non-existent taskId silently succeeds, inflating `totalPomodoroMinutes` without any task being affected.

**Steps to reproduce:**
1. POST `/api/pomodoro` with `intent=pomodoro&taskId=2&minutes=-100` → 200 OK.
2. POST `/api/pomodoro` with `intent=pomodoro&taskId=99999&minutes=60` → 200 OK.

**Expected:** 400 for negative minutes; 404 for non-existent task.
**Actual:** Both succeed and corrupt/inflate stats.

**Fix suggestion:**
- Add `if (minutes <= 0) return 400` validation.
- Call `getTask(taskId)` before `addPomodoroTime()` and return 404 if missing.

**Priority:** High (P1)
**Labels:** qa, qa-2026-03, api, validation

---

## Ticket 9: E2E-02

**Summary:** [Bug] Add confirmation dialog before deleting a task

**Description:**
Clicking "Delete Task" immediately deletes the task with no confirmation prompt. Users risk accidental data loss.

**Steps to reproduce:**
1. Open any task detail page.
2. Click "Delete Task" — task is immediately deleted.

**Expected:** Confirmation dialog before deletion.
**Actual:** Immediate deletion.

**Fix suggestion:** Add `window.confirm("Are you sure?")` or a custom confirmation modal.

**Priority:** High (P1)
**Labels:** qa, qa-2026-03, ux

---

## Ticket 10: E2E-03

**Summary:** [Bug] Quick stats bar shows total counts even when filters are active

**Description:**
The stat cards (Total Tasks, To Do, In Progress, Completed) always show global counts regardless of active filters/search. This is confusing when users are viewing a filtered subset.

**Steps to reproduce:**
1. Search for a task.
2. Observe stat cards — they show total, not filtered counts.

**Expected:** Stats reflect the currently visible filtered set.
**Actual:** Stats always show unfiltered totals.

**Fix suggestion:** Show "Showing X of Y tasks" label, or pass filter params to `getTaskStats()`.

**Priority:** High (P1)
**Labels:** qa, qa-2026-03, frontend, ux

---

## Ticket 11: Dark mode gaps (FE-07, FE-08, FE-09, FE-18, FE-22, FE-23)

**Summary:** [Bug] Fix dark mode color gaps across badges, buttons, PomodoroTimer, ErrorBoundary, emoji picker

**Description:**
Multiple UI elements lack dark mode variants:
- PomodoroTimer heading: hardcoded `text-gray-900` without `dark:text-white`.
- All badge CSS classes (`badge-todo`, `badge-in-progress`, etc.): no dark variants.
- `btn-secondary`: no dark variants.
- ErrorBoundary: hardcoded light-mode classes.
- Emoji picker hover/selected states.

**Fix suggestion:**
- Add `dark:` variants to all affected classes in `tailwind.css` and component files.

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, frontend, dark-mode

---

## Ticket 12: Filter URL and view toggle bugs (FE-10, FE-11)

**Summary:** [Bug] Fix malformed filter URLs and search param lost on view toggle

**Description:**
1. Filter links use manual string concatenation, producing malformed URLs like `/tasks&category=Design` (missing `?` prefix).
2. View mode toggle (List/Board) drops the active search query.

**Fix suggestion:**
- Use `URLSearchParams` to build filter URLs instead of string concatenation.
- Add search param to view toggle URLs.

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, frontend

---

## Ticket 13: Modal accessibility (FE-15, FE-16, FE-17)

**Summary:** [Bug] Improve modal accessibility — Escape key, backdrop click, ARIA attributes

**Description:**
Create/edit task modals lack:
- Escape key handler to close.
- Backdrop click to close.
- ARIA dialog attributes (`role="dialog"`, `aria-modal`, `aria-labelledby`).

**Fix suggestion:** Add `useEffect` for Escape key, `onClick` on backdrop, and ARIA attributes.

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, accessibility

---

## Ticket 14: FE-12

**Summary:** [Bug] Fix focus window hardcoded CSS path — 404 in Vite builds

**Description:**
`focus.$taskId.tsx` hardcodes `<link rel="stylesheet" href="/build/_assets/tailwind.css" />`. With Vite, assets are served from `/assets/` with hashed filenames, so the stylesheet 404s and the focus window renders unstyled.

**Fix suggestion:** Use Remix's `<Links />` component or import the stylesheet via the `links` export.

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, frontend

---

## Ticket 15: API-08

**Summary:** [Bug] Prevent double streak increment during task completion flow

**Description:**
When completing a task, `getUserStats()→updateStreak()` is called twice: once via `awardXP()` and again via `checkAchievements()→getUserStats()`. This double-increments `currentStreak`.

**Fix suggestion:** Remove `updateStreak` from `getUserStats()`. Call it once explicitly in `awardXP()`.

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, backend

---

## Ticket 16: API-09 / API-12

**Summary:** [Bug] Suppress stack traces in API error responses (GET and empty POST)

**Description:**
- GET requests to `/api/task-status` and `/api/pomodoro` return 400 with full Remix framework stack traces.
- Empty POST without Content-Type causes 500 TypeError with stack trace.

**Fix suggestion:**
- Add `loader` exports returning 405.
- Wrap `request.formData()` in try-catch.

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, api, security

---

## Ticket 17: API-10

**Summary:** [Bug] Add max length validation for task title and description

**Description:**
No upper bound on title/description length. 10,000-character titles are accepted. This could impact rendering and storage.

**Fix suggestion:** Add validation: title ≤ 255 chars, description ≤ 5000 chars.

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, api, validation

---

## Ticket 18: Remaining P2 items (FE-13, FE-14, E2E-04, E2E-05, E2E-06)

**Summary:** [Bug] Various P2 fixes: DOM manipulation in emoji picker, responsive modal, favicon, DB constraints, Focus Mode on done tasks

**Description:**
- FE-13: Emoji picker uses `document.getElementById` instead of React state.
- FE-14: Edit modal `grid-cols-2` not responsive; unusable on mobile.
- E2E-04: Missing `favicon.ico` → 404 on every page load.
- E2E-05: DB schema allows NULL for status/priority (CHECK constraint doesn't prevent NULL).
- E2E-06: Focus Mode button appears on completed tasks.

**Fix suggestions included per item above.**

**Priority:** Medium (P2)
**Labels:** qa, qa-2026-03, frontend

---

## Ticket 19: P3 accessibility batch (FE-19, FE-20, FE-21, FE-25, E2E-07)

**Summary:** [Improvement] Accessibility improvements — touch actions, aria-labels, keyboard navigation, contrast

**Description:**
- FE-19: Hover-only quick actions invisible on touch devices.
- FE-20: Icon-only buttons (×, ⧉, 🔄) lack `aria-label`.
- FE-21: FocusMode panel not keyboard-accessible.
- FE-25: `badge-low` text contrast may fail WCAG AA.
- E2E-07: Emoji picker not keyboard-navigable.

**Priority:** Low (P3)
**Labels:** qa, qa-2026-03, accessibility

---

## Ticket 20: P3 dark mode polish (FE-22, FE-23, FE-24)

**Summary:** [Improvement] Dark mode polish — emoji picker hover/selected states, template grid responsive

**Description:**
- FE-22: Emoji picker `hover:bg-gray-100` causes bright flash in dark mode.
- FE-23: Selected emoji `bg-purple-50` looks wrong in dark mode.
- FE-24: Quick Templates `grid-cols-3` not responsive.

**Priority:** Low (P3)
**Labels:** qa, qa-2026-03, frontend

---

## Ticket 21: API-11

**Summary:** [Bug] Return 404 for update/delete actions on non-existent tasks

**Description:**
POST actions on non-existent task IDs silently succeed with 302 redirect instead of returning 404.

**Fix suggestion:** Check `getTask(taskId)` at start of action; return 404 if not found.

**Priority:** Low (P3)
**Labels:** qa, qa-2026-03, backend
