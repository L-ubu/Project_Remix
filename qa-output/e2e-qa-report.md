# QA Report — TaskFlow Pro E2E — 2026-03-18 / cursor/full-qa-run-602f

## Summary
- Total findings: 7 (P0: 1, P1: 2, P2: 3, P3: 1)
- Areas: E2E
- Flows tested: 8 / 8
- Flows passing: 8 / 8 (after data fix; 1/8 before data fix)

## Findings

### E2E — App crashes on null task status/priority [P0]
- **ID:** E2E-01
- **Title:** Fix null-guard on task.priority and task.status in task list rendering
- **Area:** E2E
- **Severity:** P0 — Critical / Blocking
- **Steps:**
  1. Insert or update a task in SQLite with `status = NULL` or `priority = NULL`
  2. Navigate to `/tasks`
  3. App throws `TypeError: Cannot read properties of null (reading 'charAt')` and shows error page
- **Expected:** Task list renders gracefully, showing a fallback for tasks with missing status/priority
- **Actual:** Full-page crash at `tasks.tsx:474` — `task.priority.charAt(0).toUpperCase()` throws on null
- **Suggestion:** Add null guards in `tasks.tsx` (both list and kanban views): `(task.priority ?? 'medium').charAt(0)`. Also add `NOT NULL` constraints to the DB schema or validate on write.
- **Evidence:** See `crash_null_priority.png`, `e2e_crash_null_priority_status.mp4`

### E2E — Delete task has no confirmation dialog [P1]
- **ID:** E2E-02
- **Title:** Add confirmation dialog before deleting a task
- **Area:** E2E
- **Severity:** P1 — High
- **Steps:**
  1. Open any task detail (`/tasks/$id`)
  2. Click "Delete Task" button
  3. Task is immediately deleted without confirmation
- **Expected:** A confirmation dialog ("Are you sure?") should appear before deletion
- **Actual:** Task is deleted instantly on button click — no undo, no confirmation
- **Suggestion:** Add `onClick` handler with `window.confirm()` or a custom modal before form submission. Consider adding undo/soft-delete.
- **Evidence:** See `flow5_before_delete.png`

### E2E — Quick stats bar does not reflect active filters [P1]
- **ID:** E2E-03
- **Title:** Update quick stats to reflect active filter context
- **Area:** E2E
- **Severity:** P1 — High
- **Steps:**
  1. Navigate to `/tasks`
  2. Click status filter "To Do" or search for a term
  3. Quick stats bar still shows total counts for all tasks
- **Expected:** Stats should indicate filtered context or show filtered counts alongside totals
- **Actual:** Stats always show total/unfiltered counts, which may confuse users about what they're viewing
- **Suggestion:** Either: (a) show filtered counts when filters are active, or (b) add a visual label like "Showing X of Y tasks" above the task list.
- **Evidence:** See `flow6_search_results.png`, `flow6_status_filter.png`

### E2E — Missing favicon returns 404 [P2]
- **ID:** E2E-04
- **Title:** Add favicon.ico to prevent 404 console error
- **Area:** E2E
- **Severity:** P2 — Medium
- **Steps:**
  1. Open any page in the app
  2. Check browser console
  3. `GET /favicon.ico` returns 404
- **Expected:** Valid favicon returned or no 404
- **Actual:** 404 error on every page load for `/favicon.ico`
- **Suggestion:** Add a `favicon.ico` file to `public/` directory or add a `<link rel="icon">` tag in root layout.
- **Evidence:** Console error in all flows: "Failed to load resource: the server responded with a status of 404"

### E2E — DB schema allows NULL for status/priority despite frontend requirement [P2]
- **ID:** E2E-05
- **Title:** Add NOT NULL constraints to tasks.status and tasks.priority columns
- **Area:** E2E
- **Severity:** P2 — Medium
- **Steps:**
  1. Review `db.server.ts` schema
  2. `status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done'))` — CHECK allows NULL because SQL NULL comparison returns UNKNOWN, not FALSE
  3. Any external write (migration, API bypass, direct SQL) can set NULL
- **Expected:** Schema should enforce NOT NULL for required fields
- **Actual:** NULL values pass CHECK constraint and crash the frontend
- **Suggestion:** Alter schema to `status TEXT NOT NULL DEFAULT 'todo'` and `priority TEXT NOT NULL DEFAULT 'medium'`. Add migration to fix any existing NULL records.
- **Evidence:** Root cause of E2E-01

### E2E — Completed task shows "Focus Mode" hover action [P2]
- **ID:** E2E-06
- **Title:** Hide Focus Mode quick action for completed tasks
- **Area:** E2E
- **Severity:** P2 — Medium
- **Steps:**
  1. Navigate to `/tasks` in list view
  2. Hover over a task with status "Done"
  3. "Focus Mode" button appears on hover
- **Expected:** Completed tasks should not show Focus Mode action (no work to focus on)
- **Actual:** Focus Mode button is shown for all tasks including completed ones
- **Suggestion:** Add `task.status !== 'done'` check around Focus Mode button rendering in both list and kanban views.
- **Evidence:** See `flow8_hover_actions.png` — completed "QA Test Task (Edited)" shows Focus Mode

### E2E — No keyboard accessibility for emoji picker [P3]
- **ID:** E2E-07
- **Title:** Add keyboard navigation support to emoji picker
- **Area:** E2E
- **Severity:** P3 — Low
- **Steps:**
  1. Open create or edit task modal
  2. Try to navigate emoji picker with keyboard (Tab/Arrow keys)
  3. No keyboard navigation support
- **Expected:** Emoji picker should be navigable via keyboard
- **Actual:** Only mouse clicks work for emoji selection
- **Suggestion:** Add `tabIndex`, `onKeyDown` handlers, and ARIA attributes to emoji picker buttons. Consider a select dropdown as accessible alternative.
- **Evidence:** Observed during Puppeteer testing

## Flow Results

| Flow | Description | Status | Notes |
|------|-------------|--------|-------|
| Flow 1 | View tasks and navigate | ✅ PASS | List/Board toggle works. All 4 stat cards visible. Stats bar shows Level, Streak, XP, Completed. |
| Flow 2 | Create a new task | ✅ PASS | Modal opens, templates work, form fills correctly, task created and visible in list. Redirects to task detail. |
| Flow 3 | Edit a task | ✅ PASS | Edit modal opens with pre-filled data, title change and status change save correctly. |
| Flow 4 | Complete a task (XP flow) | ✅ PASS | XP increased from 185→215 (+30). Confetti animation triggered. Level progressed. |
| Flow 5 | Delete a task | ✅ PASS | Delete works via form submission. Redirects to /tasks. **No confirmation dialog (E2E-02).** |
| Flow 6 | Search and filter | ✅ PASS | Search works. Status filter works. Category filter works. All filter clearing works. |
| Flow 7 | Dark mode toggle | ✅ PASS | Toggle switches between light/dark. All elements render correctly in both modes. |
| Flow 8 | Quick actions (hover) | ✅ PASS | Focus Mode, Start, Done buttons appear on hover. Start changes todo→in-progress. |

**Note:** All flows initially FAILED due to E2E-01 (null priority crash). After fixing the corrupt database record, all 8 flows passed.

## Videos / Recordings

| File | Description |
|------|-------------|
| `/opt/cursor/artifacts/e2e_create_complete_task_and_xp_flow.mp4` | Full flow: task list → create task → fill form → submit → complete task → confetti → XP gain → board view → dark mode toggle |
| `/opt/cursor/artifacts/e2e_crash_null_priority_status.mp4` | Reproduction of P0 crash: navigating to /tasks with null status/priority data |

## Screenshots

| File | Description |
|------|-------------|
| `flow1_task_list.png` | Task list view with stats bar and all stat cards |
| `flow1_kanban_view.png` | Kanban/Board view with 3 columns |
| `flow2_create_modal.png` | Create task modal with templates |
| `flow2_form_filled.png` | Create task form filled with test data |
| `flow2_after_create.png` | Task detail page after creation |
| `flow2_task_in_list.png` | New task visible in task list |
| `flow3_edit_modal.png` | Edit task modal with form fields |
| `flow3_form_edited.png` | Edit form with changed title and status |
| `flow3_after_save.png` | Task list after saving edits |
| `flow4_before_complete.png` | Stats before completing task (XP: 185) |
| `flow4_task_detail.png` | Task detail before completion |
| `flow4_after_complete.png` | Confetti animation after completion |
| `flow4_xp_after.png` | Stats after completing task (XP: 215, Level 3) |
| `flow5_before_delete.png` | Task detail before deletion |
| `flow5_after_delete.png` | Task list after deletion |
| `flow6_search_results.png` | Search results for "QA Test" |
| `flow6_status_filter.png` | Filtered view showing only To Do tasks |
| `flow6_category_filter.png` | Category filter applied |
| `flow7_light_mode.png` | App in light mode |
| `flow7_dark_mode.png` | App in dark mode |
| `flow8_hover_actions.png` | Quick action buttons on hover |
| `crash_null_priority.png` | P0 crash: full error page |

## Fix List

| ID | Title | Severity | Area | Suggested ticket summary |
|----|-------|----------|------|--------------------------|
| E2E-01 | Fix null-guard on task.priority/status | P0 | E2E | App crashes when task has NULL status/priority; add null guards in tasks.tsx and NOT NULL constraint in schema |
| E2E-02 | Add delete confirmation dialog | P1 | E2E | Delete Task button immediately deletes without confirmation; add confirm dialog |
| E2E-03 | Update quick stats for filter context | P1 | E2E | Quick stats show total counts even when filters active; show filtered context |
| E2E-04 | Add favicon.ico | P2 | E2E | Missing favicon causes 404 console error on every page load |
| E2E-05 | Add NOT NULL to status/priority columns | P2 | E2E | DB schema allows NULL for status/priority despite frontend requirement |
| E2E-06 | Hide Focus Mode for completed tasks | P2 | E2E | Focus Mode hover action shown for completed tasks where it's not useful |
| E2E-07 | Add keyboard a11y to emoji picker | P3 | E2E | Emoji picker not keyboard-navigable; add ARIA and key handlers |
