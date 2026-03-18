# Jira Tickets — TaskFlow Pro QA — 2026-03-18

> No Jira MCP available. Copy-paste each block into Jira (type: Bug).
> Labels: `qa`, `qa-2026-03`

---

### TFP-01 [P0] App crashes on null priority/status + stack trace exposed

**Summary:** Task list crashes when a task has NULL priority or status; ErrorBoundary leaks full stack trace to user

**Description:**
Navigating to `/tasks` throws `TypeError: Cannot read properties of null (reading 'charAt')` when any task has a NULL priority. The ErrorBoundary then displays the full server-side stack trace (file paths, line numbers, framework internals) to the end user.

**Root cause:** No null guard on `task.priority` in `tasks.tsx:474`; `<pre>{error.stack}</pre>` in `root.tsx:60`.
**Fix:** Add `(task.priority ?? 'medium')` null coalescing; remove stack-trace `<pre>` block; add `NOT NULL` to schema.

**Covers:** FE-01, FE-02, E2E-01, E2E-05

---

### TFP-02 [P0] Streak inflates on every page load

**Summary:** `updateStreak()` runs on every `getUserStats()` read and increments `currentStreak` unboundedly

**Description:**
Every `GET /tasks` calls `getUserStats()` which calls `updateStreak()`. When `lastActiveDate` is yesterday, `currentStreak` increments each time because `lastActiveDate` is never updated. Three page loads turn streak 5 into 8.

**Fix:** Move `updateStreak` out of the read path; update `lastActiveDate` atomically after incrementing. Also fix the double-increment during task completion (called twice via `awardXP` + `checkAchievements`).

**Covers:** API-01, API-08

---

### TFP-03 [P0] XP farming exploit via status toggle

**Summary:** Unlimited XP by toggling a task between "todo" and "done" repeatedly

**Description:**
Each todo-to-done transition awards full XP (10 base + priority bonus). No guard prevents re-awarding after re-opening a completed task. Observed: totalXP 50 → 95 → 140 in two cycles.

**Fix:** Track first completion (e.g. `completedCount` column or keep `completedAt` non-null). Only award XP once per task.

**Covers:** API-02

---

### TFP-04 [P0] Delete button is non-functional

**Summary:** Clicking "Delete Task" silently updates the task instead of deleting it

**Description:**
The edit-task form has `<input type="hidden" name="intent" value="update">`. When the Delete button (also `name="intent" value="delete"`) is clicked, `formData.get("intent")` returns the first value ("update"), so delete is never reached.

**Fix:** Remove hidden `intent=update` input; the Save button already carries that value. Add confirmation dialog before delete.

**Covers:** API-03, FE-06, E2E-02

---

### TFP-05 [P1] Mobile layout completely broken (no responsive breakpoints)

**Summary:** Sidebar, Kanban columns, stats grid, and modal grid have no responsive breakpoints

**Description:**
- Sidebar `col-span-3` / main `col-span-9` forced side-by-side at 320 px.
- Kanban `grid-cols-3` unreadable on mobile.
- Quick-stats `grid-cols-4` does not wrap (user-stats above it correctly uses `grid-cols-2 md:grid-cols-4`).
- Edit modal `grid-cols-2` unusable on mobile.
- Template grid `grid-cols-3` not responsive.

**Fix:** Add `col-span-12 md:col-span-3`, `grid-cols-1 md:grid-cols-3`, `grid-cols-2 md:grid-cols-4`, etc.

**Covers:** FE-03, FE-04, FE-05, FE-14, FE-24

---

### TFP-06 [P1] API returns 500 with stack traces on invalid input

**Summary:** Invalid status/priority values, negative pomodoro minutes, and non-existent taskIds all bypass validation

**Description:**
- Invalid `status` → 500 SQLite CHECK error with full stack trace.
- Invalid `priority` → same.
- `minutes=-100` → 200 OK; corrupts stats.
- `taskId=99999` on pomodoro → 200 OK; inflates global stats.
- GET to API routes → 400 with framework stack trace.
- Empty POST → 500 TypeError.

**Fix:** Add enum validation for status/priority; reject `minutes <= 0`; check task exists before pomodoro; add `loader` returning 405; wrap `formData()` in try-catch.

**Covers:** API-04, API-05, API-06, API-07, API-09, API-10, API-12

---

### TFP-07 [P1] Stats bar ignores active filters

**Summary:** Quick-stats cards always show global totals regardless of search/filter state

**Description:**
When a user searches or filters by status/category, the stat cards still show unfiltered counts. Confusing when viewing a subset.

**Fix:** Add "Showing X of Y" label, or pass filter params to `getTaskStats()`.

**Covers:** E2E-03

---

### TFP-08 [P2] Dark mode gaps across badges, buttons, timer, ErrorBoundary, emoji picker

**Summary:** Multiple UI elements lack dark-mode color variants

**Description:**
- All badge classes (`badge-todo`, `badge-in-progress`, `badge-done`, `badge-low`, `badge-medium`, `badge-high`): no dark variants.
- `btn-secondary`: no dark variants.
- PomodoroTimer heading: hardcoded `text-gray-900`.
- ErrorBoundary page: hardcoded light-mode background/text.
- Emoji picker hover and selected states.

**Fix:** Add `dark:` Tailwind variants to all affected classes.

**Covers:** FE-07, FE-08, FE-09, FE-18, FE-22, FE-23

---

### TFP-09 [P2] Filter/search URL bugs

**Summary:** Filter links produce malformed URLs; view toggle drops search query

**Description:**
- Filter links use string concatenation and can produce `/tasks&category=X` (missing `?`).
- Switching between List and Board view drops the active search parameter.

**Fix:** Use `URLSearchParams` to build all filter/toggle URLs.

**Covers:** FE-10, FE-11

---

### TFP-10 [P2] Modal UX: no Escape, no backdrop-click, no ARIA attributes

**Summary:** Create/edit modals lack standard dismiss patterns and accessibility markup

**Description:**
- Cannot close with Escape key.
- Cannot close by clicking backdrop.
- Missing `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.

**Fix:** Add `useEffect` keydown listener for Escape; add `onClick` on backdrop with `stopPropagation` on inner panel; add ARIA attributes.

**Covers:** FE-15, FE-16, FE-17

---

### TFP-11 [P2] Focus window CSS 404 in Vite + completed-task Focus button

**Summary:** Focus pop-out window unstyled due to hardcoded CSS path; Focus Mode shown on done tasks

**Description:**
- `focus.$taskId.tsx` hardcodes `/build/_assets/tailwind.css` which does not exist in Vite; window renders unstyled.
- Focus Mode button appears on completed tasks where it serves no purpose.

**Fix:** Use Remix `<Links />` for CSS; guard Focus button with `task.status !== 'done'`.

**Covers:** FE-12, FE-13, E2E-06

---

### TFP-12 [P2] Missing favicon + schema allows NULL on required fields

**Summary:** Missing `favicon.ico` causes 404 on every load; DB permits NULL for status/priority

**Description:**
- No `favicon.ico` in `public/` → console 404.
- `CHECK(status IN (...))` does not reject SQL NULL; tasks can end up with NULL status/priority.

**Fix:** Add favicon; add `NOT NULL` to status and priority columns. Also: return 404 for actions on non-existent task IDs (currently returns silent 302).

**Covers:** E2E-04, E2E-05, API-11

---

### TFP-13 [P3] Accessibility batch: touch targets, aria-labels, keyboard nav, contrast

**Summary:** Multiple minor accessibility gaps

**Description:**
- Hover-only quick actions invisible on touch devices.
- Icon-only buttons (x, pop-out, reset) lack `aria-label`.
- FocusMode panel mouse-only; not keyboard-accessible.
- Emoji picker not keyboard-navigable.
- `badge-low` text contrast slightly below WCAG AA 4.5:1.

**Fix:** Show actions on mobile by default; add `aria-label`s; add keyboard handlers; change `text-gray-600` to `text-gray-700` on badge-low.

**Covers:** FE-19, FE-20, FE-21, FE-25, E2E-07
