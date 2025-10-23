import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { ClientOnly } from "~/components/ClientOnly";
import { getTask, updateTask, deleteTask } from "~/db.server";
import { PomodoroTimer } from "~/components/PomodoroTimer";
import { useState, useEffect } from "react";
import { Confetti } from "~/components/Confetti.client";

export async function loader({ params }: LoaderFunctionArgs) {
  const taskId = Number(params.taskId);
  const task = getTask(taskId);

  if (!task) {
    throw new Response("Task not found", { status: 404 });
  }

  return json({ task });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const taskId = Number(params.taskId);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    deleteTask(taskId);
    return redirect("/tasks");
  }

  if (intent === "update") {
    const title = formData.get("title");
    const description = formData.get("description");
    const status = formData.get("status");
    const priority = formData.get("priority");
    const category = formData.get("category");
    const emoji = formData.get("emoji");
    const estimatedMinutes = formData.get("estimatedMinutes");
    const dueDate = formData.get("dueDate");

    if (typeof title !== "string" || title.length === 0) {
      return json({ error: "Title is required" }, { status: 400 });
    }

    const task = getTask(taskId);
    const wasCompleted = task?.status === "done";
    const isNowCompleted = status === "done";

    updateTask(taskId, {
      title,
      description: description as string,
      status: status as "todo" | "in-progress" | "done",
      priority: priority as "low" | "medium" | "high",
      category: category as string,
      emoji: emoji as string,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes as string) : null,
      dueDate: dueDate ? Math.floor(new Date(dueDate as string).getTime() / 1000) : null,
    });

    // Return with confetti flag if task was just completed
    if (!wasCompleted && isNowCompleted) {
      return json({ success: true, celebrate: true });
    }

    return redirect("/tasks");
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

const EMOJI_OPTIONS = ["📝", "🚀", "💡", "🎯", "🔥", "⚡", "🎨", "📚", "💪", "🌟", "🎮", "🍅", "✨", "🎵", "🏃", "🧘", "🎬", "🍕", "☕", "🌈"];

export default function TaskDetail() {
  const { task } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showTimer, setShowTimer] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Show confetti when task is completed
  useEffect(() => {
    // This is a simple way to detect completion - in production you'd use action data
    if (task.status === "done" && task.completedAt) {
      const completedRecently = (Date.now() / 1000) - task.completedAt < 5;
      if (completedRecently) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 3000);
      }
    }
  }, [task]);

  const dueDateValue = task.dueDate
    ? new Date(task.dueDate * 1000).toISOString().split('T')[0]
    : '';

  return (
    <>
      <ClientOnly>{() => <Confetti trigger={celebrate} />}</ClientOnly>
      
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {task.emoji !== '📝' && <span className="text-3xl">{task.emoji}</span>}
                Edit Task
              </h2>
              <button
                onClick={() => navigate("/tasks")}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Column - Task Details Form */}
            <div>
              <Form method="post">
                <input type="hidden" name="intent" value="update" />

                <div className="space-y-6">
                  {/* Emoji Picker */}
                  <div>
                    <label htmlFor="emoji" className="label">
                      Task Icon (Optional)
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={(event) => {
                            const input = document.getElementById('emoji') as HTMLInputElement;
                            if (input) input.value = e;
                            // Update visual selection
                            event.currentTarget.parentElement?.querySelectorAll('button').forEach(btn => {
                              btn.classList.remove('ring-2', 'ring-purple-500');
                            });
                            event.currentTarget.classList.add('ring-2', 'ring-purple-500');
                          }}
                          className={`text-2xl p-2 rounded-lg hover:bg-gray-100 transition-all ${
                            task.emoji === e ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <input
                      type="hidden"
                      id="emoji"
                      name="emoji"
                      defaultValue={task.emoji}
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="label">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      defaultValue={task.title}
                      required
                      className="input"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      defaultValue={task.description || ""}
                      rows={4}
                      className="input"
                      placeholder="Add more details..."
                    />
                  </div>

                  {/* Status & Priority Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="label">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={task.status}
                        className="input"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="label">
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        defaultValue={task.priority}
                        className="input"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="label">
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      defaultValue={task.category || ""}
                      placeholder="e.g., Development, Design, Personal"
                      className="input"
                    />
                  </div>

                  {/* Time & Due Date Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="estimatedMinutes" className="label">
                        Estimated Time (minutes)
                      </label>
                      <input
                        type="number"
                        id="estimatedMinutes"
                        name="estimatedMinutes"
                        defaultValue={task.estimatedMinutes || ""}
                        placeholder="25"
                        min="1"
                        className="input"
                      />
                    </div>

                    <div>
                      <label htmlFor="dueDate" className="label">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        defaultValue={dueDateValue}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Task Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Created:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{new Date(task.createdAt * 1000).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{new Date(task.updatedAt * 1000).toLocaleString()}</div>
                      </div>
                      {task.actualMinutes > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Time Spent:</span>
                          <div className="font-medium text-blue-600 dark:text-blue-400">{task.actualMinutes} minutes</div>
                        </div>
                      )}
                      {task.pomodoroCount > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Pomodoro Sessions:</span>
                          <div className="font-medium text-indigo-600 dark:text-indigo-400">{task.pomodoroCount} sessions</div>
                        </div>
                      )}
                      {task.completedAt && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                          <div className="font-medium text-green-600 dark:text-green-400">{new Date(task.completedAt * 1000).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="submit"
                      name="intent"
                      value="delete"
                      className="btn btn-danger"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Deleting..." : "Delete Task"}
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => navigate("/tasks")}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        name="intent"
                        value="update"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </Form>
            </div>

            {/* Right Column - Pomodoro Timer */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Focus Timer</h3>
                <button
                  onClick={() => setShowTimer(!showTimer)}
                  className="btn btn-secondary btn-sm"
                >
                  {showTimer ? "Hide Timer" : "Show Timer"}
                </button>
              </div>

              {showTimer && (
                <PomodoroTimer taskId={task.id} taskTitle={task.title} />
              )}

              {/* Quick Tips */}
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Productivity Tips
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Break large tasks into smaller, manageable chunks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Use Pomodoro timer for focused 25-minute work sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>High priority tasks earn more XP when completed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Complete tasks before due date for bonus XP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Build daily streaks for consistent progress</span>
                  </li>
                </ul>
              </div>

              {/* XP Preview */}
              <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Experience Points
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Base XP:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">+10 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Priority Bonus:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      +{task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5} XP
                    </span>
                  </div>
                  {task.description && task.description.length > 50 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Detailed Task:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">+5 XP</span>
                    </div>
                  )}
                  {task.dueDate && task.dueDate >= Math.floor(Date.now() / 1000) && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">On-time Completion:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">+20 XP</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between text-base">
                      <span className="font-semibold text-gray-900 dark:text-white">Total Potential:</span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        +{
                          10 + 
                          (task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5) +
                          (task.description && task.description.length > 50 ? 5 : 0) +
                          (task.dueDate && task.dueDate >= Math.floor(Date.now() / 1000) ? 20 : 0)
                        } XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full mx-4 p-8 text-center shadow-2xl">
        <div className="text-6xl mb-4 opacity-50">!</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Task Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The task you're looking for doesn't exist or has been deleted.
        </p>
        <button onClick={() => navigate("/tasks")} className="btn btn-primary">
          Back to Tasks
        </button>
      </div>
    </div>
  );
}
