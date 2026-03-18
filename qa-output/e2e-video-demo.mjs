import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--start-maximized',
      '--window-size=1280,900',
      '--window-position=0,0'
    ],
    defaultViewport: { width: 1260, height: 820 },
    env: { ...process.env, DISPLAY: ':1' }
  });

  const page = await browser.newPage();

  // Flow: Create task, then complete it to show XP gain
  console.log('Step 1: Navigate to task list');
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(2000);

  // Note initial XP
  const initialXP = await page.evaluate(() => {
    const els = document.querySelectorAll('.text-2xl.font-bold');
    for (const el of els) {
      const parent = el.closest('.text-center');
      if (parent && parent.textContent.includes('Experience')) {
        return parseInt(el.textContent);
      }
    }
    return null;
  });
  console.log('Initial XP:', initialXP);

  console.log('Step 2: Click New Task');
  await page.click('a[href="/tasks/new"]');
  await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });
  await delay(1500);

  console.log('Step 3: Skip templates');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes('Skip')) { btn.click(); break; }
    }
  });
  await delay(800);

  console.log('Step 4: Select rocket emoji');
  const emojiBtns = await page.$$('button.text-2xl');
  if (emojiBtns.length > 1) {
    await emojiBtns[1].click();
    await delay(500);
  }

  console.log('Step 5: Fill in title');
  await page.click('#title');
  await delay(200);
  await page.type('#title', 'QA Video Demo Task', { delay: 40 });
  await delay(300);

  console.log('Step 6: Fill in description');
  await page.click('#description');
  await delay(200);
  await page.type('#description', 'This task demonstrates the create task flow during E2E QA testing of TaskFlow Pro', { delay: 25 });
  await delay(500);

  console.log('Step 7: Set priority to High');
  await page.select('#priority', 'high');
  await delay(300);

  console.log('Step 8: Fill category');
  await page.click('#category');
  await delay(200);
  await page.type('#category', 'QA Testing', { delay: 30 });
  await delay(300);

  console.log('Step 9: Set estimated time');
  await page.click('#estimatedMinutes');
  await delay(200);
  await page.type('#estimatedMinutes', '25', { delay: 50 });
  await delay(300);

  console.log('Step 10: Set due date');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  const dateStr = tomorrow.toISOString().split('T')[0];
  await page.$eval('#dueDate', (el, val) => { el.value = val; }, dateStr);
  await delay(500);

  console.log('Step 11: Scroll down to show XP info and Create button');
  await page.evaluate(() => {
    const modal = document.querySelector('.max-h-\\[90vh\\]');
    if (modal) modal.scrollTop = modal.scrollHeight;
  });
  await delay(1000);

  console.log('Step 12: Click Create Task');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[type="submit"]');
    for (const btn of btns) {
      if (btn.textContent.includes('Create Task')) {
        btn.click();
        break;
      }
    }
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
  await delay(1500);

  const urlAfterCreate = page.url();
  console.log('After create URL:', urlAfterCreate);

  // Now complete the task to show XP
  console.log('Step 13: Change status to Completed');
  if (urlAfterCreate.includes('/tasks/')) {
    await page.select('#status', 'done');
    await delay(500);

    console.log('Step 14: Save to complete task');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button[type="submit"]');
      for (const btn of btns) {
        if (btn.textContent.includes('Save Changes')) {
          btn.click();
          break;
        }
      }
    });

    await delay(3000);

    // Check for confetti
    console.log('Step 15: Wait for confetti and XP update');
    await delay(2000);

    // Navigate back to tasks to see updated XP
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: 10000 });
    await delay(2000);

    const newXP = await page.evaluate(() => {
      const els = document.querySelectorAll('.text-2xl.font-bold');
      for (const el of els) {
        const parent = el.closest('.text-center');
        if (parent && parent.textContent.includes('Experience')) {
          return parseInt(el.textContent);
        }
      }
      return null;
    });
    console.log('New XP:', newXP, `(+${newXP - initialXP} XP gained)`);
  }

  // Show Board view
  console.log('Step 16: Switch to Board view');
  const boardLink = await page.$('a[href*="view=kanban"]');
  if (boardLink) {
    await boardLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    await delay(2000);
  }

  // Switch back to list and toggle dark mode
  console.log('Step 17: Switch back to list');
  const listLink = await page.$('a[href*="view=list"]');
  if (listLink) {
    await listLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    await delay(1000);
  }

  console.log('Step 18: Toggle dark mode');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.getAttribute('aria-label')?.includes('Toggle') || btn.getAttribute('aria-label')?.includes('theme')) {
        btn.click();
        return;
      }
    }
  });
  await delay(2000);

  // Toggle back
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.getAttribute('aria-label')?.includes('Toggle') || btn.getAttribute('aria-label')?.includes('theme')) {
        btn.click();
        return;
      }
    }
  });
  await delay(1500);

  console.log('Video demo complete!');
  await browser.close();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
