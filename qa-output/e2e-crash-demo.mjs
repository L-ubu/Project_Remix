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
      '--window-size=1280,900',
      '--window-position=0,0'
    ],
    defaultViewport: { width: 1260, height: 820 },
    env: { ...process.env, DISPLAY: ':1' }
  });

  const page = await browser.newPage();

  console.log('Navigating to /tasks (will crash due to null data)');
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(4000);

  console.log('Page loaded - crash should be visible');
  await page.screenshot({ path: '/opt/cursor/artifacts/crash_null_priority.png' });

  console.log('Demo complete');
  await browser.close();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
