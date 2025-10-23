# ✨ Quick Start Guide - TaskQuest Pro

Get your gamified task manager running in 3 simple steps!

## Step 1: Install Dependencies

```bash
npm install
```

This installs all necessary packages including Remix, TypeScript, Tailwind CSS, SQLite, and canvas-confetti for celebrations! 🎉

## Step 2: Start Development Server

```bash
npm run dev
```

The app will start on [http://localhost:5173](http://localhost:5173)

**Note**: If you see any module errors on first start, just stop the server (Ctrl+C) and run `npm run dev` again!

## Step 3: Start Leveling Up! 🚀

The database will automatically create and seed with sample tasks. Start exploring!

## 🎮 What to Try First

### 1. Explore Your Stats
- Check your **Level** and **XP** at the top
- See your **daily streak** counter
- View **task statistics** dashboard

### 2. View Sample Tasks
- Browse the pre-loaded sample tasks
- Try switching between **List** and **Kanban** views
- Click on any task to see details

### 3. Create Your First Task
- Click **"⚡ Quick Add Task"**
- Try a **quick template** for fast creation
- Pick a fun **emoji icon** 🎨
- Set a **due date** for bonus XP!

### 4. Use the Pomodoro Timer 🍅
- Open any task
- Click **"Show Timer"**
- Start a 25-minute focus session
- Watch your time automatically tracked

### 5. Complete a Task for XP
- Edit any task
- Change status to **"✅ Done"**
- Watch your **XP increase**!
- See **confetti celebration** 🎉
- Check if you **leveled up**!

### 6. Try Filtering & Search
- Filter by **status** (To Do, In Progress, Done)
- Filter by **category**
- Use the **search box** to find tasks
- Notice the **URL changes** - share these links!

### 7. View Your Achievements
- Click the **achievements banner** (if you have any)
- See which badges you've **unlocked** 🏆
- Check requirements for **locked achievements**

## 🎯 Understanding the XP System

### How to Earn XP
Every completed task gives you XP:

| Action | XP Earned |
|--------|-----------|
| 📝 Complete any task | +10 XP |
| 💤 Low priority task | +5 XP |
| ⚡ Medium priority task | +10 XP |
| 🔥 High priority task | +15 XP |
| 📄 Detailed description (50+ chars) | +5 XP |
| ⏰ Complete before due date | +20 XP |

**Example**: A high-priority task with a detailed description completed on time = **50 XP total!**

### Leveling Up
- Every **100 XP** = 1 level
- Progress bar shows XP to next level
- Your title upgrades as you level up:
  - Level 1-4: Novice Planner
  - Level 5-9: Skilled Tasker
  - Level 10-14: Expert Organizer
  - Level 15-19: Master Planner
  - Level 20+: Legendary Achiever

## 🔥 Building Streaks

Complete tasks daily to build your streak:
- Complete any task each day to continue your streak
- Your streak shows in the stats dashboard
- Longer streaks = more 🔥 fire emojis!
- Track your **longest streak** ever

## 🍅 Mastering the Pomodoro Timer

The Pomodoro Technique for focus:

1. **Start**: Click "▶ Start" on the timer
2. **Work**: Focus for 25 minutes
3. **Break**: Take a 5-minute break
4. **Repeat**: Continue for multiple sessions
5. **Track**: Time automatically saved to task

**Benefits**:
- Improved focus and concentration
- Reduced burnout
- Better time estimates
- Visible progress tracking

## 📊 View Modes Explained

### List View 📄
- Traditional task list
- Rich details for each task
- Emoji icons and badges
- Overdue indicators
- Perfect for detailed task management

### Kanban Board 📊
- Visual column-based view
- Organized by status:
  - 📝 To Do
  - ⚡ In Progress
  - ✅ Done
- Quick overview of workflow
- Great for visual thinkers

Switch views anytime with the toggle buttons!

## 🏆 Achievement Guide

Work towards these badges:

| Achievement | Requirement | Tip |
|------------|-------------|-----|
| 🏅 Getting Started | Complete 1 task | Mark any task as done! |
| 🔥 On a Roll | 3-day streak | Complete tasks 3 days in a row |
| 💪 Dedicated | 7-day streak | Build a weekly habit |
| ⭐ Leveling Up | Reach level 5 | Complete ~13 medium priority tasks |
| 🎯 Productive | Complete 10 tasks | Keep completing tasks! |
| 🍅 Focused Mind | 10 hours Pomodoro | Use the timer regularly |

## ⚡ Quick Tips & Tricks

### For Maximum XP:
1. Create **high-priority tasks** (+15 XP each)
2. Write **detailed descriptions** (+5 XP bonus)
3. Set **due dates** and complete early (+20 XP bonus)
4. Build **daily streaks**

### For Better Productivity:
1. Use **Pomodoro timer** for focus
2. Break large tasks into **smaller ones**
3. Organize with **categories**
4. Set **realistic time estimates**
5. Check tasks daily to **maintain streak**

### For Organization:
1. Use **emojis** for quick visual identification
2. **Color-coded priorities** for importance
3. **Category filters** to focus on specific areas
4. **Kanban view** for workflow overview
5. **Search** to find tasks quickly

## 🐛 Troubleshooting

### Port Already in Use
Vite will automatically use the next available port (check the console output).

### Database Errors
If you see database errors:
```bash
# Delete the database and restart
rm tasks.db
npm run dev
```

### Module Not Found
Ensure all dependencies are installed:
```bash
npm install
```

### Vite CJS Warning
The CJS warning is expected and doesn't affect functionality. The app works perfectly!

## 🎨 Customization Ideas

Make it your own:
- Change the **emoji options** in task creation
- Modify **XP values** in `db.server.ts`
- Add new **achievements**
- Create new **quick templates**
- Adjust **Pomodoro timer** duration
- Customize **Tailwind colors**
- Add your own **task categories**

## 📱 Development Commands

```bash
# Development
npm run dev          # Start with hot module reload

# Production
npm run build        # Build optimized bundle
npm run start        # Run production server

# Type Checking
npm run typecheck    # Verify TypeScript types
```

## 🎓 Learning Path

1. **Start Simple**: Create and complete tasks
2. **Explore Features**: Try Pomodoro, filters, views
3. **Build Habits**: Maintain daily streaks
4. **Level Up**: Focus on high-XP tasks
5. **Unlock All**: Complete all achievements!
6. **Customize**: Modify code to your liking
7. **Share**: Show friends your productivity tool!

## 🚀 Next Steps

1. Complete your first task to earn XP
2. Try the Pomodoro timer
3. Build a 3-day streak
4. Reach level 5
5. Unlock all achievements
6. Explore the codebase to learn Remix

## 📚 Code Exploration

Want to understand how it works?

**Start here**:
1. `app/routes/tasks.tsx` - Main layout with gamification UI
2. `app/db.server.ts` - Database schema and XP logic
3. `app/components/PomodoroTimer.tsx` - Focus timer
4. `app/routes/tasks.$taskId.tsx` - Task editing
5. `app/routes/tasks.new.tsx` - Task creation

**Key concepts**:
- Remix loaders for data fetching
- Actions for form handling
- Nested routing for modals
- SQLite for data persistence
- Gamification algorithms

## 💡 Pro Tips from Power Users

1. **Morning Routine**: Check tasks first thing, plan your day
2. **Batch Similar**: Group tasks by category for efficiency
3. **Time Block**: Use Pomodoro for deep work
4. **Daily Review**: Complete tasks daily for streak
5. **Weekly Planning**: Set due dates for the week ahead
6. **Template Power**: Create custom templates for common tasks
7. **Priority Focus**: Tackle high-priority tasks first

## 🎉 Have Fun!

Remember: This isn't just a task manager, it's a **productivity game**! 

- Earn XP by getting things done
- Level up and unlock achievements
- Build streaks to stay motivated
- Celebrate with confetti! 🎊

Now go forth and conquer your to-do list! 🚀

---

**Questions?** Check out the [full README](./README.md) for more details!
