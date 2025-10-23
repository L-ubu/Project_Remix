import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { createTask } from "~/db.server";
import { useState } from "react";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const status = formData.get("status");
  const priority = formData.get("priority");
  const category = formData.get("category");
  const emoji = formData.get("emoji");
  const estimatedMinutes = formData.get("estimatedMinutes");
  const dueDate = formData.get("dueDate");

  // Validation
  const errors: Record<string, string> = {};

  if (typeof title !== "string" || title.length === 0) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  const task = createTask({
    title: title as string,
    description: description as string,
    status: (status as "todo" | "in-progress" | "done") || "todo",
    priority: (priority as "low" | "medium" | "high") || "medium",
    category: category as string,
    emoji: emoji as string || "📝",
    estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes as string) : null,
    dueDate: dueDate ? Math.floor(new Date(dueDate as string).getTime() / 1000) : null,
  });

  return redirect(`/tasks/${task.id}`);
}

const EMOJI_OPTIONS = ["📝", "🚀", "💡", "🎯", "🔥", "⚡", "🎨", "📚", "💪", "🌟", "🎮", "🍅", "✨", "🎵", "🏃", "🧘", "🎬", "🍕", "☕", "🌈"];

const QUICK_TEMPLATES = [
  { name: "Quick Task", emoji: "⚡", estimatedMinutes: 15, category: "Quick Wins" },
  { name: "Deep Work", emoji: "🧠", estimatedMinutes: 120, category: "Focus" },
  { name: "Meeting", emoji: "👥", estimatedMinutes: 60, category: "Meetings" },
  { name: "Learning", emoji: "📚", estimatedMinutes: 45, category: "Learning" },
  { name: "Exercise", emoji: "🏃", estimatedMinutes: 30, category: "Health" },
  { name: "Creative Work", emoji: "🎨", estimatedMinutes: 90, category: "Creative" },
];

export default function NewTask() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedEmoji, setSelectedEmoji] = useState("📝");
  const [showTemplates, setShowTemplates] = useState(true);

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setSelectedEmoji(template.emoji);
    (document.getElementById("emoji") as HTMLInputElement).value = template.emoji;
    (document.getElementById("category") as HTMLInputElement).value = template.category;
    (document.getElementById("estimatedMinutes") as HTMLInputElement).value = template.estimatedMinutes.toString();
    setShowTemplates(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Task
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete tasks to earn experience and level up
              </p>
            </div>
            <button
              onClick={() => navigate("/tasks")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <Form method="post" className="p-6">
          {/* Quick Templates */}
          {showTemplates && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Quick Templates
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTemplates(false)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Skip →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-600"
                  >
                    <div className="text-2xl mb-1">{template.emoji}</div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {template.estimatedMinutes}min • {template.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    onClick={() => {
                      setSelectedEmoji(e);
                      (document.getElementById("emoji") as HTMLInputElement).value = e;
                    }}
                    className={`text-2xl p-2 rounded-lg hover:bg-gray-100 transition-all ${
                      selectedEmoji === e ? 'ring-2 ring-purple-500 bg-purple-50' : ''
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
                defaultValue={selectedEmoji}
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
                required
                placeholder="What do you want to accomplish?"
                className="input"
                autoFocus
                aria-invalid={actionData?.errors?.title ? true : undefined}
                aria-describedby={
                  actionData?.errors?.title ? "title-error" : undefined
                }
              />
              {actionData?.errors?.title && (
                <p id="title-error" className="mt-2 text-sm text-red-600">
                  {actionData.errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Add more details..."
                className="input"
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Tip: Detailed descriptions (50+ characters) earn +5 bonus XP
              </p>
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
                  defaultValue="todo"
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
                  defaultValue="medium"
                  className="input"
                >
                  <option value="low">Low (+5 XP)</option>
                  <option value="medium">Medium (+10 XP)</option>
                  <option value="high">High (+15 XP)</option>
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
                placeholder="e.g., Development, Design, Personal"
                className="input"
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Organize tasks by project or type
              </p>
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
                  placeholder="25"
                  min="1"
                  className="input"
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Pomodoro sessions are 25 minutes
                </p>
              </div>

              <div>
                <label htmlFor="dueDate" className="label">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  On-time completion earns +20 bonus XP
                </p>
              </div>
            </div>

            {/* XP Preview */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Experience Points</h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span>Base task completion: <strong>+10 XP</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span>Priority bonus: <strong>+5 to +15 XP</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span>Detailed description: <strong>+5 XP</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span>On-time completion: <strong>+20 XP</strong></span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/tasks")}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
