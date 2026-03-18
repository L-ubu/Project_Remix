# Fix List — TaskFlow Pro — 2026-03-18

| ID | Title | Severity | Area | Suggested ticket summary |
|----|-------|----------|------|--------------------------|
| FE-01 | Fix null-safe crash on task.priority in list view | P0 | Frontend | List view crashes with TypeError when task has null priority; add null guards to `tasks.tsx:474` and null coalescing for status/priority |
| FE-02 | Remove error.stack exposure from ErrorBoundary | P0 | Security | ErrorBoundary in `root.tsx` exposes full stack traces to users including server paths; remove `<pre>{error.stack}</pre>` |
| API-01 | Fix updateStreak side-effect inflating streak on every page load | P0 | Backend | `updateStreak()` runs on every `getUserStats()` call (every GET /tasks); streak increments unboundedly when lastActiveDate is yesterday; move out of read path |
| API-02 | Prevent XP farming via task status toggle | P0 | Backend | Users can farm unlimited XP by toggling task todo→done→todo→done; track first completion, guard XP award |
| API-03 | Fix delete button shadowed by hidden intent=update field | P0 | Backend | Delete button in task detail form is non-functional; hidden `intent=update` overrides `intent=delete`; remove hidden field |
| E2E-01 | Fix null-guard on task.priority/status in task list | P0 | E2E | App crashes when task has NULL status/priority; add null guards and NOT NULL schema constraints |
| FE-03 | Add responsive breakpoints to sidebar/main grid | P1 | Frontend | Sidebar col-span-3 and main col-span-9 have no responsive breakpoints; layout breaks on mobile |
| FE-04 | Add responsive breakpoints to Kanban grid | P1 | Frontend | Kanban grid-cols-3 with no responsive variant; columns unreadable on mobile |
| FE-05 | Add responsive breakpoints to quick stats grid | P1 | Frontend | Quick stats grid-cols-4 has no responsive variant unlike user stats section |
| FE-06 | Fix delete button intent conflict with hidden field | P1 | Frontend | Delete button intent overridden by hidden update intent field in same form |
| API-04 | Validate status enum before DB write | P1 | API | Invalid status causes 500 with SQLite CHECK constraint error and stack trace; validate against enum |
| API-05 | Validate priority enum before DB write | P1 | API | Invalid priority causes 500 with stack trace; add server-side enum validation |
| API-06 | Validate pomodoro minutes are positive | P1 | API | Negative minutes accepted and corrupt stats; reject values ≤ 0 |
| API-07 | Check task existence before recording pomodoro | P1 | API | Pomodoro on non-existent taskId inflates global stats; add existence check |
| E2E-02 | Add confirmation dialog before deleting a task | P1 | E2E | Delete button removes task without confirmation; add confirm dialog |
| E2E-03 | Quick stats bar does not reflect active filters | P1 | E2E | Quick stats show totals even when filtered; show filtered context |
| FE-07 | Fix PomodoroTimer heading dark mode text color | P2 | Frontend | Heading uses hardcoded text-gray-900 without dark:text-white |
| FE-08 | Add dark mode variants to badge CSS classes | P2 | Frontend | All badge classes lack dark mode colors |
| FE-09 | Add dark mode variants to btn-secondary | P2 | Frontend | btn-secondary uses light-only colors with no dark variants |
| FE-10 | Fix malformed URLs in filter links | P2 | Frontend | String concatenation produces URLs like /tasks&category=X (missing ?) |
| FE-11 | Preserve search param in view mode toggle | P2 | Frontend | Switching list/board view drops active search query |
| FE-12 | Fix focus window hardcoded CSS path for Vite | P2 | Frontend | focus.$taskId.tsx uses /build/_assets/tailwind.css which 404s in Vite |
| FE-13 | Replace DOM manipulation in emoji pickers with React state | P2 | Frontend | Emoji picker uses document.getElementById instead of React state |
| FE-14 | Add responsive grid to edit task modal | P2 | Frontend | Edit modal grid-cols-2 not responsive; unusable on mobile |
| FE-15 | Add Escape key handler to close modals | P2 | Accessibility | Modals cannot be closed with Escape key |
| FE-16 | Add backdrop click to close modals | P2 | Frontend | Clicking dark overlay does not close modal |
| FE-17 | Add ARIA dialog attributes to modals | P2 | Accessibility | Modals lack role="dialog", aria-modal, aria-labelledby |
| FE-18 | Add dark mode support to ErrorBoundary | P2 | Frontend | ErrorBoundary uses hardcoded light-mode classes |
| API-08 | Prevent double streak increment during completion | P2 | Backend | getUserStats→updateStreak called twice during completion, double-incrementing |
| API-09 | Add loader to API routes, suppress stack traces | P2 | API | GET to API routes returns 400 with full Remix stack trace |
| API-10 | Add max length validation for title/description | P2 | API | No upper bound; 10,000-char titles accepted |
| E2E-04 | Add missing favicon.ico | P2 | E2E | Missing favicon causes 404 console error |
| E2E-05 | Add NOT NULL DB constraints for status/priority | P2 | E2E | Schema allows NULL for required fields |
| E2E-06 | Hide Focus Mode for completed tasks | P2 | E2E | Focus Mode button appears on done tasks |
| FE-19 | Make hover-only quick actions accessible on touch | P3 | Accessibility | Quick action buttons invisible on touch devices |
| FE-20 | Add aria-labels to icon-only buttons | P3 | Accessibility | Close ×, pop-out ⧉, reset 🔄 buttons lack aria-label |
| FE-21 | Make FocusMode panel keyboard accessible | P3 | Accessibility | Draggable panel uses mouse-only events |
| FE-22 | Add dark mode hover to emoji picker buttons | P3 | Frontend | hover:bg-gray-100 causes bright flash in dark mode |
| FE-23 | Add dark mode selected state to emoji picker | P3 | Frontend | Selected bg-purple-50 looks out of place in dark mode |
| FE-24 | Add responsive breakpoints to template grid | P3 | Frontend | Template grid-cols-3 not responsive |
| FE-25 | Check color contrast on badge-low | P3 | Accessibility | badge-low may fail WCAG AA 4.5:1 contrast |
| API-11 | Return 404 for actions on non-existent tasks | P3 | Backend | Actions on non-existent IDs silently succeed with 302 |
| API-12 | Handle missing Content-Type gracefully | P3 | API | Empty POST causes 500 TypeError |
| E2E-07 | Emoji picker lacks keyboard accessibility | P3 | Accessibility | Emoji picker not keyboard-navigable |
