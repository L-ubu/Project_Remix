import { useFetcher } from "@remix-run/react";
import { useEffect, useState, useRef } from "react";

interface PomodoroTimerProps {
  taskId: number;
  taskTitle: string;
}

export function PomodoroTimer({ taskId, taskTitle }: PomodoroTimerProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const fetcher = useFetcher();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer complete!
            setIsActive(false);
            playNotification();
            
            if (!isBreak) {
              // Work session complete - save time
              fetcher.submit(
                { intent: "pomodoro", taskId: taskId.toString(), minutes: "25" },
                { method: "post", action: "/api/pomodoro" }
              );
              setSessionsCompleted(prev => prev + 1);
            }
            
            // Switch between work and break
            if (!isBreak) {
              setIsBreak(true);
              setMinutes(5); // 5 minute break
            } else {
              setIsBreak(false);
              setMinutes(25); // 25 minute work session
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
  }, [isActive, minutes, seconds, isBreak, taskId, fetcher]);

  const playNotification = () => {
    // Play browser notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore if audio can't play
      });
    }
    
    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(isBreak ? "Break time over!" : "Pomodoro complete!", {
        body: isBreak ? "Time to get back to work!" : `Great work on: ${taskTitle}`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍅</text></svg>",
      });
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const toggle = () => {
    if (!isActive) {
      requestNotificationPermission();
    }
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
    setIsBreak(false);
  };

  const skipBreak = () => {
    setIsBreak(false);
    setMinutes(25);
    setSeconds(0);
    setIsActive(false);
  };

  const progress = ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100;

  return (
    <div className="card">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKbh8LVkHQU5ktbx0HssBSN2yPLajzsKFF+y6OyrWRQLRp/h8bxsIQUqgc/y2ogzCBppu+/mnE4MDk+l4fC1ZB0FOJLW8c98LQUidc3y2ZA8ChRfsOfrrFoVDEaf4PG8aiEFKoHO8tmIMwgaaLvv5ZxPDA5PpuHwtmQcBTiS1vLPfC0FInXN8tmQOwoUX7Dn7KxbFQxGn+Dxu2ohBSqBzvLZiDQIGmi77+WcTgwOT6bh8LVkHAU4ktbyz30tBSJ1zfLZkDsKFF+w5+yrWxUMRp/g8bxqIQUqgc/y2YgzCBpou+/lnE8MDlCl4PG1ZBwFOJLW8tB8LQUidc3y2ZA7ChRfsOfsq1sVDEaf4PG8aiEFKoHP8tiJMwgaaLzv5ZxPDA5Qp+LwtmQcBTiS1/LPfC0FInXN8tmQOwoUX7Dn7KxbFQxGn+Dxu2ohBSqBz/LYiTMIGmi77+WcTwwOUKfi8LZkHAU4ktfyz3wtBSJ1zfLZkDsKFF+w5+yrWxUMRp/g8btqIQUqgc/y2IkzCBpou+/lnE8MDlCn4vC2ZBwFOJLX8s98LQUidc3y2ZA7ChRfsOfsq1sVDEaf4PG7aiEFKoHP8tiJMwgaaLvv5ZxPDA5Qp+LwtmQcBTiS1/LPfC0FInXO8tmQOwoUX7Dn7KtbFQxGn+Dxu2ohBSqBz/LYiTMIGmi77+WcTwwOUKfi8LZkHAU4ktfyz3wtBSJ1zvLZkDsKFF+w5+yrWxUMRp/g8btqIQUqgc/y2IkzCBpou+/lnE8MDlCn4vC2ZBwFOJLX8s98LQUidc7y2ZA7ChRfsOfsq1sVDEaf4PG7aiEFKoHP8tiJMwgaaLvv5ZxPDA5Qp+LwtmQcBTiS1/LPfC0FInXO8tmQOwoUX7Dn7KtbFQxGn+Dxu2ohBSqBz/LYiTMIGmi77+WcTwwOUKfi8LZkHAU4ktfyz3wtBSJ1zvLZkDsKFF+w5+yrWxUMRp/g8btqIQUqgc/y2IkzCBpou+/lnE8MDlCn4vC2ZBwFOJLX8s98LQUidc7y2ZA7ChRfsOfsq1sVDEaf4PG7aiEFKoHP8tiJMwgaaLvv5ZxPDA5Qp+LwtmQcBTiS1/LPfC0FInXO8tmQOwoUX7Dn7KtbFQxGn+Dxu2ohBSqBz/LYiTMIGmi77+WcTwwOUKfi8LZkHAU4ktfyz3wtBSJ1zvLZkDsKFF+w5+yrWxUMRp/g8btqIQU=" />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🍅</span>
          Pomodoro Timer
        </h3>
        {sessionsCompleted > 0 && (
          <div className="badge badge-success">
            {sessionsCompleted} session{sessionsCompleted > 1 ? 's' : ''} completed
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <div className="text-sm font-medium text-gray-600 mb-2">
          {isBreak ? "🧘 Break Time" : `🎯 Working on: ${taskTitle}`}
        </div>
        
        {/* Circular Progress */}
        <div className="relative inline-flex items-center justify-center">
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={552}
              strokeDashoffset={552 - (552 * progress) / 100}
              className={isBreak ? "text-green-500" : "text-red-500"}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute">
            <div className={`text-5xl font-bold ${isBreak ? "text-green-600" : "text-red-600"}`}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {isBreak ? "Relax" : "Focus"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggle}
          className={`btn flex-1 ${isActive ? "btn-secondary" : "btn-primary"}`}
        >
          {isActive ? "⏸ Pause" : "▶ Start"}
        </button>
        <button onClick={reset} className="btn btn-secondary">
          🔄 Reset
        </button>
        {isBreak && (
          <button onClick={skipBreak} className="btn btn-secondary">
            ⏭ Skip Break
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        💡 Tip: Take short breaks to stay productive!
      </div>
    </div>
  );
}

