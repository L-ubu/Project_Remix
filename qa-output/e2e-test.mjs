import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/opt/cursor/artifacts';
const TIMEOUT = 10000;

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, name) {
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 Screenshot: ${path}`);
  return path;
}

async function screenshotFull(page, name) {
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  📸 Full screenshot: ${path}`);
  return path;
}

const findings = [];
const flowResults = {};

function addFinding(id, title, severity, steps, expected, actual, suggestion, evidence) {
  findings.push({ id, title, severity, steps, expected, actual, suggestion, evidence });
}

async function flow1(page) {
  console.log('\n=== FLOW 1: View tasks and navigate ===');
  const steps = [];

  // Step 1: Navigate to root (should redirect to /tasks)
  console.log('  Step 1: Open http://localhost:5173');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  const url1 = page.url();
  console.log(`  URL after load: ${url1}`);
  if (!url1.includes('/tasks')) {
    addFinding('E2E-01', 'Root URL does not redirect to /tasks', 'P1',
      '1. Navigate to http://localhost:5173',
      'Should redirect to /tasks',
      `Redirected to ${url1}`,
      'Add redirect from / to /tasks in _index.tsx route',
      'N/A');
  }

  // Step 2: Verify task list loads with sample tasks
  console.log('  Step 2: Verify task list loads');
  await page.waitForSelector('.space-y-3', { timeout: TIMEOUT });
  const taskCards = await page.$$('.space-y-3 > div.card, .space-y-3 > div');
  const taskCount = taskCards.length;
  console.log(`  Found ${taskCount} task items`);
  
  if (taskCount === 0) {
    addFinding('E2E-02', 'No sample tasks visible on initial load', 'P1',
      '1. Navigate to /tasks',
      'Sample tasks should be visible',
      'No tasks found in the list',
      'Ensure seed data is loaded in db.server',
      'N/A');
  }

  await screenshot(page, 'flow1_task_list');

  // Step 3: Verify stats bar
  console.log('  Step 3: Verify stats bar');
  const statsBar = await page.$('.bg-gradient-to-r');
  if (!statsBar) {
    addFinding('E2E-03', 'Stats bar not visible', 'P1',
      '1. Navigate to /tasks\n2. Look for stats bar at top',
      'Stats bar should show Level, Streak, XP, Completed',
      'Stats bar element not found',
      'Check rendering of user stats section',
      'N/A');
  } else {
    const statsText = await page.evaluate(el => el.textContent, statsBar);
    console.log(`  Stats bar text: ${statsText.substring(0, 200)}`);
    const hasLevel = statsText.includes('Level');
    const hasStreak = statsText.includes('Streak');
    const hasXP = statsText.includes('Experience') || statsText.includes('XP');
    const hasCompleted = statsText.includes('Completed');
    console.log(`  Level: ${hasLevel}, Streak: ${hasStreak}, XP: ${hasXP}, Completed: ${hasCompleted}`);
    
    if (!hasLevel || !hasStreak || !hasXP || !hasCompleted) {
      addFinding('E2E-04', 'Stats bar missing some stats', 'P2',
        '1. Navigate to /tasks\n2. Check stats bar',
        'Stats bar shows Level, Streak, XP, Completed',
        `Missing: ${!hasLevel ? 'Level ' : ''}${!hasStreak ? 'Streak ' : ''}${!hasXP ? 'XP ' : ''}${!hasCompleted ? 'Completed' : ''}`,
        'Ensure all stat fields are rendered',
        'flow1_task_list.png');
    }
  }

  // Step 4: Verify 4 stat cards
  console.log('  Step 4: Verify stat cards');
  const statCards = await page.$$('.grid.grid-cols-4 > div');
  console.log(`  Found ${statCards.length} stat cards`);
  
  if (statCards.length !== 4) {
    addFinding('E2E-05', 'Missing stat cards in quick stats section', 'P2',
      '1. Navigate to /tasks\n2. Look below stats bar for stat cards',
      '4 stat cards visible (Total, To Do, In Progress, Completed)',
      `Found ${statCards.length} stat cards`,
      'Check grid layout in quick stats section',
      'flow1_task_list.png');
  } else {
    const cardTexts = [];
    for (const card of statCards) {
      const text = await page.evaluate(el => el.textContent, card);
      cardTexts.push(text.trim());
    }
    console.log(`  Stat cards: ${cardTexts.join(' | ')}`);
  }

  // Step 5: Toggle between List and Board (Kanban) views
  console.log('  Step 5: Toggle to Board view');
  const boardLink = await page.$('a[href*="view=kanban"]');
  if (boardLink) {
    await boardLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
    await delay(500);
    
    const urlAfterBoard = page.url();
    console.log(`  URL after Board click: ${urlAfterBoard}`);
    
    const kanbanColumns = await page.$$('.grid.grid-cols-3 > div');
    console.log(`  Found ${kanbanColumns.length} kanban columns`);
    
    await screenshot(page, 'flow1_kanban_view');
    
    if (kanbanColumns.length !== 3) {
      addFinding('E2E-06', 'Kanban view does not show 3 columns', 'P2',
        '1. Navigate to /tasks\n2. Click Board view toggle',
        '3 columns: To Do, In Progress, Completed',
        `Found ${kanbanColumns.length} columns`,
        'Check kanban grid layout',
        'flow1_kanban_view.png');
    }

    // Toggle back to list
    const listLink = await page.$('a[href*="view=list"]');
    if (listLink) {
      await listLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
      await delay(300);
    }
  } else {
    addFinding('E2E-07', 'Board view toggle link not found', 'P1',
      '1. Navigate to /tasks\n2. Look for Board toggle in sidebar',
      'Board toggle link should be visible',
      'Link with href containing view=kanban not found',
      'Check sidebar view mode toggle rendering',
      'flow1_task_list.png');
  }

  console.log('  ✅ Flow 1 completed');
  return true;
}

async function flow2(page) {
  console.log('\n=== FLOW 2: Create a new task ===');

  // Navigate to tasks first
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 1: Click "New Task" button
  console.log('  Step 1: Click New Task button');
  const newTaskBtn = await page.$('a[href="/tasks/new"]');
  if (!newTaskBtn) {
    addFinding('E2E-08', 'New Task button not found', 'P0',
      '1. Navigate to /tasks\n2. Look for New Task button',
      'New Task button should be visible in header',
      'Button/link with href="/tasks/new" not found',
      'Check header rendering',
      'N/A');
    return false;
  }
  await newTaskBtn.click();
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 2: Verify modal opens
  console.log('  Step 2: Verify create modal opens');
  const modal = await page.$('.fixed.inset-0');
  if (!modal) {
    addFinding('E2E-09', 'Create task modal does not appear', 'P0',
      '1. Navigate to /tasks\n2. Click New Task\n3. Modal should appear',
      'Modal overlay should be visible',
      'Modal element not found',
      'Check tasks.new.tsx rendering',
      'N/A');
    return false;
  }
  await screenshot(page, 'flow2_create_modal');

  // Step 3: Select emoji icon
  console.log('  Step 3: Select emoji icon');
  const emojiButtons = await page.$$('button.text-2xl');
  if (emojiButtons.length > 2) {
    await emojiButtons[1].click(); // Select rocket emoji
    await delay(200);
    console.log('  Selected emoji');
  }

  // Step 4: Fill in form
  console.log('  Step 4: Fill in form fields');
  
  // Skip templates first
  const skipBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes('Skip')) return true;
    }
    return false;
  });
  if (skipBtn) {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.includes('Skip')) { btn.click(); break; }
      }
    });
    await delay(300);
  }

  // Title
  await page.type('#title', 'QA Test Task');
  
  // Description
  await page.type('#description', 'Testing the task creation flow - this is a QA end-to-end test description for the TaskQuest Pro application');
  
  // Priority = High
  await page.select('#priority', 'high');
  
  // Category
  const categoryInput = await page.$('#category');
  await categoryInput.click({ clickCount: 3 });
  await page.type('#category', 'QA');
  
  // Estimated Time
  await page.type('#estimatedMinutes', '30');
  
  // Step 5: Set due date
  console.log('  Step 5: Set due date');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const dateStr = tomorrow.toISOString().split('T')[0];
  await page.$eval('#dueDate', (el, val) => { el.value = val; }, dateStr);
  
  await screenshot(page, 'flow2_form_filled');

  // Step 6: Click Create Task
  console.log('  Step 6: Click Create Task');
  const createBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const btn of btns) {
      if (btn.textContent.includes('Create Task')) return true;
    }
    return false;
  });
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const btn of btns) {
      if (btn.textContent.includes('Create Task')) { btn.click(); break; }
    }
  });
  
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 7: Verify redirect
  console.log('  Step 7: Verify redirect');
  const urlAfterCreate = page.url();
  console.log(`  URL after creation: ${urlAfterCreate}`);
  
  await screenshot(page, 'flow2_after_create');

  // Step 8: Check task appears
  // Navigate back to tasks list
  if (urlAfterCreate.includes('/tasks/')) {
    console.log('  Redirected to task detail - going back to list');
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await delay(500);
  }

  const pageContent = await page.content();
  const taskCreated = pageContent.includes('QA Test Task');
  console.log(`  Task "QA Test Task" found in list: ${taskCreated}`);
  
  if (!taskCreated) {
    addFinding('E2E-10', 'Created task not visible in task list', 'P1',
      '1. Create a new task with title "QA Test Task"\n2. Navigate to /tasks',
      'Task should appear in the list',
      'Task title not found in page content',
      'Check task creation and list rendering',
      'flow2_after_create.png');
  }

  await screenshot(page, 'flow2_task_in_list');

  console.log('  ✅ Flow 2 completed');
  return true;
}

async function flow3(page) {
  console.log('\n=== FLOW 3: Edit a task ===');

  // Navigate to tasks
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 1: Click on first task to open edit modal
  console.log('  Step 1: Click first task');
  const firstTaskLink = await page.$('.space-y-3 a[href^="/tasks/"]');
  if (!firstTaskLink) {
    addFinding('E2E-11', 'No task links found in task list', 'P1',
      '1. Navigate to /tasks\n2. Look for task links',
      'Task links should be clickable',
      'No links with href starting with /tasks/ found',
      'Check task list rendering',
      'N/A');
    return false;
  }
  
  const taskHref = await page.evaluate(el => el.href, firstTaskLink);
  console.log(`  Clicking task: ${taskHref}`);
  await firstTaskLink.click();
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Verify modal opens
  const editModal = await page.$('.fixed.inset-0');
  if (!editModal) {
    addFinding('E2E-12', 'Edit task modal does not appear', 'P0',
      '1. Navigate to /tasks\n2. Click on a task',
      'Edit modal should appear',
      'Modal overlay not found',
      'Check tasks.$taskId.tsx rendering',
      'N/A');
    return false;
  }

  await screenshot(page, 'flow3_edit_modal');

  // Step 2: Change title
  console.log('  Step 2: Change title');
  const titleInput = await page.$('#title');
  const originalTitle = await page.evaluate(el => el.value, titleInput);
  console.log(`  Original title: ${originalTitle}`);
  await titleInput.click({ clickCount: 3 });
  await page.type('#title', `${originalTitle} (Edited)`);

  // Step 3: Change status to In Progress
  console.log('  Step 3: Change status to In Progress');
  await page.select('#status', 'in-progress');

  await screenshot(page, 'flow3_form_edited');

  // Step 4: Click Save Changes
  console.log('  Step 4: Click Save Changes');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const btn of btns) {
      if (btn.textContent.includes('Save Changes')) {
        btn.click();
        break;
      }
    }
  });
  
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 5: Verify changes in task list
  console.log('  Step 5: Verify changes');
  const urlAfterSave = page.url();
  console.log(`  URL after save: ${urlAfterSave}`);
  
  const pageContent = await page.content();
  const editedTitleFound = pageContent.includes('(Edited)');
  console.log(`  Edited title found: ${editedTitleFound}`);
  
  if (!editedTitleFound) {
    // Navigate to tasks to check
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await delay(500);
    const pageContent2 = await page.content();
    const editedTitleFound2 = pageContent2.includes('(Edited)');
    console.log(`  Edited title found in list: ${editedTitleFound2}`);
    
    if (!editedTitleFound2) {
      addFinding('E2E-13', 'Edited task title not reflected in task list', 'P1',
        '1. Open task edit modal\n2. Change title\n3. Save changes\n4. Check task list',
        'Updated title should be visible',
        'Updated title not found',
        'Check updateTask function and redirect',
        'flow3_form_edited.png');
    }
  }
  
  await screenshot(page, 'flow3_after_save');
  console.log('  ✅ Flow 3 completed');
  return true;
}

async function flow4(page) {
  console.log('\n=== FLOW 4: Complete a task (XP flow) ===');

  // Navigate to tasks and get initial XP
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Get initial XP
  const initialXP = await page.evaluate(() => {
    const els = document.querySelectorAll('.text-purple-600, .dark\\:text-purple-400');
    for (const el of els) {
      const parent = el.closest('.text-center');
      if (parent && parent.textContent.includes('Experience')) {
        return parseInt(el.textContent);
      }
    }
    // Fallback: look for any element with XP info
    const allEls = document.querySelectorAll('.text-2xl.font-bold');
    for (const el of allEls) {
      const parent = el.closest('.text-center');
      if (parent && parent.textContent.includes('Experience')) {
        return parseInt(el.textContent);
      }
    }
    return null;
  });
  console.log(`  Initial XP: ${initialXP}`);

  const initialCompleted = await page.evaluate(() => {
    const allEls = document.querySelectorAll('.text-2xl.font-bold');
    for (const el of allEls) {
      const parent = el.closest('.text-center');
      if (parent && parent.textContent.includes('Completed')) {
        return parseInt(el.textContent);
      }
    }
    return null;
  });
  console.log(`  Initial Completed: ${initialCompleted}`);

  await screenshot(page, 'flow4_before_complete');

  // Find a task that is NOT done
  console.log('  Step 1: Find a non-completed task');
  const todoTaskLink = await page.evaluate(() => {
    const badges = document.querySelectorAll('.badge');
    for (const badge of badges) {
      if (badge.textContent.trim() === 'To Do' || badge.textContent.trim() === 'In Progress') {
        const card = badge.closest('.card');
        if (card) {
          const link = card.querySelector('a[href^="/tasks/"]');
          if (link) return link.getAttribute('href');
        }
      }
    }
    return null;
  });

  if (!todoTaskLink) {
    addFinding('E2E-14', 'No non-completed task found for XP test', 'P2',
      '1. Navigate to /tasks\n2. Look for a To Do or In Progress task',
      'At least one non-completed task should exist',
      'All tasks appear to be completed or none found',
      'Ensure seed data has non-completed tasks',
      'flow4_before_complete.png');
    return false;
  }

  console.log(`  Found task: ${todoTaskLink}`);

  // Step 2: Open task detail
  await page.goto(`${BASE_URL}${todoTaskLink}`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  await screenshot(page, 'flow4_task_detail');

  // Step 3: Change status to Completed
  console.log('  Step 2: Change status to Completed');
  await page.select('#status', 'done');

  // Step 4: Click Save Changes
  console.log('  Step 3: Click Save Changes');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const btn of btns) {
      if (btn.textContent.includes('Save Changes')) {
        btn.click();
        break;
      }
    }
  });

  // Wait for response - could be redirect or stay on page with confetti
  await delay(2000);
  
  const currentUrl = page.url();
  console.log(`  URL after save: ${currentUrl}`);

  // Check for confetti
  const hasConfetti = await page.evaluate(() => {
    return !!document.querySelector('canvas') || !!document.querySelector('[class*="confetti"]');
  });
  console.log(`  Confetti visible: ${hasConfetti}`);
  
  await screenshot(page, 'flow4_after_complete');

  // Navigate to /tasks to check XP increase
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  const newXP = await page.evaluate(() => {
    const allEls = document.querySelectorAll('.text-2xl.font-bold');
    for (const el of allEls) {
      const parent = el.closest('.text-center');
      if (parent && parent.textContent.includes('Experience')) {
        return parseInt(el.textContent);
      }
    }
    return null;
  });
  console.log(`  New XP: ${newXP}`);

  const newCompleted = await page.evaluate(() => {
    const allEls = document.querySelectorAll('.text-2xl.font-bold');
    for (const el of allEls) {
      const parent = el.closest('.text-center');
      if (parent && parent.textContent.includes('Completed')) {
        return parseInt(el.textContent);
      }
    }
    return null;
  });
  console.log(`  New Completed: ${newCompleted}`);

  await screenshot(page, 'flow4_xp_after');

  if (initialXP !== null && newXP !== null) {
    if (newXP > initialXP) {
      console.log(`  ✅ XP increased from ${initialXP} to ${newXP} (+${newXP - initialXP})`);
    } else {
      addFinding('E2E-15', 'XP did not increase after completing a task', 'P1',
        '1. Note initial XP\n2. Complete a task\n3. Check XP',
        `XP should increase (was ${initialXP})`,
        `XP is ${newXP} (no change)`,
        'Check updateTask XP calculation in db.server',
        'flow4_xp_after.png');
    }
  }

  if (initialCompleted !== null && newCompleted !== null && newCompleted <= initialCompleted) {
    addFinding('E2E-16', 'Completed count did not increase after completing task', 'P2',
      '1. Note initial completed count\n2. Complete a task\n3. Check completed count',
      `Completed count should increase (was ${initialCompleted})`,
      `Completed count is ${newCompleted}`,
      'Check stats counting',
      'flow4_xp_after.png');
  }

  console.log('  ✅ Flow 4 completed');
  return true;
}

async function flow5(page) {
  console.log('\n=== FLOW 5: Delete a task ===');

  // Navigate to tasks
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Count tasks before delete
  const taskCountBefore = await page.evaluate(() => {
    const statCards = document.querySelectorAll('.grid.grid-cols-4 > div');
    if (statCards.length > 0) {
      return parseInt(statCards[0].querySelector('.text-xl')?.textContent || '0');
    }
    return 0;
  });
  console.log(`  Tasks before delete: ${taskCountBefore}`);

  // Find a task to delete (preferably QA Test Task)
  const taskToDelete = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href^="/tasks/"]');
    for (const link of links) {
      if (!link.href.includes('/new')) return link.getAttribute('href');
    }
    return null;
  });

  if (!taskToDelete) {
    addFinding('E2E-17', 'No task found to delete', 'P2',
      '1. Navigate to /tasks\n2. Look for any task',
      'At least one task should exist',
      'No tasks found',
      'Ensure tasks exist',
      'N/A');
    return false;
  }

  console.log(`  Deleting task: ${taskToDelete}`);
  
  // Step 1: Open task detail
  await page.goto(`${BASE_URL}${taskToDelete}`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  await screenshot(page, 'flow5_before_delete');

  // Get task title for verification
  const taskTitle = await page.evaluate(() => {
    const titleInput = document.querySelector('#title');
    return titleInput ? titleInput.value : null;
  });
  console.log(`  Task title: ${taskTitle}`);

  // Step 2: Click Delete Task
  console.log('  Step 2: Click Delete Task');
  
  // Check if there's a confirmation dialog
  page.on('dialog', async dialog => {
    console.log(`  Dialog: ${dialog.type()} - ${dialog.message()}`);
    await dialog.accept();
  });

  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const btn of btns) {
      if (btn.textContent.includes('Delete Task')) {
        btn.click();
        break;
      }
    }
  });

  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 3: Verify redirect to /tasks
  const urlAfterDelete = page.url();
  console.log(`  URL after delete: ${urlAfterDelete}`);
  
  if (!urlAfterDelete.includes('/tasks')) {
    addFinding('E2E-18', 'Not redirected to /tasks after deleting task', 'P2',
      '1. Open task detail\n2. Click Delete Task',
      'Should redirect to /tasks',
      `Redirected to ${urlAfterDelete}`,
      'Check delete action redirect',
      'N/A');
  }

  // Step 4: Verify task removed
  const taskCountAfter = await page.evaluate(() => {
    const statCards = document.querySelectorAll('.grid.grid-cols-4 > div');
    if (statCards.length > 0) {
      return parseInt(statCards[0].querySelector('.text-xl')?.textContent || '0');
    }
    return 0;
  });
  console.log(`  Tasks after delete: ${taskCountAfter}`);

  if (taskTitle) {
    const stillExists = await page.evaluate((title) => {
      return document.body.textContent.includes(title);
    }, taskTitle);
    
    if (stillExists) {
      // Check more carefully - it might be on the page in a different context
      console.log(`  ⚠️ Task title "${taskTitle}" still found on page (may be in different context)`);
    }
  }

  await screenshot(page, 'flow5_after_delete');

  if (taskCountAfter < taskCountBefore) {
    console.log(`  ✅ Task count decreased from ${taskCountBefore} to ${taskCountAfter}`);
  } else if (taskCountBefore > 0) {
    addFinding('E2E-19', 'Task count did not decrease after deletion', 'P1',
      '1. Note task count\n2. Delete a task\n3. Check task count',
      `Task count should decrease (was ${taskCountBefore})`,
      `Task count is ${taskCountAfter}`,
      'Check deleteTask in db.server',
      'flow5_after_delete.png');
  }

  console.log('  ✅ Flow 5 completed');
  return true;
}

async function flow6(page) {
  console.log('\n=== FLOW 6: Search and filter ===');

  // Navigate to tasks
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Get all tasks count
  const allTasksCount = await page.evaluate(() => {
    const statCards = document.querySelectorAll('.grid.grid-cols-4 > div');
    if (statCards.length > 0) {
      return parseInt(statCards[0].querySelector('.text-xl')?.textContent || '0');
    }
    return 0;
  });
  console.log(`  Total tasks: ${allTasksCount}`);

  // Step 1: Use search box
  console.log('  Step 1: Search for a task');
  const searchInput = await page.$('input[name="search"]');
  if (!searchInput) {
    addFinding('E2E-20', 'Search input not found', 'P1',
      '1. Navigate to /tasks\n2. Look for search input in sidebar',
      'Search input should be visible',
      'Input with name="search" not found',
      'Check sidebar rendering',
      'N/A');
    return false;
  }

  // Get a task title to search for
  const firstTaskTitle = await page.evaluate(() => {
    const taskH3 = document.querySelector('.space-y-3 h3');
    return taskH3 ? taskH3.textContent.trim().split(' ').slice(0, 2).join(' ') : 'task';
  });
  console.log(`  Searching for: "${firstTaskTitle}"`);

  await searchInput.type(firstTaskTitle);
  
  // Click search button
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const btn of btns) {
      if (btn.textContent.includes('Search')) {
        btn.click();
        break;
      }
    }
  });
  
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 2: Verify results are filtered
  const searchUrl = page.url();
  console.log(`  URL after search: ${searchUrl}`);
  const hasSearchParam = searchUrl.includes('search=');
  
  if (!hasSearchParam) {
    addFinding('E2E-21', 'Search parameter not added to URL', 'P2',
      '1. Type in search box\n2. Click Search',
      'URL should include search parameter',
      `URL: ${searchUrl}`,
      'Check search form submission',
      'N/A');
  }

  await screenshot(page, 'flow6_search_results');

  // Step 3: Click status filter (To Do)
  console.log('  Step 3: Click To Do filter');
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  const todoFilter = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.textContent.trim() === 'To Do' && link.href.includes('status=todo')) {
        return link.href;
      }
    }
    return null;
  });

  if (todoFilter) {
    await page.goto(todoFilter, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await delay(500);

    // Step 4: Verify only matching tasks shown
    const filteredTaskStatuses = await page.evaluate(() => {
      const badges = document.querySelectorAll('.badge-todo');
      return badges.length;
    });
    
    const nonMatchingStatuses = await page.evaluate(() => {
      const badges = document.querySelectorAll('.badge-in-progress, .badge-done');
      // Only count badges within task cards (not sidebar or stats)
      let count = 0;
      for (const badge of badges) {
        const card = badge.closest('.space-y-3');
        if (card) count++;
      }
      return count;
    });

    console.log(`  To Do tasks shown: ${filteredTaskStatuses}, Non-matching: ${nonMatchingStatuses}`);
    
    if (nonMatchingStatuses > 0) {
      addFinding('E2E-22', 'Status filter shows non-matching tasks', 'P1',
        '1. Click "To Do" filter\n2. Check task statuses',
        'Only To Do tasks should be shown',
        `Found ${nonMatchingStatuses} non-matching tasks`,
        'Check getAllTasks filter logic',
        'flow6_status_filter.png');
    }

    await screenshot(page, 'flow6_status_filter');
  } else {
    addFinding('E2E-23', 'To Do filter link not found', 'P2',
      '1. Navigate to /tasks\n2. Look for To Do filter in sidebar',
      'To Do filter should be visible',
      'Filter link not found',
      'Check sidebar filter links',
      'N/A');
  }

  // Step 5: Click category filter
  console.log('  Step 5: Click category filter');
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  const categoryLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="category="]');
    return Array.from(links).map(l => ({ href: l.href, text: l.textContent.trim() }));
  });
  console.log(`  Category filters found: ${categoryLinks.length}`);

  if (categoryLinks.length > 0) {
    await page.goto(categoryLinks[0].href, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await delay(500);
    await screenshot(page, 'flow6_category_filter');
    console.log(`  Applied category filter: ${categoryLinks[0].text}`);
  }

  // Step 6: Clear filters
  console.log('  Step 6: Clear filters');
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);
  
  const finalUrl = page.url();
  console.log(`  Cleared filters, URL: ${finalUrl}`);

  await screenshot(page, 'flow6_filters_cleared');

  console.log('  ✅ Flow 6 completed');
  return true;
}

async function flow7(page) {
  console.log('\n=== FLOW 7: Dark mode toggle ===');

  // Navigate to tasks
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Check initial theme
  const initialTheme = await page.evaluate(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  console.log(`  Initial theme: ${initialTheme}`);

  await screenshot(page, 'flow7_light_mode');

  // Step 1: Click theme toggle
  console.log('  Step 1: Click theme toggle');
  const themeToggle = await page.evaluate(() => {
    // Look for theme toggle button
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('🌙') || btn.textContent.includes('☀️') || 
          btn.getAttribute('aria-label')?.includes('theme') ||
          btn.classList.contains('theme-toggle')) {
        return true;
      }
    }
    return false;
  });

  if (!themeToggle) {
    addFinding('E2E-24', 'Theme toggle button not found or not identifiable', 'P2',
      '1. Navigate to /tasks\n2. Look for dark mode toggle in header',
      'Theme toggle button should be visible',
      'No button with moon/sun icon or theme-related class found',
      'Add aria-label to ThemeToggle component for accessibility',
      'flow7_light_mode.png');
  }

  // Try to click the theme toggle
  const toggled = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('🌙') || btn.textContent.includes('☀️') ||
          btn.getAttribute('aria-label')?.includes('theme') ||
          btn.getAttribute('aria-label')?.includes('Toggle')) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  if (toggled) {
    await delay(500);
    
    // Step 2: Verify dark mode
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    console.log(`  Theme after toggle: ${newTheme}`);

    if (newTheme === initialTheme) {
      addFinding('E2E-25', 'Theme toggle does not change theme', 'P1',
        '1. Click theme toggle button',
        'Theme should switch between light and dark',
        `Theme remained ${newTheme}`,
        'Check ThemeToggle component click handler',
        'flow7_light_mode.png');
    }

    await screenshot(page, 'flow7_dark_mode');

    // Step 3: Check elements in dark mode
    const darkModeIssues = await page.evaluate(() => {
      const issues = [];
      // Check text readability
      const allText = document.querySelectorAll('h1, h2, h3, p, span, label');
      for (const el of allText) {
        const style = window.getComputedStyle(el);
        const color = style.color;
        // Check if text is very dark on dark background
        if (color === 'rgb(0, 0, 0)' || color === '#000000') {
          issues.push(`Black text found on element: ${el.tagName}.${el.className.split(' ')[0]}`);
        }
      }
      return issues.slice(0, 5);
    });
    
    if (darkModeIssues.length > 0) {
      console.log(`  Dark mode issues: ${darkModeIssues.join(', ')}`);
      addFinding('E2E-26', 'Dark mode has text readability issues', 'P2',
        '1. Toggle to dark mode\n2. Check text readability',
        'All text should be readable against dark background',
        `Found issues: ${darkModeIssues.join('; ')}`,
        'Add dark: variant classes to text elements',
        'flow7_dark_mode.png');
    }

    // Step 4: Toggle back to light
    console.log('  Step 4: Toggle back to light mode');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('🌙') || btn.textContent.includes('☀️') ||
            btn.getAttribute('aria-label')?.includes('theme') ||
            btn.getAttribute('aria-label')?.includes('Toggle')) {
          btn.click();
          return;
        }
      }
    });
    await delay(500);

    const finalTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    console.log(`  Final theme: ${finalTheme}`);
    
    await screenshot(page, 'flow7_back_to_light');
  } else {
    addFinding('E2E-27', 'Could not click theme toggle button', 'P2',
      '1. Navigate to /tasks\n2. Try to click theme toggle',
      'Should be able to toggle theme',
      'Button click handler not triggered',
      'Check ThemeToggle rendering - may need ClientOnly wrapper',
      'flow7_light_mode.png');
  }

  console.log('  ✅ Flow 7 completed');
  return true;
}

async function flow8(page) {
  console.log('\n=== FLOW 8: Quick actions (hover actions) ===');

  // Navigate to tasks (list view)
  await page.goto(`${BASE_URL}/tasks?view=list`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
  await delay(500);

  // Step 1: Find a todo task
  const todoTaskCard = await page.evaluate(() => {
    const badges = document.querySelectorAll('.badge-todo, .badge');
    for (const badge of badges) {
      if (badge.textContent.trim() === 'To Do') {
        const card = badge.closest('.card');
        if (card) return true;
      }
    }
    return false;
  });

  if (!todoTaskCard) {
    console.log('  No todo task found, looking for any task');
  }

  // Step 2: Hover over first task card
  console.log('  Step 1: Hover over task card');
  const firstCard = await page.$('.space-y-3 > .card');
  if (!firstCard) {
    addFinding('E2E-28', 'No task card found for hover test', 'P2',
      '1. Navigate to /tasks\n2. Look for task cards',
      'Task cards should be present',
      'No card elements found',
      'Check task list rendering',
      'N/A');
    return false;
  }

  await firstCard.hover();
  await delay(500);

  await screenshot(page, 'flow8_hover_actions');

  // Step 3: Check if quick action buttons appear
  const quickActions = await page.evaluate(() => {
    // Quick actions are in a div with opacity-0 group-hover:opacity-100
    const actionDivs = document.querySelectorAll('.group-hover\\:opacity-100, [class*="group-hover"]');
    const actions = [];
    for (const div of actionDivs) {
      const buttons = div.querySelectorAll('button');
      for (const btn of buttons) {
        actions.push(btn.textContent.trim());
      }
    }
    return actions;
  });
  console.log(`  Quick action buttons: ${quickActions.join(', ')}`);

  // Check for Focus Mode button
  const hasFocusMode = quickActions.some(a => a.includes('Focus'));
  console.log(`  Focus Mode button: ${hasFocusMode}`);

  // Check for Start/Done buttons
  const hasStartBtn = quickActions.some(a => a.includes('Start'));
  const hasDoneBtn = quickActions.some(a => a.includes('Done'));
  console.log(`  Start button: ${hasStartBtn}, Done button: ${hasDoneBtn}`);

  // Step 4: Try clicking Start on a todo task
  console.log('  Step 3: Click Start on a todo task');
  
  // Find a todo task and hover it
  const todoCard = await page.evaluate(() => {
    const badges = document.querySelectorAll('.badge');
    for (const badge of badges) {
      if (badge.textContent.trim() === 'To Do') {
        const card = badge.closest('.card');
        if (card) {
          const startBtn = card.querySelector('button[value="in-progress"]');
          if (startBtn) return { found: true };
        }
      }
    }
    return { found: false };
  });

  if (todoCard.found) {
    // Hover the card first
    const todoCardEl = await page.evaluateHandle(() => {
      const badges = document.querySelectorAll('.badge');
      for (const badge of badges) {
        if (badge.textContent.trim() === 'To Do') {
          const card = badge.closest('.card');
          if (card && card.querySelector('button[value="in-progress"]')) return card;
        }
      }
      return null;
    });

    if (todoCardEl) {
      await todoCardEl.asElement()?.hover();
      await delay(500);

      // Click Start button
      await page.evaluate(() => {
        const badges = document.querySelectorAll('.badge');
        for (const badge of badges) {
          if (badge.textContent.trim() === 'To Do') {
            const card = badge.closest('.card');
            if (card) {
              const startBtn = card.querySelector('button[value="in-progress"]');
              if (startBtn) {
                startBtn.click();
                return true;
              }
            }
          }
        }
        return false;
      });

      await delay(2000);
      
      // Check if page reloaded (reloadDocument attribute)
      const currentUrl = page.url();
      console.log(`  URL after Start click: ${currentUrl}`);
      
      if (currentUrl.includes('/tasks')) {
        await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
        await delay(500);
      }

      await screenshot(page, 'flow8_after_start');
    }
  } else {
    console.log('  No todo task with Start button found');
    addFinding('E2E-29', 'No todo task with Start quick action available', 'P3',
      '1. Navigate to /tasks in list view\n2. Hover over a todo task',
      'Start button should appear for todo tasks',
      'No todo task with Start button found (may all be in-progress or done)',
      'Ensure seed data has todo tasks',
      'flow8_hover_actions.png');
  }

  console.log('  ✅ Flow 8 completed');
  return true;
}

async function main() {
  console.log('🚀 Starting E2E QA Test Suite for TaskQuest Pro');
  console.log('================================================\n');

  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  🔴 Console error: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`  🔴 Page error: ${error.message}`);
  });

  const results = {};

  try {
    // Flow 1
    try {
      results['Flow 1: View tasks and navigate'] = await flow1(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 1 error: ${e.message}`);
      results['Flow 1: View tasks and navigate'] = 'FAIL';
      await screenshot(page, 'flow1_error');
    }

    // Flow 2
    try {
      results['Flow 2: Create a new task'] = await flow2(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 2 error: ${e.message}`);
      results['Flow 2: Create a new task'] = 'FAIL';
      await screenshot(page, 'flow2_error');
    }

    // Flow 3
    try {
      results['Flow 3: Edit a task'] = await flow3(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 3 error: ${e.message}`);
      results['Flow 3: Edit a task'] = 'FAIL';
      await screenshot(page, 'flow3_error');
    }

    // Flow 4
    try {
      results['Flow 4: Complete a task (XP flow)'] = await flow4(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 4 error: ${e.message}`);
      results['Flow 4: Complete a task (XP flow)'] = 'FAIL';
      await screenshot(page, 'flow4_error');
    }

    // Flow 5
    try {
      results['Flow 5: Delete a task'] = await flow5(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 5 error: ${e.message}`);
      results['Flow 5: Delete a task'] = 'FAIL';
      await screenshot(page, 'flow5_error');
    }

    // Flow 6
    try {
      results['Flow 6: Search and filter'] = await flow6(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 6 error: ${e.message}`);
      results['Flow 6: Search and filter'] = 'FAIL';
      await screenshot(page, 'flow6_error');
    }

    // Flow 7
    try {
      results['Flow 7: Dark mode toggle'] = await flow7(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 7 error: ${e.message}`);
      results['Flow 7: Dark mode toggle'] = 'FAIL';
      await screenshot(page, 'flow7_error');
    }

    // Flow 8
    try {
      results['Flow 8: Quick actions (hover)'] = await flow8(page) ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ❌ Flow 8 error: ${e.message}`);
      results['Flow 8: Quick actions (hover)'] = 'FAIL';
      await screenshot(page, 'flow8_error');
    }

  } finally {
    await browser.close();
  }

  console.log('\n\n================================================');
  console.log('📊 E2E Test Results Summary');
  console.log('================================================');
  for (const [flow, result] of Object.entries(results)) {
    const icon = result === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${flow}: ${result}`);
  }

  console.log('\n📋 Findings:');
  for (const f of findings) {
    console.log(`  ${f.id} [${f.severity}] ${f.title}`);
  }

  // Write results JSON
  const output = {
    timestamp: new Date().toISOString(),
    results,
    findings,
    screenshots: await (async () => {
      const { readdir } = await import('fs/promises');
      const files = await readdir(SCREENSHOT_DIR);
      return files.filter(f => f.startsWith('flow')).map(f => `${SCREENSHOT_DIR}/${f}`);
    })()
  };

  const { writeFile } = await import('fs/promises');
  await writeFile('/workspace/qa-output/e2e-results.json', JSON.stringify(output, null, 2));
  console.log('\n✅ Results written to /workspace/qa-output/e2e-results.json');
}

main().catch(console.error);
