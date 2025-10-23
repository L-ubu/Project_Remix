import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Outlet,
  useLoaderData,
  useSearchParams,
  Form,
} from "@remix-run/react";
import { getAllTasks, getCategories, getTaskStats, getUserStats, getAchievements } from "~/db.server";
import { useState } from "react";
import { ThemeToggle } from "~/components/ThemeToggle";
import { ClientOnly } from "~/components/ClientOnly";
import { FocusMode } from "~/components/FocusMode";
import type { Task } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const view = url.searchParams.get("view") || "list";

  const tasks = getAllTasks({ status, category, search });
  const categories = getCategories();
  const stats = getTaskStats();
  const userStats = getUserStats();
  const achievements = getAchievements();

  return json({ tasks, categories, stats, userStats, achievements, filters: { status, category, search, view } });
}

function getStreakIcon(streak: number): string {
  if (streak >= 30) return "🏆";
  if (streak >= 7) return "⚡";
  if (streak >= 3) return "✓";
  return "○";
}

function getLevelTitle(level: number): string {
  if (level >= 20) return "Master";
  if (level >= 15) return "Expert";
  if (level >= 10) return "Professional";
  if (level >= 5) return "Intermediate";
  return "Beginner";
}

export default function TasksLayout() {
  const { tasks, categories, stats, userStats, achievements, filters } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [showAchievements, setShowAchievements] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const xpToNextLevel = 100 - (userStats.totalXP % 100);
  const levelProgress = (userStats.totalXP % 100);
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  // Group tasks by status for Kanban view
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Focus Mode Panel */}
      {focusTask && (
        <ClientOnly>
          {() => (
            <FocusMode
              task={focusTask}
              onClose={() => setFocusTask(null)}
            />
          )}
        </ClientOnly>
      )}
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                TaskFlow Pro
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Professional Task Management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ClientOnly>
                {() => <ThemeToggle />}
              </ClientOnly>
              <Link
                to="/tasks/new"
                className="btn btn-primary shadow-sm"
              >
                New Task
              </Link>
            </div>
          </div>

          {/* User Stats Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Level {userStats.level}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {getLevelTitle(userStats.level)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                  {userStats.currentStreak} {getStreakIcon(userStats.currentStreak)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Day Streak
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {userStats.totalXP}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Experience Points
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {userStats.tasksCompleted}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Completed
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Progress to Level {userStats.level + 1}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {xpToNextLevel} XP remaining
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                {stats.todo}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">To Do</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {stats.inProgress}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {stats.done}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
          </div>

          {/* Achievements Teaser */}
          {unlockedAchievements.length > 0 && (
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="mt-4 w-full bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {unlockedAchievements.length} Achievement{unlockedAchievements.length !== 1 ? 's' : ''} Unlocked
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    View your progress
                  </div>
                </div>
              </div>
              <span className="text-gray-400">{showAchievements ? '▼' : '▶'}</span>
            </button>
          )}

          {/* Achievements Panel */}
          {showAchievements && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.key}
                    className={`p-4 rounded-lg border ${
                      achievement.unlocked
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50"
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {achievement.unlocked ? "✓" : "○"}
                    </div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {achievement.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {achievement.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Filters */}
          <aside className="col-span-3">
            <div className="card sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filters
              </h2>

              {/* View Mode Toggle */}
              <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Mode</div>
                <div className="flex gap-2">
                  <Link
                    to={`/tasks?view=list${filters.status ? `&status=${filters.status}` : ''}${filters.category ? `&category=${filters.category}` : ''}`}
                    className={`flex-1 text-center py-2 rounded text-sm font-medium transition-colors ${
                      filters.view === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                  >
                    List
                  </Link>
                  <Link
                    to={`/tasks?view=kanban${filters.status ? `&status=${filters.status}` : ''}${filters.category ? `&category=${filters.category}` : ''}`}
                    className={`flex-1 text-center py-2 rounded text-sm font-medium transition-colors ${
                      filters.view === 'kanban' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                  >
                    Board
                  </Link>
                </div>
              </div>

              {/* Search */}
              <Form method="get" className="mb-6">
                <label className="label">Search</label>
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search}
                  placeholder="Search tasks..."
                  className="input text-sm"
                />
                {searchParams.get("status") && (
                  <input type="hidden" name="status" value={searchParams.get("status")!} />
                )}
                {searchParams.get("category") && (
                  <input type="hidden" name="category" value={searchParams.get("category")!} />
                )}
                {searchParams.get("view") && (
                  <input type="hidden" name="view" value={searchParams.get("view")!} />
                )}
                <button type="submit" className="btn btn-primary w-full mt-2 text-sm">
                  Search
                </button>
              </Form>

              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</h3>
                <div className="space-y-1">
                  {[
                    { value: null, label: "All Tasks" },
                    { value: "todo", label: "To Do" },
                    { value: "in-progress", label: "In Progress" },
                    { value: "done", label: "Completed" }
                  ].map((item) => (
                    <Link
                      key={item.value || 'all'}
                      to={`/tasks${item.value ? `?status=${item.value}` : ''}${filters.category ? `&category=${filters.category}` : ''}${filters.search ? `&search=${filters.search}` : ''}${filters.view ? `&view=${filters.view}` : ''}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.status === item.value
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</h3>
                  <div className="space-y-1">
                    <Link
                      to={`/tasks${filters.status ? `?status=${filters.status}` : ''}${filters.search ? `&search=${filters.search}` : ''}${filters.view ? `&view=${filters.view}` : ''}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        !filters.category
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      All Categories
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        to={`/tasks?category=${cat}${filters.status ? `&status=${filters.status}` : ''}${filters.search ? `&search=${filters.search}` : ''}${filters.view ? `&view=${filters.view}` : ''}`}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          filters.category === cat
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-9">
            {tasks.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4 opacity-50">○</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No tasks found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {filters.status || filters.category || filters.search
                    ? "Try adjusting your filters"
                    : "Create your first task to get started"}
                </p>
                <Link to="/tasks/new" className="btn btn-primary">
                  Create Task
                </Link>
              </div>
            ) : filters.view === 'kanban' ? (
              // Kanban View
              <div className="grid grid-cols-3 gap-4">
                {[
                  { status: 'todo', label: 'To Do', tasks: todoTasks },
                  { status: 'in-progress', label: 'In Progress', tasks: inProgressTasks },
                  { status: 'done', label: 'Completed', tasks: doneTasks }
                ].map((column) => (
                  <div key={column.status} className="flex flex-col">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                        <span>{column.label}</span>
                        <span className={`badge badge-${column.status} text-xs`}>
                          {column.tasks.length}
                        </span>
                      </h3>
                    </div>
                    <div className="space-y-3 flex-1">
                      {column.tasks.map((task) => (
                        <div key={task.id} className="card hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow group">
                          <Link
                            to={`/tasks/${task.id}`}
                            className="block"
                          >
                            <div className="flex items-start gap-3">
                              {task.emoji !== '📝' && <span className="text-xl">{task.emoji}</span>}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  <span className={`badge badge-${task.priority} text-xs`}>
                                    {task.priority}
                                  </span>
                                  {task.category && (
                                    <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
                                      {task.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                          {/* Quick Actions */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setFocusTask(task);
                              }}
                              className="w-full py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Start Focus Mode
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < Math.floor(Date.now() / 1000) && task.status !== 'done';
                  
                  return (
                    <div
                      key={task.id}
                      className={`card hover:shadow-md dark:hover:shadow-gray-900/50 transition-all group ${
                        isOverdue ? 'border-l-4 border-l-red-500 dark:border-l-red-600' : ''
                      }`}
                    >
                      <Link
                        to={`/tasks/${task.id}`}
                        className="block"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {task.emoji !== '📝' && <span className="text-2xl">{task.emoji}</span>}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                {task.title}
                                {isOverdue && <span className="badge bg-red-500 text-white text-xs">Overdue</span>}
                              </h3>
                              {task.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`badge badge-${task.status} text-xs`}>
                                  {task.status === "in-progress" ? "In Progress" : task.status === "todo" ? "To Do" : "Done"}
                                </span>
                                <span className={`badge badge-${task.priority} text-xs`}>
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                                {task.category && (
                                  <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
                                    {task.category}
                                  </span>
                                )}
                                {task.estimatedMinutes && (
                                  <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                                    {task.estimatedMinutes}m
                                  </span>
                                )}
                                {task.pomodoroCount > 0 && (
                                  <span className="badge bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs">
                                    {task.pomodoroCount} sessions
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                            {task.dueDate && (
                              <div className={isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                                {new Date(task.dueDate * 1000).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Quick Actions - Only show on hover */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setFocusTask(task);
                          }}
                          className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          🎯 Focus Mode
                        </button>
                        {task.status !== 'done' && (
                          <Form method="post" action="/api/task-status" className="flex gap-2" reloadDocument>
                            <input type="hidden" name="taskId" value={task.id} />
                            <input type="hidden" name="returnTo" value="/tasks" />
                            {task.status === 'todo' && (
                              <button
                                type="submit"
                                name="status"
                                value="in-progress"
                                className="px-4 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                Start
                              </button>
                            )}
                            <button
                              type="submit"
                              name="status"
                              value="done"
                              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              ✓ Done
                            </button>
                          </Form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
