# QA Report — TaskQuest Pro (Backend/API) — 2026-03-18 / cursor/full-qa-run-602f

## Summary
- Total findings: 12 (P0: 3, P1: 4, P2: 3, P3: 2)
- Areas: Backend, API

## Findings

### Backend — `updateStreak` mutates DB on every read via `getUserStats()` [P0]
- **ID:** API-01
- **Title:** Fix `updateStreak` side-effect that inflates streak on every page load
- **Area:** Backend
- **Severity:** P0
- **Steps:**
  1. Set `lastActiveDate` to yesterday in DB: `UPDATE user_stats SET lastActiveDate = <yesterday_epoch>, currentStreak = 5 WHERE id = 1;`
  2. Load `GET /tasks` three times in succession.
  3. Query `SELECT currentStreak FROM user_stats WHERE id = 1;`.
- **Expected:** `currentStreak` remains 5 (or increments to 6 once, then stays).
- **Actual:** `currentStreak` increments on **every** page load (5 → 6 → 7 → 8). Each `GET /tasks` calls `getUserStats()` → `updateStreak()`, which unconditionally writes `currentStreak = currentStreak + 1` when `today - lastActive === 1`. Since `lastActiveDate` is not updated by `updateStreak`, the condition remains true on subsequent calls.
- **Suggestion:** In `app/db.server.ts`, `updateStreak()` must also update `lastActiveDate` to today after incrementing, or guard against repeated increments within the same day. Better yet, move streak calculation out of `getUserStats()` so reads never mutate state.
- **Evidence:**
  ```
  Before: currentStreak=5, lastActiveDate=1773757900
  After 1st GET /tasks: currentStreak=6
  After 2nd GET /tasks: currentStreak=7
  After 3rd GET /tasks: currentStreak=8
  ```

---

### Backend — XP farming exploit: toggle task status to re-award XP indefinitely [P0]
- **ID:** API-02
- **Title:** Prevent XP re-award when a completed task is re-opened and re-completed
- **Area:** Backend
- **Severity:** P0
- **Steps:**
  1. `curl -X POST http://localhost:5173/api/task-status -d "taskId=1&status=done"` (awards XP)
  2. `curl -X POST http://localhost:5173/api/task-status -d "taskId=1&status=todo"` (reset to todo)
  3. `curl -X POST http://localhost:5173/api/task-status -d "taskId=1&status=done"` (awards XP again)
  4. Repeat steps 2–3 indefinitely.
- **Expected:** XP is awarded only on first completion, or at most once per todo→done transition with some cooldown.
- **Actual:** Each todo→done cycle awards full XP (+45) and increments `tasksCompleted`. Observed: `totalXP` went 50 → 95 → 140 across two re-completions; `tasksCompleted` went 2 → 3 → 4.
- **Suggestion:** In `app/db.server.ts` `updateTask()`, track whether a task has ever been completed (e.g. a `completedCount` column or keep `completedAt` non-null). Only award XP on the first completion, or limit re-awards.
- **Evidence:**
  ```
  Before: totalXP=50, tasksCompleted=2
  After reset+re-complete: totalXP=95, tasksCompleted=3
  After 2nd reset+re-complete: totalXP=140, tasksCompleted=4
  ```

---

### Backend — Delete button in task detail form is non-functional due to hidden intent field [P0]
- **ID:** API-03
- **Title:** Fix delete button shadowed by hidden `intent=update` field in task detail form
- **Area:** Backend
- **Severity:** P0
- **Steps:**
  1. Open task detail page (`/tasks/3`).
  2. Click "Delete Task" button.
  3. Observe the task is **updated** (not deleted).
- **Expected:** Task is deleted and user is redirected to `/tasks`.
- **Actual:** The `<Form>` contains `<input type="hidden" name="intent" value="update" />` (line 127). When the Delete button (`name="intent" value="delete"`) is clicked, the browser sends both `intent=update` (hidden) and `intent=delete` (button). `formData.get("intent")` returns the **first** value (`"update"`), so the action always enters the `update` branch. The delete intent is never reached.
- **Suggestion:** In `app/routes/tasks.$taskId.tsx`, remove the hidden `intent=update` input. The "Save Changes" button already has `name="intent" value="update"`, which is sufficient. Alternatively, move the Delete button into its own `<Form>`.
- **Evidence:**
  ```
  Sent: intent=update&title=TestTitle&...&intent=delete
  Result: 302 redirect to /tasks (update branch)
  Task 3 was updated (title changed to "TestTitle"), not deleted.
  ```

---

### API — Invalid status value causes unhandled 500 with SQLite error and stack trace [P1]
- **ID:** API-04
- **Title:** Validate status enum before DB write in `/api/task-status` and task routes
- **Area:** API
- **Severity:** P1
- **Steps:**
  1. `curl -X POST http://localhost:5173/api/task-status -d "taskId=1&status=invalid_status"`
- **Expected:** 400 response with `{"error": "Invalid status value"}`.
- **Actual:** 500 Internal Server Error with body: `SqliteError: CHECK constraint failed: status IN ('todo', 'in-progress', 'done')` and full stack trace exposing internal file paths.
- **Suggestion:** In `app/routes/api.task-status.tsx`, validate `status` against allowed values (`todo`, `in-progress`, `done`) before calling `updateTask()`. Same for `app/routes/tasks.new.tsx` and `app/routes/tasks.$taskId.tsx`.
- **Evidence:**
  ```
  HTTP/1.1 500 Internal Server Error
  content-type: text/plain
  SqliteError: CHECK constraint failed: status IN ('todo', 'in-progress', 'done')
  ```

---

### API — Invalid priority value causes unhandled 500 with stack trace [P1]
- **ID:** API-05
- **Title:** Validate priority enum before DB write in task creation and update routes
- **Area:** API
- **Severity:** P1
- **Steps:**
  1. `curl -X POST http://localhost:5173/tasks/new -H "Content-Type: application/x-www-form-urlencoded" -d "title=TestTask&status=todo&priority=critical"`
- **Expected:** 400 response with validation error.
- **Actual:** 500 Internal Server Error with `SqliteError: CHECK constraint failed: priority IN ('low', 'medium', 'high')` and full stack trace including internal file paths and line numbers.
- **Suggestion:** In `app/routes/tasks.new.tsx` and `app/routes/tasks.$taskId.tsx`, validate `priority` against allowed values before calling `createTask()`/`updateTask()`.
- **Evidence:**
  ```
  HTTP/1.1 500 Internal Server Error
  SqliteError: CHECK constraint failed: priority IN ('low', 'medium', 'high')
      at Module.createTask (/workspace/app/db.server.ts:136:6)
      at action (/workspace/app/routes/tasks.new.tsx:36:16)
  ```

---

### API — Negative pomodoro minutes accepted, corrupting task and global stats [P1]
- **ID:** API-06
- **Title:** Validate pomodoro minutes are positive in `/api/pomodoro`
- **Area:** API
- **Severity:** P1
- **Steps:**
  1. `curl -X POST http://localhost:5173/api/pomodoro -d "intent=pomodoro&taskId=2&minutes=-100"`
- **Expected:** 400 response rejecting negative minutes.
- **Actual:** 200 OK with `{"success":true}`. The negative value is written to both `tasks.actualMinutes` and `user_stats.totalPomodoroMinutes`, corrupting stats.
- **Suggestion:** In `app/routes/api.pomodoro.tsx`, add validation: `if (!minutes || minutes <= 0) return json({ error: "Minutes must be positive" }, { status: 400 })`. Also add an upper bound (e.g. 1440 = 24 hours).
- **Evidence:**
  ```
  Before: actualMinutes=1000019, totalPomodoroMinutes=999944
  After -100: actualMinutes=999919, totalPomodoroMinutes=999844
  ```

---

### API — Pomodoro on non-existent task silently succeeds and inflates global stats [P1]
- **ID:** API-07
- **Title:** Check task existence before recording pomodoro time in `/api/pomodoro`
- **Area:** API
- **Severity:** P1
- **Steps:**
  1. `curl -X POST http://localhost:5173/api/pomodoro -d "intent=pomodoro&taskId=99999&minutes=60"`
- **Expected:** 404 response with `{"error": "Task not found"}`.
- **Actual:** 200 OK with `{"success":true}`. The task-level UPDATE silently affects 0 rows, but `user_stats.totalPomodoroMinutes` is still incremented by 60. This inflates global stats without any task being affected.
- **Suggestion:** In `app/db.server.ts` `addPomodoroTime()`, check if the task exists first (or check `changes` from the UPDATE). In the route action, call `getTask(taskId)` before `addPomodoroTime()` and return 404 if missing.
- **Evidence:**
  ```
  Before: totalPomodoroMinutes=999944
  After pomodoro on taskId=99999: totalPomodoroMinutes=1000004
  Task 99999 does not exist.
  ```

---

### Backend — `getUserStats()` called multiple times during task completion, double-incrementing streak [P2]
- **ID:** API-08
- **Title:** Prevent multiple `updateStreak` calls during single task completion flow
- **Area:** Backend
- **Severity:** P2
- **Steps:**
  1. Set `currentStreak = 0` and `lastActiveDate` = yesterday.
  2. Complete a task via `POST /api/task-status -d "taskId=4&status=done"`.
  3. Check `currentStreak`.
- **Expected:** `currentStreak = 1`.
- **Actual:** `currentStreak = 2`. The call chain `updateTask → awardXP → getUserStats() → updateStreak` runs once, then `awardXP → checkAchievements → getUserStats() → updateStreak` runs again, double-incrementing.
- **Suggestion:** Remove `updateStreak` from `getUserStats()`. Call it explicitly only in `awardXP()` after the DB write, and ensure it updates `lastActiveDate` to prevent repeat increments.
- **Evidence:**
  ```
  Before: currentStreak=0, lastActiveDate=yesterday
  After completion: currentStreak=2 (expected 1)
  ```

---

### API — GET requests to API routes leak internal stack traces [P2]
- **ID:** API-09
- **Title:** Add loader to API routes or suppress stack traces in error responses
- **Area:** API
- **Severity:** P2
- **Steps:**
  1. `curl -X GET http://localhost:5173/api/task-status`
  2. `curl -X GET http://localhost:5173/api/pomodoro`
- **Expected:** 405 Method Not Allowed with a clean JSON error body.
- **Actual:** 400 Bad Request with full Remix framework stack trace including internal file paths (`/workspace/node_modules/@remix-run/router/router.ts:5550:5`).
- **Suggestion:** Add a `loader` export to both API routes that returns `json({ error: "Method not allowed" }, { status: 405 })`. Alternatively, configure Remix error boundaries to strip stack traces in production.
- **Evidence:**
  ```
  HTTP/1.1 400 Bad Request
  x-remix-error: yes
  {"message":"You made a GET request to \"/api/task-status\" but did not provide a `loader`...","stack":"Error:...at getInternalRouterError..."}
  ```

---

### API — No max length validation on task title allows unbounded input [P2]
- **ID:** API-10
- **Title:** Add max length validation for task title and description fields
- **Area:** API
- **Severity:** P2
- **Steps:**
  1. `curl -X POST http://localhost:5173/tasks/new -d "title=<10,000 character string>&status=todo&priority=medium"`
- **Expected:** 400 response rejecting excessively long input.
- **Actual:** 302 redirect — task created successfully with a 10,000-character title. No upper bound enforced.
- **Suggestion:** In `app/routes/tasks.new.tsx` and `app/routes/tasks.$taskId.tsx`, add validation: `if (title.length > 255) errors.title = "Title must be 255 characters or fewer"`. Also limit description length.
- **Evidence:**
  ```
  POST with 10,000 char title: HTTP/1.1 302 Found, location: /tasks/8
  Task created successfully.
  ```

---

### Backend — Delete and update on non-existent task silently succeed (no error) [P3]
- **ID:** API-11
- **Title:** Return 404 when updating or deleting a non-existent task via route action
- **Area:** Backend
- **Severity:** P3
- **Steps:**
  1. `curl -X POST http://localhost:5173/tasks/99999 -d "intent=delete"` → 302 redirect
  2. `curl -X POST http://localhost:5173/tasks/99999 -d "intent=update&title=Test&status=todo&priority=medium"` → 302 redirect
- **Expected:** 404 Not Found response for non-existent task IDs.
- **Actual:** Both operations return 302 redirect to `/tasks` as if they succeeded. The delete affects 0 rows silently; the update calls `updateTask(99999, ...)` which returns `undefined` (since `getTask` returns undefined), but the route doesn't check the return value.
- **Suggestion:** In `app/routes/tasks.$taskId.tsx` action, check `getTask(taskId)` at the start and return 404 if not found (similar to the loader). For delete, check `deleteTask()` return value.
- **Evidence:**
  ```
  POST /tasks/99999 intent=delete: 302 Found (no error)
  POST /tasks/99999 intent=update: 302 Found (no error)
  ```

---

### API — Empty POST body causes unhandled 500 with TypeError stack trace [P3]
- **ID:** API-12
- **Title:** Handle missing Content-Type header gracefully in API endpoints
- **Area:** API
- **Severity:** P3
- **Steps:**
  1. `curl -X POST http://localhost:5173/api/task-status` (no `-d` flag, no Content-Type)
- **Expected:** 400 Bad Request with `{"error": "Invalid request"}`.
- **Actual:** 500 Internal Server Error with `TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".`
- **Suggestion:** Wrap `request.formData()` in a try-catch in both API route actions to handle malformed or missing request bodies gracefully.
- **Evidence:**
  ```
  HTTP/1.1 500 Internal Server Error
  content-type: text/plain
  TypeError: Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".
  ```

---

## Fix List

| ID | Title | Severity | Area | Suggested ticket summary |
|----|-------|----------|------|--------------------------|
| API-01 | Fix `updateStreak` side-effect that inflates streak on every page load | P0 | Backend | Streak increments on every GET /tasks when lastActiveDate is yesterday; move updateStreak out of getUserStats and update lastActiveDate after increment |
| API-02 | Prevent XP re-award when a completed task is re-opened and re-completed | P0 | Backend | Users can farm unlimited XP by toggling task status between todo and done; track first-completion and guard XP award |
| API-03 | Fix delete button shadowed by hidden `intent=update` field in task detail form | P0 | Backend | Delete button in tasks.$taskId form submits both intent=update (hidden) and intent=delete (button); formData.get returns "update", making delete non-functional |
| API-04 | Validate status enum before DB write in `/api/task-status` and task routes | P1 | API | Invalid status values cause 500 with SQLite CHECK constraint error and stack trace; validate against enum before DB call |
| API-05 | Validate priority enum before DB write in task creation and update routes | P1 | API | Invalid priority values cause 500 with SQLite CHECK constraint error and stack trace; add server-side enum validation |
| API-06 | Validate pomodoro minutes are positive in `/api/pomodoro` | P1 | API | Negative minutes accepted and written to DB, corrupting task and global stats; reject values ≤ 0 |
| API-07 | Check task existence before recording pomodoro time in `/api/pomodoro` | P1 | API | Pomodoro on non-existent taskId silently succeeds and inflates global totalPomodoroMinutes; add existence check |
| API-08 | Prevent multiple `updateStreak` calls during single task completion flow | P2 | Backend | getUserStats→updateStreak called twice during completion (awardXP + checkAchievements), double-incrementing streak |
| API-09 | Add loader to API routes or suppress stack traces in error responses | P2 | API | GET requests to /api/task-status and /api/pomodoro return 400 with full Remix stack trace |
| API-10 | Add max length validation for task title and description fields | P2 | API | No upper bound on title/description length; 10,000-char titles accepted; add max-length validation |
| API-11 | Return 404 when updating or deleting a non-existent task via route action | P3 | Backend | Actions on non-existent task IDs silently succeed with 302 redirect instead of 404 |
| API-12 | Handle missing Content-Type header gracefully in API endpoints | P3 | API | Empty POST without Content-Type header causes 500 TypeError; wrap formData() in try-catch |
