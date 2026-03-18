import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  Console error: ${msg.text()}`);
  });

  // Go to task 9 detail
  await page.goto(`${BASE_URL}/tasks/9`, { waitUntil: 'networkidle0', timeout: 10000 });
  await delay(500);

  console.log('On task detail page:', page.url());

  // Try clicking delete via page.click() on the actual button selector
  const deleteBtn = await page.$('button.btn-danger, button.btn.btn-danger');
  if (deleteBtn) {
    console.log('Found delete button, clicking...');
    
    // Use requestSubmit to properly include the submitter
    const result = await page.evaluate(() => {
      const btn = document.querySelector('button.btn-danger');
      if (!btn) return 'no button found';
      const form = btn.closest('form');
      if (!form) return 'no form found';
      
      // Use requestSubmit with submitter to include button name/value
      if (form.requestSubmit) {
        form.requestSubmit(btn);
        return 'requestSubmit called';
      } else {
        // Fallback: add hidden input and submit
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'intent';
        input.value = 'delete';
        form.appendChild(input);
        form.submit();
        return 'manual submit called';
      }
    });
    
    console.log('Submit result:', result);
    
    await delay(3000);
    console.log('URL after delete:', page.url());
    
    // Check if task still exists
    const content = await page.content();
    console.log('Contains "QA Test Task":', content.includes('QA Test Task'));
    
    await page.screenshot({ path: '/opt/cursor/artifacts/flow5_delete_retry.png' });
  } else {
    console.log('Delete button not found');
    
    // Check what buttons exist
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent.trim(),
        classes: b.className,
        type: b.type
      }));
    });
    console.log('Buttons:', JSON.stringify(buttons, null, 2));
  }

  await browser.close();
}

main().catch(console.error);
