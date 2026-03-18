# QA Report — TaskFlow Pro — 2026-03-18 / cursor/full-qa-run-602f

## Summary
- **Total findings: 44** (P0: 6, P1: 10, P2: 18, P3: 10)
- **Areas:** Frontend (25), Backend/API (12), E2E (7)
- **Storybook:** Not available (skipped)
- **App URL:** http://localhost:5173
- **Visual testing:** Performed at 320px, 768px, 1280px + dark mode
- **E2E flows tested:** 8/8 passing (after corrupt data fix)
- **API tests:** 37 curl-based tests executed

---

## P0 — Critical Findings

### FE-01 — Fix null-safe crash in list view when task has null priority [P0]
- **ID:** FE-01
- **Area:** Frontend
- **Severity:** P0 (Critical)
- **Steps:**
  1. Insert a task with NULL priority into the database.
  2. Navigate to `/tasks` (list view).
  3. Page crashes: "Cannot read properties of null (reading 'charAt')".
- **Expected:** Page renders gracefully with fallback for tasks with missing priority.
- **Actual:** Entire `/tasks` layout crashes at `tasks.tsx:474`, blocking all task management.
- **Suggestion:** Add null guard: `(task.priority ?? 'medium').charAt(0).toUpperCase()`. Add NOT NULL constraints to schema.
- **Evidence:** Screenshots: `evidence_error_stack_exposure.png`, `crash_null_priority.png`

### FE-02 — Remove error.stack exposure from ErrorBoundary [P0]
- **ID:** FE-02
- **Area:** Frontend / Security
- **Severity:** P0 (Critical)
- **Steps:**
  1. Trigger any unhandled error (e.g., FE-01 above).
  2. Observe the ErrorBoundary page.
- **Expected:** User-friendly error message without technical details.
- **Actual:** Full stack trace including server file paths, framework internals, and node_modules paths displayed to user.
- **Suggestion:** In `app/root.tsx` lines 60–62, remove `<pre>{error.stack}</pre>`. Log server-side only.
- **Evidence:** Screenshot: `evidence_error_stack_exposure.png`

### API-01 — Fix updateStreak side-effect inflating streak on every page load [P0]
- **ID:** API-01
- **Area:** Backend
- **Severity:** P0 (Critical)
- **Steps:**
  1. Set `lastActiveDate` to yesterday in DB.
  2. Load `GET /tasks` three times in succession.
  3. Query `SELECT currentStreak FROM user_stats`.
- **Expected:** `currentStreak` increments once then stays.
- **Actual:** `currentStreak` increments on every page load (5→6→7→8). `updateStreak()` runs in `getUserStats()` on every read and never updates `lastActiveDate`.
- **Suggestion:** Move streak calculation out of `getUserStats()`. Update `lastActiveDate` after incrementing.
- **Evidence:** Verified via sqlite3 queries showing streak inflation.

### API-02 — Prevent XP farming exploit via task status toggle [P0]
- **ID:** API-02
- **Area:** Backend
- **Severity:** P0 (Critical)
- **Steps:**
  1. POST `/api/task-status` with `taskId=1&status=done` (awards XP).
  2. POST `/api/task-status` with `taskId=1&status=todo` (reset).
  3. Repeat step 1 — XP awarded again.
- **Expected:** XP awarded only on first completion.
- **Actual:** Each todo→done cycle awards full XP. totalXP went 50→95→140 across two re-completions.
- **Suggestion:** Track first completion (e.g., `completedCount` column). Only award XP on first completion.
- **Evidence:** DB queries showing XP inflation.

### API-03 — Fix delete button shadowed by hidden intent=update field [P0]
- **ID:** API-03
- **Area:** Backend
- **Severity:** P0 (Critical)
- **Steps:**
  1. Open task detail (`/tasks/3`).
  2. Click "Delete Task".
- **Expected:** Task is deleted.
- **Actual:** Form contains hidden `intent=update` field AND delete button `intent=delete`. `formData.get("intent")` returns first value ("update"), so delete is silently ignored.
- **Suggestion:** Remove hidden `intent=update` input from `tasks.$taskId.tsx` line 127. Rely on button values only.
- **Evidence:** Verified via curl showing task updated, not deleted.

### E2E-01 — Fix null-guard on task.priority/status in task list [P0]
- **ID:** E2E-01
- **Area:** E2E
- **Severity:** P0 (Critical)
- **Steps:**
  1. Insert task with NULL status/priority → navigate to `/tasks`.
- **Expected:** Page renders gracefully.
- **Actual:** TypeError crash at `tasks.tsx:474`.
- **Suggestion:** Add null coalescing + NOT NULL constraints.
- **Evidence:** `crash_null_priority.png`, `e2e_crash_null_priority_status.mp4`

---

## P1 — High Findings

### FE-03 — Add responsive breakpoints to sidebar/main grid layout [P1]
- **ID:** FE-03
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:** Open `/tasks` at 320px viewport width.
- **Expected:** Sidebar collapses or stacks above main content on mobile.
- **Actual:** Sidebar `col-span-3` and main `col-span-9` remain side-by-side, both unreadably narrow.
- **Suggestion:** Change to `col-span-12 md:col-span-3` and `col-span-12 md:col-span-9`.
- **Evidence:** `evidence_kanban_mobile_320px.png`

### FE-04 — Add responsive breakpoints to Kanban grid [P1]
- **ID:** FE-04
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:** Open `/tasks?view=kanban` at 320px.
- **Expected:** Kanban columns stack vertically on mobile.
- **Actual:** Three columns crammed side-by-side, unreadable.
- **Suggestion:** Change `grid-cols-3` to `grid grid-cols-1 md:grid-cols-3`.
- **Evidence:** `evidence_kanban_mobile_320px.png`

### FE-05 — Add responsive breakpoints to quick stats grid [P1]
- **ID:** FE-05
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:** Open `/tasks` at 320px.
- **Expected:** Stats wrap to 2 columns.
- **Actual:** `grid-cols-4` with no responsive variant (unlike user stats which uses `grid-cols-2 md:grid-cols-4`).
- **Suggestion:** Change to `grid grid-cols-2 md:grid-cols-4`.

### FE-06 — Fix delete button intent conflict with hidden field [P1]
- **ID:** FE-06
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:** Open task detail → click "Delete Task".
- **Expected:** Task is deleted.
- **Actual:** Hidden `intent=update` field overrides delete button intent.
- **Suggestion:** Remove hidden intent field. Rely on button `name="intent"` values.

### API-04 — Validate status enum before DB write [P1]
- **ID:** API-04
- **Area:** API
- **Severity:** P1 (High)
- **Steps:** POST `/api/task-status` with `status=invalid_status`.
- **Expected:** 400 with validation error.
- **Actual:** 500 with SQLite CHECK constraint error and full stack trace.
- **Suggestion:** Validate status against `['todo', 'in-progress', 'done']` before DB call.

### API-05 — Validate priority enum before DB write [P1]
- **ID:** API-05
- **Area:** API
- **Severity:** P1 (High)
- **Steps:** POST `/tasks/new` with `priority=critical`.
- **Expected:** 400 with validation error.
- **Actual:** 500 with SQLite CHECK constraint error and stack trace.
- **Suggestion:** Validate priority against `['low', 'medium', 'high']`.

### API-06 — Validate pomodoro minutes are positive [P1]
- **ID:** API-06
- **Area:** API
- **Severity:** P1 (High)
- **Steps:** POST `/api/pomodoro` with `minutes=-100`.
- **Expected:** 400 rejecting negative minutes.
- **Actual:** 200 OK — negative value corrupts both task and global stats.
- **Suggestion:** Add validation: `if (minutes <= 0) return 400`.

### API-07 — Check task existence before recording pomodoro time [P1]
- **ID:** API-07
- **Area:** API
- **Severity:** P1 (High)
- **Steps:** POST `/api/pomodoro` with `taskId=99999` (non-existent).
- **Expected:** 404 error.
- **Actual:** 200 OK — global `totalPomodoroMinutes` inflated without any task affected.
- **Suggestion:** Check task exists before calling `addPomodoroTime()`.

### E2E-02 — Add confirmation dialog before deleting a task [P1]
- **ID:** E2E-02
- **Area:** E2E
- **Severity:** P1 (High)
- **Steps:** Open task detail → click "Delete Task".
- **Expected:** Confirmation dialog before deletion.
- **Actual:** Task deleted immediately with no confirmation.
- **Suggestion:** Add `window.confirm()` or custom modal.
- **Evidence:** `flow5_before_delete.png`

### E2E-03 — Quick stats bar does not reflect active filters [P1]
- **ID:** E2E-03
- **Area:** E2E
- **Severity:** P1 (High)
- **Steps:** Apply status filter → observe stat cards.
- **Expected:** Stats reflect filtered context.
- **Actual:** Stats always show total/unfiltered counts.
- **Suggestion:** Show "Showing X of Y tasks" label or pass filters to `getTaskStats()`.

---

## P2 — Medium Findings

### FE-07 — Fix PomodoroTimer heading dark mode text color [P2]
- **ID:** FE-07
- **Area:** Frontend
- **Suggestion:** Add `dark:text-white` to `text-gray-900` in PomodoroTimer heading.

### FE-08 — Add dark mode variants to all badge CSS classes [P2]
- **ID:** FE-08
- **Area:** Frontend
- **Suggestion:** Add `dark:bg-gray-700 dark:text-gray-300` (etc.) to all badge classes in tailwind.css.

### FE-09 — Add dark mode variants to btn-secondary [P2]
- **ID:** FE-09
- **Area:** Frontend
- **Suggestion:** Add `dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600` to btn-secondary.

### FE-10 — Fix filter links producing malformed URLs [P2]
- **ID:** FE-10
- **Area:** Frontend
- **Suggestion:** Use `URLSearchParams` instead of string concatenation for filter URLs.

### FE-11 — Preserve search param in view mode toggle [P2]
- **ID:** FE-11
- **Area:** Frontend
- **Suggestion:** Add search param to view toggle URLs.

### FE-12 — Fix focus window hardcoded CSS path for Vite [P2]
- **ID:** FE-12
- **Area:** Frontend
- **Suggestion:** Use Remix `<Links />` component instead of hardcoded `/build/_assets/tailwind.css`.

### FE-13 — Replace DOM manipulation in emoji pickers with React state [P2]
- **ID:** FE-13
- **Area:** Frontend
- **Suggestion:** Use `useState` for emoji selection; remove `document.getElementById` calls.

### FE-14 — Add responsive grid to edit task modal [P2]
- **ID:** FE-14
- **Area:** Frontend
- **Suggestion:** Change `grid-cols-2` to `grid-cols-1 lg:grid-cols-2` in task detail modal.

### FE-15 — Add Escape key handler to close modals [P2]
- **ID:** FE-15
- **Area:** Frontend / Accessibility
- **Suggestion:** Add `useEffect` with `keydown` listener for Escape in both modals.

### FE-16 — Add backdrop click to close modals [P2]
- **ID:** FE-16
- **Area:** Frontend
- **Suggestion:** Add `onClick` to backdrop div with `stopPropagation` on inner modal.

### FE-17 — Add ARIA dialog attributes to modals [P2]
- **ID:** FE-17
- **Area:** Frontend / Accessibility
- **Suggestion:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to modals.

### FE-18 — Add dark mode support to root ErrorBoundary [P2]
- **ID:** FE-18
- **Area:** Frontend
- **Suggestion:** Add dark mode variants to ErrorBoundary classes.

### API-08 — Prevent multiple updateStreak calls during task completion [P2]
- **ID:** API-08
- **Area:** Backend
- **Suggestion:** Remove `updateStreak` from `getUserStats()`. Call explicitly only in `awardXP()`.

### API-09 — Add loader to API routes or suppress stack traces [P2]
- **ID:** API-09
- **Area:** API
- **Suggestion:** Add `loader` export returning 405. Suppress stack traces in error responses.

### API-10 — Add max length validation for title and description [P2]
- **ID:** API-10
- **Area:** API
- **Suggestion:** Add max-length validation (e.g., title ≤ 255 chars, description ≤ 5000).

### E2E-04 — Missing favicon.ico returns 404 [P2]
- **ID:** E2E-04
- **Area:** E2E
- **Suggestion:** Add `favicon.ico` to `public/` directory.

### E2E-05 — DB schema allows NULL for status/priority [P2]
- **ID:** E2E-05
- **Area:** E2E
- **Suggestion:** Add `NOT NULL` to status and priority column definitions.

### E2E-06 — Completed tasks show Focus Mode hover action [P2]
- **ID:** E2E-06
- **Area:** E2E
- **Suggestion:** Add `task.status !== 'done'` guard around Focus Mode button.

---

## P3 — Low Findings

### FE-19 — Make hover-only quick actions accessible on touch devices [P3]
- **ID:** FE-19
- **Suggestion:** Add `group-focus-within:opacity-100` or show on mobile by default.

### FE-20 — Add aria-labels to icon-only buttons [P3]
- **ID:** FE-20
- **Suggestion:** Add `aria-label` to ×, ⧉, 🔄 buttons.

### FE-21 — Make FocusMode panel keyboard accessible [P3]
- **ID:** FE-21
- **Suggestion:** Add keyboard support for repositioning; add `role="dialog"`.

### FE-22 — Add dark mode hover to emoji picker buttons [P3]
- **ID:** FE-22
- **Suggestion:** Add `dark:hover:bg-gray-700`.

### FE-23 — Add dark mode selected state to emoji picker [P3]
- **ID:** FE-23
- **Suggestion:** Add `dark:bg-purple-900/20` to selected emoji.

### FE-24 — Add responsive breakpoints to template grid [P3]
- **ID:** FE-24
- **Suggestion:** Change `grid-cols-3` to `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`.

### FE-25 — Check color contrast on badge-low [P3]
- **ID:** FE-25
- **Suggestion:** Change `text-gray-600` to `text-gray-700` for WCAG AA compliance.

### API-11 — Return 404 for actions on non-existent tasks [P3]
- **ID:** API-11
- **Area:** Backend
- **Suggestion:** Check `getTask(taskId)` at start of action; return 404 if not found.

### API-12 — Handle missing Content-Type gracefully in API endpoints [P3]
- **ID:** API-12
- **Area:** API
- **Suggestion:** Wrap `request.formData()` in try-catch.

### E2E-07 — Emoji picker lacks keyboard accessibility [P3]
- **ID:** E2E-07
- **Area:** E2E
- **Suggestion:** Add ARIA roles and keyboard event handlers.

---

## Videos / Recordings
- `e2e_create_complete_task_and_xp_flow.mp4` — Full E2E: task list, create task, complete task with confetti + XP gain, board view, dark mode
- `e2e_crash_null_priority_status.mp4` — P0 crash reproduction: null status/priority TypeError

## Screenshots
- `crash_null_priority.png` — P0 crash screenshot
- `evidence_error_stack_exposure.png` — Stack trace exposed to users
- `evidence_kanban_mobile_320px.png` — Broken Kanban layout at 320px
- `evidence_kanban_desktop_working.png` — Working Kanban at 1280px
- `flow1_kanban_view.png` — Kanban board view
- `flow4_after_complete.png` — Confetti after task completion
- `flow4_xp_after.png` — XP increased after completion
- `flow7_dark_mode.png` — Dark mode view
