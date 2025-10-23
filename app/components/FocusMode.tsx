import { useState, useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import type { Task } from "~/db.server";

interface FocusModeProps {
  task: Task;
  onClose: () => void;
}

export function FocusMode({ task, onClose }: FocusModeProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const fetcher = useFetcher();
  const panelRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const progress = ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100;

  return (
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-blue-500 dark:border-blue-600"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '300px',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="font-semibold text-sm flex items-center gap-2">
          <span>🎯</span>
          <span>Focus Mode</span>
        </div>
        <div className="no-drag flex items-center gap-2">
          <button
            onClick={() => {
              const width = 400;
              const height = 600;
              const left = window.screen.width - width - 50;
              const top = 50;
              window.open(
                `/focus/${task.id}`,
                'focus-mode',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
              );
              onClose();
            }}
            className="text-white hover:text-gray-200 text-sm"
            title="Pop out to separate window"
          >
            ⧉
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Task Title */}
        <div className="no-drag">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Task</div>
          <div className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm">
            {task.title}
          </div>
        </div>

        {/* Timer Display */}
        <div className="no-drag text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className={`text-4xl font-bold ${isBreak ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {isBreak ? "Break Time" : "Focus Time"}
          </div>
          {/* Progress Bar */}
          <div className="mt-3 mx-4">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isBreak ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="no-drag flex gap-2">
          <button
            onClick={toggle}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
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
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-sm"
          >
            🔄
          </button>
        </div>

        {/* Task Status */}
        <div className="no-drag pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick Status</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                fetcher.submit(
                  { taskId: task.id.toString(), status: "in-progress", returnTo: "/tasks" },
                  { method: "post", action: "/api/task-status" }
                );
              }}
              disabled={task.status === "in-progress"}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                task.status === "in-progress"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => {
                fetcher.submit(
                  { taskId: task.id.toString(), status: "done", returnTo: "/tasks" },
                  { method: "post", action: "/api/task-status" }
                );
                setTimeout(() => onClose(), 500);
              }}
              className="flex-1 py-1.5 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700"
            >
              ✓ Complete
            </button>
          </div>
        </div>

        {/* Task Info */}
        <div className="no-drag pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Sessions: {task.pomodoroCount}</span>
            <span>Time: {task.actualMinutes}m</span>
          </div>
        </div>
      </div>

      {/* Drag Indicator */}
      <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400 text-xs opacity-50">
        ⋮⋮
      </div>
    </div>
  );
}

