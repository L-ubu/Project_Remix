# QA Report — TaskQuest Pro (Frontend) — 2026-03-18 / cursor/full-qa-run-602f

## Summary
- Total findings: 25 (P0: 2, P1: 4, P2: 12, P3: 7)
- Areas: Frontend
- Storybook: Not available (skipped)
- Visual testing: Performed at 320px, 768px, 1280px viewports + dark mode

## Findings

---

### Frontend — Fix null-safe crash in list view when task has null priority [P0]
- **ID:** FE-01
- **Area:** Frontend
- **Severity:** P0 (Critical)
- **Steps:**
  1. Insert a task with a NULL priority into the database (or allow creation of one via missing validation).
  2. Navigate to `/tasks` (list view).
  3. The page crashes with "Cannot read properties of null (reading 'charAt')".
- **Expected:** The page renders gracefully, showing a fallback for tasks with missing priority.
- **Actual:** The entire `/tasks` layout crashes and shows the ErrorBoundary, blocking access to all task management features (list view, new task, edit task).
- **Suggestion:** In `app/routes/tasks.tsx` line 474, add a null guard: `{task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'None'}`. Also add null guards on line 471 for `task.status`. Consider adding NOT NULL validation on task creation.
- **Evidence:** See screenshots: `tasks_list_1280px_desktop.png`, `tasks_list_768px_tablet.png`, `tasks_new_320px_mobile.png` — all show the crash.

---

### Frontend — Remove error.stack exposure from ErrorBoundary [P0]
- **ID:** FE-02
- **Area:** Frontend / Security
- **Severity:** P0 (Critical)
- **Steps:**
  1. Trigger any unhandled error (e.g., FE-01 above).
  2. Observe the ErrorBoundary page.
- **Expected:** A user-friendly error message without technical details.
- **Actual:** Full stack trace including server file paths (`/workspace/app/routes/tasks.tsx:474:50`), framework internals, and node_modules paths is displayed to the user.
- **Suggestion:** In `app/root.tsx` lines 60–62, remove the `<pre>{error.stack}</pre>` block. In production, only show a generic "Something went wrong" message. Optionally log the stack trace server-side.
- **Evidence:** See screenshots: `tasks_list_1280px_desktop.png` — stack trace fully visible on page.

---

### Frontend — Add responsive breakpoints to sidebar/main grid layout [P1]
- **ID:** FE-03
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:**
  1. Open `/tasks?view=kanban` at 320px viewport width.
  2. Observe the sidebar and main content layout.
- **Expected:** Sidebar collapses or stacks above main content on mobile.
- **Actual:** Sidebar (`col-span-3`) and main content (`col-span-9`) remain side-by-side in a 12-column grid, making both areas unreadably narrow.
- **Suggestion:** In `app/routes/tasks.tsx`, change the grid layout to responsive: sidebar should be `col-span-12 md:col-span-3` and main should be `col-span-12 md:col-span-9`. Consider a collapsible sidebar on mobile.
- **Evidence:** See screenshot: `tasks_kanban_320px_mobile.png` — sidebar and kanban columns squeezed.

---

### Frontend — Add responsive breakpoints to Kanban grid [P1]
- **ID:** FE-04
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:**
  1. Open `/tasks?view=kanban` at 320px viewport width.
  2. Observe the three Kanban columns.
- **Expected:** Kanban columns stack vertically on mobile.
- **Actual:** Three columns (`grid-cols-3`) are crammed side-by-side, making task cards unreadable.
- **Suggestion:** In `app/routes/tasks.tsx` line 375, change `grid grid-cols-3` to `grid grid-cols-1 md:grid-cols-3`.
- **Evidence:** See screenshot: `tasks_kanban_320px_mobile.png`.

---

### Frontend — Add responsive breakpoints to quick stats grid [P1]
- **ID:** FE-05
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:**
  1. Open `/tasks` at 320px viewport width (requires FE-01 fix to see).
  2. Observe the quick stats row (Total Tasks, To Do, In Progress, Completed).
- **Expected:** Stats wrap to 2 columns on mobile.
- **Actual:** All 4 stat cards are forced into a single row via `grid-cols-4` with no responsive variant (unlike the user stats section above which correctly uses `grid-cols-2 md:grid-cols-4`).
- **Suggestion:** In `app/routes/tasks.tsx` line 158, change `grid grid-cols-4` to `grid grid-cols-2 md:grid-cols-4`.
- **Evidence:** Code inspection; visual confirmation blocked by FE-01 crash on list view.

---

### Frontend — Fix delete button intent conflict with hidden update field [P1]
- **ID:** FE-06
- **Area:** Frontend
- **Severity:** P1 (High)
- **Steps:**
  1. Open any task detail page (`/tasks/:id`).
  2. Click "Delete Task".
  3. Observe the form submission behavior.
- **Expected:** The task is deleted.
- **Actual:** The form contains `<input type="hidden" name="intent" value="update" />` (line 127) AND the delete button has `name="intent" value="delete"` (line 313). Both values are submitted. `formData.get("intent")` returns the first occurrence in DOM order (the hidden field's "update"), so the delete intent may be silently ignored and an update is attempted instead, which can fail or produce unexpected behavior.
- **Suggestion:** Remove the hidden `intent` field from `app/routes/tasks.$taskId.tsx` line 127, and rely solely on the submit buttons' `name="intent" value="update"` (line 330) and `name="intent" value="delete"` (line 313) to set the intent. Alternatively, separate the delete action into its own `<Form>`.
- **Evidence:** Code inspection of `app/routes/tasks.$taskId.tsx` lines 126–127 and 311–318.

---

### Frontend — Fix PomodoroTimer heading missing dark mode text color [P2]
- **ID:** FE-07
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Enable dark mode.
  2. Open a task detail page and click "Show Timer".
  3. Observe the Pomodoro Timer heading.
- **Expected:** Heading text is white/light on dark background.
- **Actual:** Heading "Pomodoro Timer" uses hardcoded `text-gray-900` (line 112 of `PomodoroTimer.tsx`) with no `dark:text-white` variant, making it nearly invisible on a dark card background.
- **Suggestion:** In `app/components/PomodoroTimer.tsx` line 112, change `text-gray-900` to `text-gray-900 dark:text-white`.
- **Evidence:** Code inspection of `app/components/PomodoroTimer.tsx` line 112.

---

### Frontend — Add dark mode variants to all badge CSS classes [P2]
- **ID:** FE-08
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Enable dark mode.
  2. View tasks in kanban or list view.
  3. Observe status/priority/category badges.
- **Expected:** Badges have dark-mode-appropriate colors.
- **Actual:** All badge classes (`badge-todo`, `badge-in-progress`, `badge-done`, `badge-low`, `badge-medium`, `badge-high`) in `app/tailwind.css` lines 48–70 only define light-mode colors (e.g., `bg-gray-100 text-gray-800`). In dark mode, they appear as bright light rectangles on dark cards.
- **Suggestion:** Add dark variants to each badge class. Example: `.badge-todo { @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300; }`.
- **Evidence:** Code inspection of `app/tailwind.css` lines 48–70.

---

### Frontend — Add dark mode variants to btn-secondary [P2]
- **ID:** FE-09
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Enable dark mode.
  2. Open any modal (task edit or new task).
  3. Observe the "Cancel" button.
- **Expected:** Button has dark-mode-appropriate colors.
- **Actual:** `.btn-secondary` in `app/tailwind.css` line 22 uses `bg-gray-200 text-gray-700 hover:bg-gray-300` with no dark variants. Buttons appear as light gray blocks on dark modal backgrounds.
- **Suggestion:** Change to `@apply bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500;`.
- **Evidence:** Code inspection of `app/tailwind.css` line 22.

---

### Frontend — Fix filter links producing malformed URLs [P2]
- **ID:** FE-10
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Navigate to `/tasks` with a category filter active (e.g., `?category=Design`).
  2. Click "All Tasks" in the Status filter.
  3. Observe the generated URL.
- **Expected:** URL is `/tasks?category=Design&view=list`.
- **Actual:** URL is `/tasks&category=Design&view=list` — missing the `?` prefix. The `&` becomes part of the pathname. The same issue occurs in the "All Categories" link when there's no status but a search or view param is active.
- **Suggestion:** In `app/routes/tasks.tsx`, use `URLSearchParams` to build filter URLs instead of manual string concatenation. This prevents malformed query strings.
- **Evidence:** Code inspection of `app/routes/tasks.tsx` lines 307–309 (status filter) and lines 327–328 (category filter).

---

### Frontend — View mode toggle loses search param [P2]
- **ID:** FE-11
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Search for a task (e.g., "deploy").
  2. Switch from List view to Board view using the toggle.
  3. Observe whether the search query is preserved.
- **Expected:** Search query is preserved when switching views.
- **Actual:** The view mode toggle URLs (lines 251–261) include `status` and `category` but NOT `search`. The search query is silently dropped.
- **Suggestion:** In `app/routes/tasks.tsx` lines 251 and 261, add `${filters.search ? \`&search=${filters.search}\` : ''}` to the Link `to` prop.
- **Evidence:** Code inspection of `app/routes/tasks.tsx` lines 251–261.

---

### Frontend — Fix focus window hardcoded CSS path for Vite [P2]
- **ID:** FE-12
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Open any task and click "Start Focus Mode" then the pop-out button (⧉).
  2. Observe the pop-out focus window.
- **Expected:** The pop-out window renders with full Tailwind styling.
- **Actual:** `app/routes/focus.$taskId.tsx` line 99 hardcodes `<link rel="stylesheet" href="/build/_assets/tailwind.css" />`. This is a Remix/webpack-era path. With Vite, assets are served from `/assets/` with hashed filenames. The stylesheet will 404 and the window renders unstyled.
- **Suggestion:** Use Remix's `<Links />` component from `@remix-run/react` to dynamically resolve the correct stylesheet URL, or import the stylesheet using the `links` export function as done in `root.tsx`.
- **Evidence:** Code inspection of `app/routes/focus.$taskId.tsx` line 99 vs. `app/root.tsx` lines 12–16.

---

### Frontend — Replace direct DOM manipulation in emoji pickers with React state [P2]
- **ID:** FE-13
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Open the edit task modal.
  2. Click different emoji options.
  3. Observe internal state management.
- **Expected:** Emoji selection is managed via React state.
- **Actual:** In `app/routes/tasks.$taskId.tsx` lines 140–147, the emoji picker uses `document.getElementById('emoji')` and `querySelectorAll('button')` to directly manipulate DOM values and CSS classes. Similarly in `app/routes/tasks.new.tsx` lines 71–74 for templates. This bypasses React's reconciliation, can lead to stale state, and is an anti-pattern.
- **Suggestion:** Use `useState` for the selected emoji (as already done in `tasks.new.tsx` with `selectedEmoji`), and control the hidden input value via React state. Remove all `document.getElementById` and `querySelectorAll` calls.
- **Evidence:** Code inspection of `app/routes/tasks.$taskId.tsx` lines 140–147 and `app/routes/tasks.new.tsx` lines 71–74.

---

### Frontend — Add responsive breakpoints to edit task modal inner grid [P2]
- **ID:** FE-14
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Open any task detail page at 320px viewport width.
  2. Observe the modal content layout.
- **Expected:** Modal content stacks vertically on mobile.
- **Actual:** The edit modal uses `max-w-6xl` (1152px) outer width and `grid grid-cols-2` (line 123 of `tasks.$taskId.tsx`) for the inner layout with no responsive variant. At mobile widths, the two columns are extremely narrow. The Pomodoro timer column and form column are squeezed side-by-side.
- **Suggestion:** Change `grid grid-cols-2` to `grid grid-cols-1 lg:grid-cols-2` in `app/routes/tasks.$taskId.tsx` line 123.
- **Evidence:** Code inspection of `app/routes/tasks.$taskId.tsx` lines 107, 123.

---

### Frontend — Add Escape key handler to close modals [P2]
- **ID:** FE-15
- **Area:** Frontend / Accessibility
- **Severity:** P2 (Medium)
- **Steps:**
  1. Open the edit task or new task modal.
  2. Press the Escape key.
- **Expected:** The modal closes.
- **Actual:** Nothing happens. Modals can only be closed by clicking the × button or Cancel button.
- **Suggestion:** Add a `useEffect` with a `keydown` event listener for `Escape` in both `app/routes/tasks.$taskId.tsx` and `app/routes/tasks.new.tsx` that calls `navigate("/tasks")`.
- **Evidence:** Code inspection — no keyboard event handlers in either modal component.

---

### Frontend — Add backdrop click to close modals [P2]
- **ID:** FE-16
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Open the edit task or new task modal.
  2. Click the dark overlay backdrop area.
- **Expected:** The modal closes.
- **Actual:** Nothing happens. The backdrop overlay div has no onClick handler.
- **Suggestion:** Add `onClick={() => navigate("/tasks")}` to the backdrop div in both modal routes, with `e.stopPropagation()` on the inner modal content to prevent close when clicking inside.
- **Evidence:** Code inspection of `app/routes/tasks.$taskId.tsx` line 106 and `app/routes/tasks.new.tsx` line 78.

---

### Frontend — Add ARIA dialog attributes to modals [P2]
- **ID:** FE-17
- **Area:** Frontend / Accessibility
- **Severity:** P2 (Medium)
- **Steps:**
  1. Open the edit task or new task modal.
  2. Inspect with a screen reader or accessibility audit tool.
- **Expected:** Modal is announced as a dialog with a label.
- **Actual:** Modal overlay divs lack `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes. Screen readers cannot identify the modal context.
- **Suggestion:** Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-title"` to the modal container div, and add `id="modal-title"` to the heading element. Implement a focus trap.
- **Evidence:** Code inspection of `app/routes/tasks.$taskId.tsx` line 106 and `app/routes/tasks.new.tsx` line 78.

---

### Frontend — Add dark mode support to root ErrorBoundary [P2]
- **ID:** FE-18
- **Area:** Frontend
- **Severity:** P2 (Medium)
- **Steps:**
  1. Enable dark mode.
  2. Trigger an error.
  3. Observe the error page appearance.
- **Expected:** Error page respects dark mode theme.
- **Actual:** ErrorBoundary in `app/root.tsx` uses hardcoded light-mode classes: `bg-gray-50` (line 44), `text-gray-900` (lines 49, 56, 66), `bg-gray-100` (line 60). In dark mode, a bright white error page appears against the dark UI.
- **Suggestion:** Add dark mode variants: `bg-gray-50 dark:bg-gray-900`, `text-gray-900 dark:text-white`, etc. Also applies to the `.card` class used.
- **Evidence:** See screenshot: `tasks_dark_mode_desktop.png` — dark mode error page has light-colored `<pre>` background against a dark overall theme.

---

### Frontend — Make hover-only quick actions accessible on touch devices [P3]
- **ID:** FE-19
- **Area:** Frontend / Accessibility
- **Severity:** P3 (Low)
- **Steps:**
  1. Open `/tasks` on a touch device (or simulate touch in DevTools).
  2. Try to access "Focus Mode", "Start", or "Done" quick actions on task cards.
- **Expected:** Quick actions are accessible via tap or always visible on mobile.
- **Actual:** Quick action buttons use `opacity-0 group-hover:opacity-100` (lines 422, 505 in `tasks.tsx`). On touch devices without hover, these buttons are permanently invisible and inaccessible.
- **Suggestion:** Make actions always visible on mobile: add `group-focus-within:opacity-100` or use `sm:opacity-0 sm:group-hover:opacity-100` (keep visible on small screens).
- **Evidence:** Code inspection of `app/routes/tasks.tsx` lines 422, 505.

---

### Frontend — Add aria-labels to icon-only buttons [P3]
- **ID:** FE-20
- **Area:** Frontend / Accessibility
- **Severity:** P3 (Low)
- **Steps:**
  1. Use a screen reader to navigate the modal or focus mode panel.
  2. Navigate to the × close button, ⧉ pop-out button, or 🔄 reset button.
- **Expected:** Screen reader announces the purpose of each button.
- **Actual:** Close buttons (×), pop-out button (⧉), and reset button (🔄) lack `aria-label` attributes. Screen readers announce them as empty or with the symbol character only.
- **Suggestion:** Add `aria-label="Close"`, `aria-label="Open in new window"`, `aria-label="Reset timer"` respectively.
- **Evidence:** Code inspection of `app/routes/tasks.$taskId.tsx` line 114, `app/routes/tasks.new.tsx` line 90, `app/components/FocusMode.tsx` lines 143, 149, `app/components/PomodoroTimer.tsx` line 173.

---

### Frontend — Make FocusMode draggable panel keyboard accessible [P3]
- **ID:** FE-21
- **Area:** Frontend / Accessibility
- **Severity:** P3 (Low)
- **Steps:**
  1. Activate Focus Mode for a task.
  2. Try to reposition the floating panel using only the keyboard.
- **Expected:** Panel can be repositioned or at least used via keyboard.
- **Actual:** Drag behavior only uses mouse events (`onMouseDown`, `mousemove`, `mouseup`). No keyboard support exists. The panel itself also lacks focus management — it doesn't trap focus or announce itself.
- **Suggestion:** Add keyboard event handlers for arrow keys to reposition, and add `tabIndex={0}` and `role="dialog"` to the panel.
- **Evidence:** Code inspection of `app/components/FocusMode.tsx` lines 75–107.

---

### Frontend — Add dark mode hover variant to emoji picker buttons [P3]
- **ID:** FE-22
- **Area:** Frontend
- **Severity:** P3 (Low)
- **Steps:**
  1. Enable dark mode.
  2. Open the edit task modal.
  3. Hover over emoji options.
- **Expected:** Hover shows a dark-appropriate background.
- **Actual:** Emoji buttons use `hover:bg-gray-100` without a dark variant. In dark mode, hovering produces a jarring bright flash.
- **Suggestion:** In `app/routes/tasks.$taskId.tsx` line 149 and `app/routes/tasks.new.tsx` line 151, add `dark:hover:bg-gray-700`.
- **Evidence:** Code inspection.

---

### Frontend — Add dark mode variant to emoji picker selected state [P3]
- **ID:** FE-23
- **Area:** Frontend
- **Severity:** P3 (Low)
- **Steps:**
  1. Enable dark mode.
  2. Open the edit task modal.
  3. Observe the currently selected emoji's background.
- **Expected:** Selected emoji has a dark-mode-appropriate highlight.
- **Actual:** Selected emoji uses `bg-purple-50` (line 150 of `tasks.$taskId.tsx`) without a dark variant. The light purple background looks out of place on dark cards.
- **Suggestion:** Add `dark:bg-purple-900/20` to the selected emoji class.
- **Evidence:** Code inspection of `app/routes/tasks.$taskId.tsx` line 150 and `app/routes/tasks.new.tsx` line 152.

---

### Frontend — Add responsive breakpoints to quick template grid [P3]
- **ID:** FE-24
- **Area:** Frontend
- **Severity:** P3 (Low)
- **Steps:**
  1. Open `/tasks/new` at 320px viewport width (requires FE-01 fix).
  2. Observe the Quick Templates section.
- **Expected:** Template cards stack or wrap on mobile.
- **Actual:** Template grid uses `grid grid-cols-3 gap-3` (line 115 of `tasks.new.tsx`) with no responsive variant.
- **Suggestion:** Change to `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3`.
- **Evidence:** Code inspection of `app/routes/tasks.new.tsx` line 115.

---

### Frontend — Check color contrast on badge-low [P3]
- **ID:** FE-25
- **Area:** Frontend / Accessibility
- **Severity:** P3 (Low)
- **Steps:**
  1. View a task with "low" priority.
  2. Check the contrast ratio of the priority badge text.
- **Expected:** Text meets WCAG AA contrast ratio (4.5:1 for normal text).
- **Actual:** `badge-low` class uses `text-gray-600` (#4B5563) on `bg-gray-100` (#F3F4F6). Contrast ratio is approximately 4.3:1, slightly below the 4.5:1 WCAG AA threshold.
- **Suggestion:** Change `text-gray-600` to `text-gray-700` (#374151) for a contrast ratio above 5:1.
- **Evidence:** Code inspection of `app/tailwind.css` line 64.

---

## Fix List

| ID | Title | Severity | Area | Suggested ticket summary |
|----|-------|----------|------|--------------------------|
| FE-01 | Fix null-safe crash on task.priority in list view | P0 | Frontend | List view crashes when task has null priority; add null guards to tasks.tsx line 474 |
| FE-02 | Remove error.stack exposure from ErrorBoundary | P0 | Security | ErrorBoundary in root.tsx exposes full stack traces to users; remove <pre>{error.stack}</pre> |
| FE-03 | Add responsive breakpoints to sidebar/main grid | P1 | Frontend | Sidebar col-span-3 and main col-span-9 have no responsive breakpoints; layout breaks on mobile |
| FE-04 | Add responsive breakpoints to Kanban grid | P1 | Frontend | Kanban uses grid-cols-3 with no responsive variant; columns unreadable on mobile |
| FE-05 | Add responsive breakpoints to quick stats grid | P1 | Frontend | Quick stats uses grid-cols-4 unlike user stats which has responsive grid-cols-2 md:grid-cols-4 |
| FE-06 | Fix delete button intent conflict with hidden field | P1 | Frontend | Delete button's intent value may be overridden by hidden update intent field in same form |
| FE-07 | Fix PomodoroTimer heading dark mode text color | P2 | Frontend | PomodoroTimer heading uses hardcoded text-gray-900 without dark:text-white |
| FE-08 | Add dark mode variants to badge CSS classes | P2 | Frontend | All badge classes (todo, in-progress, done, low, medium, high) lack dark mode colors |
| FE-09 | Add dark mode variants to btn-secondary | P2 | Frontend | btn-secondary uses light-only bg-gray-200 text-gray-700 with no dark variants |
| FE-10 | Fix malformed URLs in filter links | P2 | Frontend | Filter links use string concatenation producing URLs like /tasks&category=X (missing ?) |
| FE-11 | Preserve search param in view mode toggle | P2 | Frontend | Switching list/board view drops the active search query |
| FE-12 | Fix focus window hardcoded CSS path for Vite | P2 | Frontend | focus.$taskId.tsx uses /build/_assets/tailwind.css which doesn't exist in Vite builds |
| FE-13 | Replace DOM manipulation in emoji pickers with React state | P2 | Frontend | Emoji picker uses document.getElementById instead of React state management |
| FE-14 | Add responsive grid to edit task modal | P2 | Frontend | Edit modal inner grid-cols-2 has no responsive variant; unusable on mobile |
| FE-15 | Add Escape key handler to close modals | P2 | Frontend | Modals cannot be closed with Escape key |
| FE-16 | Add backdrop click to close modals | P2 | Frontend | Clicking dark overlay does not close modal |
| FE-17 | Add ARIA dialog attributes to modals | P2 | Frontend | Modals lack role="dialog", aria-modal, aria-labelledby |
| FE-18 | Add dark mode support to root ErrorBoundary | P2 | Frontend | ErrorBoundary uses hardcoded light-mode classes; bright white page in dark mode |
| FE-19 | Make hover-only quick actions accessible on touch | P3 | Frontend | Quick action buttons invisible on touch devices due to opacity-0 + group-hover |
| FE-20 | Add aria-labels to icon-only buttons | P3 | Frontend | Close ×, pop-out ⧉, reset 🔄 buttons lack aria-label |
| FE-21 | Make FocusMode panel keyboard accessible | P3 | Frontend | Draggable panel uses mouse-only events; no keyboard support |
| FE-22 | Add dark mode hover to emoji picker buttons | P3 | Frontend | Emoji hover:bg-gray-100 causes bright flash in dark mode |
| FE-23 | Add dark mode selected state to emoji picker | P3 | Frontend | Selected emoji bg-purple-50 looks out of place in dark mode |
| FE-24 | Add responsive breakpoints to template grid | P3 | Frontend | Quick Templates grid-cols-3 not responsive |
| FE-25 | Check color contrast on badge-low | P3 | Frontend | badge-low text-gray-600 on bg-gray-100 may fail WCAG AA 4.5:1 contrast |

## Videos / recordings
- Screenshots captured at 320px, 768px, 1280px viewports: `/opt/cursor/artifacts/tasks_*.png`
- Dark mode screenshot: `/opt/cursor/artifacts/tasks_dark_mode_desktop.png`
