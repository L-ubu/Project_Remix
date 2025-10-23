import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { getTask } from "~/db.server";
import { useState, useEffect } from "react";

export async function loader({ params }: LoaderFunctionArgs) {
  const taskId = Number(params.taskId);
  const task = getTask(taskId);

  if (!task) {
    throw new Response("Task not found", { status: 404 });
  }

  return json({ task });
}

export default function FocusWindow() {
  const { task } = useLoaderData<typeof loader>();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const fetcher = useFetcher();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            playNotification();
            
            if (!isBreak) {
              fetcher.submit(
                { intent: "pomodoro", taskId: task.id.toString(), minutes: "25" },
                { method: "post", action: "/api/pomodoro" }
              );
            }
            
            if (!isBreak) {
              setIsBreak(true);
              setMinutes(5);
            } else {
              setIsBreak(false);
              setMinutes(25);
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, isBreak, task.id, fetcher]);

  const playNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(isBreak ? "Break time over!" : "Pomodoro complete!", {
        body: isBreak ? "Time to get back to work!" : `Great work on: ${task.title}`,
      });
    }
  };

  const toggle = () => {
    if (!isActive && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsActive(!isActive);
  };

  const handleComplete = () => {
    fetcher.submit(
      { taskId: task.id.toString(), status: "done" },
      { method: "post", action: "/api/task-status" }
    );
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  const progress = ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Focus Mode - {task.title}</title>
        <link rel="stylesheet" href="/build/_assets/tailwind.css" />
        <style>{`
          body { margin: 0; padding: 0; }
        `}</style>
      </head>
      <body className="bg-white dark:bg-gray-800">
        <div className="p-4 space-y-4 max-w-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-lg flex items-center justify-between -m-4 mb-4">
            <div className="font-semibold flex items-center gap-2">
              <span>🎯</span>
              <span>Focus Mode</span>
            </div>
            <button
              onClick={() => window.close()}
              className="text-white hover:text-gray-200 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Task Title */}
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Task</div>
            <div className="font-semibold text-gray-900 dark:text-white text-base">
              {task.title}
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className={`text-6xl font-bold ${isBreak ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {isBreak ? "Break Time" : "Focus Time"}
            </div>
            {/* Progress Bar */}
            <div className="mt-4 mx-6">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isBreak ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={toggle}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isActive ? "⏸ Pause" : "▶ Start"}
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setMinutes(25);
                setSeconds(0);
                setIsBreak(false);
              }}
              className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              🔄
            </button>
          </div>

          {/* Task Status */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick Status</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetcher.submit(
                    { taskId: task.id.toString(), status: "in-progress" },
                    { method: "post", action: "/api/task-status" }
                  );
                }}
                disabled={task.status === "in-progress"}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  task.status === "in-progress"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                In Progress
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2 rounded font-medium bg-green-600 text-white hover:bg-green-700"
              >
                ✓ Complete
              </button>
            </div>
          </div>

          {/* Task Info */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Sessions: {task.pomodoroCount}</span>
              <span>Time: {task.actualMinutes}m</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

