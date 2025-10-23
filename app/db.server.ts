import Database from "better-sqlite3";
import { join } from "path";

// Create database connection
const db = new Database(join(process.cwd(), "tasks.db"));

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    category TEXT,
    emoji TEXT DEFAULT '📝',
    estimatedMinutes INTEGER,
    actualMinutes INTEGER DEFAULT 0,
    pomodoroCount INTEGER DEFAULT 0,
    dueDate INTEGER,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    completedAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    totalXP INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    currentStreak INTEGER DEFAULT 0,
    longestStreak INTEGER DEFAULT 0,
    lastActiveDate INTEGER,
    tasksCompleted INTEGER DEFAULT 0,
    totalPomodoroMinutes INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    unlockedAt INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_category ON tasks(category);
  CREATE INDEX IF NOT EXISTS idx_dueDate ON tasks(dueDate);

  -- Initialize user stats if not exists
  INSERT OR IGNORE INTO user_stats (id) VALUES (1);
`);

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  category: string | null;
  emoji: string;
  estimatedMinutes: number | null;
  actualMinutes: number;
  pomodoroCount: number;
  dueDate: number | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface UserStats {
  id: number;
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: number | null;
  tasksCompleted: number;
  totalPomodoroMinutes: number;
}

export interface Achievement {
  id: number;
  key: string;
  unlockedAt: number;
}

export type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt" | "actualMinutes" | "pomodoroCount">;

// Get all tasks with optional filters
export function getAllTasks(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Task[] {
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params: any[] = [];

  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  if (filters?.category) {
    query += " AND category = ?";
    params.push(filters.category);
  }

  if (filters?.search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam);
  }

  query += " ORDER BY createdAt DESC";

  return db.prepare(query).all(...params) as Task[];
}

// Get a single task by ID
export function getTask(id: number): Task | undefined {
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
    | Task
    | undefined;
}

// Create a new task
export function createTask(task: NewTask): Task {
  const result = db
    .prepare(
      `
    INSERT INTO tasks (title, description, status, priority, category, emoji, estimatedMinutes, dueDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      task.title,
      task.description,
      task.status,
      task.priority,
      task.category,
      task.emoji,
      task.estimatedMinutes,
      task.dueDate
    );

  return getTask(result.lastInsertRowid as number)!;
}

// Update a task
export function updateTask(
  id: number,
  task: Partial<NewTask> & { actualMinutes?: number; pomodoroCount?: number }
): Task | undefined {
  const current = getTask(id);
  if (!current) return undefined;

  const updated = { ...current, ...task };
  const wasCompleted = current.status === "done";
  const isNowCompleted = updated.status === "done";

  // If task is being marked as done, award XP and update streak
  if (!wasCompleted && isNowCompleted) {
    const xpGained = calculateXP(updated);
    awardXP(xpGained);
    updated.completedAt = Math.floor(Date.now() / 1000);
  }

  db.prepare(
    `
    UPDATE tasks
    SET title = ?, description = ?, status = ?, priority = ?, category = ?, emoji = ?,
        estimatedMinutes = ?, actualMinutes = ?, pomodoroCount = ?, dueDate = ?,
        completedAt = ?, updatedAt = strftime('%s', 'now')
    WHERE id = ?
  `
  ).run(
    updated.title,
    updated.description,
    updated.status,
    updated.priority,
    updated.category,
    updated.emoji,
    updated.estimatedMinutes,
    updated.actualMinutes || 0,
    updated.pomodoroCount || 0,
    updated.dueDate,
    updated.completedAt,
    id
  );

  return getTask(id);
}

// Calculate XP based on task properties
function calculateXP(task: Task): number {
  let xp = 10; // Base XP

  // Priority bonus
  if (task.priority === "high") xp += 15;
  else if (task.priority === "medium") xp += 10;
  else xp += 5;

  // Completion time bonus (if completed before due date)
  if (task.dueDate && task.completedAt) {
    if (task.completedAt <= task.dueDate) {
      xp += 20; // On-time bonus
    }
  }

  // Description bonus (more detailed tasks)
  if (task.description && task.description.length > 50) {
    xp += 5;
  }

  return xp;
}

// Delete a task
export function deleteTask(id: number): boolean {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return result.changes > 0;
}

// Get all unique categories
export function getCategories(): string[] {
  const result = db
    .prepare("SELECT DISTINCT category FROM tasks WHERE category IS NOT NULL")
    .all() as { category: string }[];
  return result.map((r) => r.category);
}

// Get task statistics
export function getTaskStats() {
  const stats = db
    .prepare(
      `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
    FROM tasks
  `
    )
    .get() as {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };

  return stats;
}

// User Stats functions
export function getUserStats(): UserStats {
  const stats = db.prepare("SELECT * FROM user_stats WHERE id = 1").get() as UserStats;
  updateStreak(stats);
  return stats;
}

function updateStreak(stats: UserStats) {
  const today = Math.floor(Date.now() / 1000 / 86400); // Days since epoch
  const lastActive = stats.lastActiveDate ? Math.floor(stats.lastActiveDate / 86400) : null;

  if (!lastActive) return;

  if (today - lastActive === 1) {
    // Continue streak
    db.prepare("UPDATE user_stats SET currentStreak = currentStreak + 1 WHERE id = 1").run();
  } else if (today - lastActive > 1) {
    // Streak broken
    db.prepare("UPDATE user_stats SET currentStreak = 0 WHERE id = 1").run();
  }
}

export function awardXP(xp: number) {
  const stats = getUserStats();
  const newXP = stats.totalXP + xp;
  const newLevel = Math.floor(newXP / 100) + 1; // Level up every 100 XP
  
  db.prepare(`
    UPDATE user_stats 
    SET totalXP = ?, level = ?, tasksCompleted = tasksCompleted + 1,
        lastActiveDate = strftime('%s', 'now'),
        currentStreak = CASE 
          WHEN date(lastActiveDate, 'unixepoch') = date('now', '-1 day') THEN currentStreak + 1
          WHEN date(lastActiveDate, 'unixepoch') < date('now', '-1 day') THEN 1
          ELSE currentStreak 
        END,
        longestStreak = CASE 
          WHEN currentStreak + 1 > longestStreak THEN currentStreak + 1
          ELSE longestStreak 
        END
    WHERE id = 1
  `).run(newXP, newLevel);

  checkAchievements();
}

export function addPomodoroTime(taskId: number, minutes: number) {
  db.prepare(`
    UPDATE tasks 
    SET actualMinutes = actualMinutes + ?, pomodoroCount = pomodoroCount + 1 
    WHERE id = ?
  `).run(minutes, taskId);

  db.prepare(`
    UPDATE user_stats 
    SET totalPomodoroMinutes = totalPomodoroMinutes + ?
    WHERE id = 1
  `).run(minutes);
}

// Achievement definitions
const ACHIEVEMENTS = [
  { key: "first_task", name: "Getting Started", description: "Complete your first task", condition: (stats: UserStats) => stats.tasksCompleted >= 1 },
  { key: "streak_3", name: "On a Roll", description: "Maintain a 3-day streak", condition: (stats: UserStats) => stats.currentStreak >= 3 },
  { key: "streak_7", name: "Dedicated", description: "Maintain a 7-day streak", condition: (stats: UserStats) => stats.currentStreak >= 7 },
  { key: "level_5", name: "Leveling Up", description: "Reach level 5", condition: (stats: UserStats) => stats.level >= 5 },
  { key: "tasks_10", name: "Productive", description: "Complete 10 tasks", condition: (stats: UserStats) => stats.tasksCompleted >= 10 },
  { key: "pomodoro_10", name: "Focused Mind", description: "Complete 10 hours of Pomodoro", condition: (stats: UserStats) => stats.totalPomodoroMinutes >= 600 },
];

export function checkAchievements() {
  const stats = getUserStats();
  
  ACHIEVEMENTS.forEach(achievement => {
    if (achievement.condition(stats)) {
      const existing = db.prepare("SELECT * FROM achievements WHERE key = ?").get(achievement.key);
      if (!existing) {
        db.prepare("INSERT INTO achievements (key, unlockedAt) VALUES (?, strftime('%s', 'now'))").run(achievement.key);
      }
    }
  });
}

export function getAchievements() {
  const unlocked = db.prepare("SELECT * FROM achievements").all() as Achievement[];
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked.some(u => u.key === a.key),
    unlockedAt: unlocked.find(u => u.key === a.key)?.unlockedAt,
  }));
}

// Seed database with sample data if empty
export function seedDatabase() {
  const count = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as {
    count: number;
  };

  if (count.count === 0) {
    const sampleTasks: NewTask[] = [
      {
        title: "Build awesome Remix app",
        description: "Create a gamified task manager with cool features!",
        status: "in-progress",
        priority: "high",
        category: "Development",
        emoji: "🚀",
        estimatedMinutes: 120,
        dueDate: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
      },
      {
        title: "Complete Pomodoro session",
        description: "Focus on important work for 25 minutes",
        status: "todo",
        priority: "high",
        category: "Productivity",
        emoji: "🍅",
        estimatedMinutes: 25,
        dueDate: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      },
      {
        title: "Design beautiful UI",
        description: "Create an engaging and fun interface",
        status: "in-progress",
        priority: "high",
        category: "Design",
        emoji: "🎨",
        estimatedMinutes: 90,
        dueDate: null,
      },
      {
        title: "Add gamification features",
        description: "XP, levels, achievements, and streaks",
        status: "todo",
        priority: "medium",
        category: "Development",
        emoji: "🎮",
        estimatedMinutes: 180,
        dueDate: Math.floor(Date.now() / 1000) + 172800, // 2 days
      },
      {
        title: "Write tests",
        description: "Ensure everything works perfectly",
        status: "todo",
        priority: "medium",
        category: "Testing",
        emoji: "✅",
        estimatedMinutes: 60,
        dueDate: null,
      },
      {
        title: "Deploy to production",
        description: "Share this awesome app with the world!",
        status: "todo",
        priority: "low",
        category: "DevOps",
        emoji: "🌐",
        estimatedMinutes: 30,
        dueDate: null,
      },
    ];

    sampleTasks.forEach((task) => createTask(task));
  }
}

