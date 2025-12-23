const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const email = process.env.SMOKE_EMAIL || 'admin@synoro.com';
  const password = process.env.SMOKE_PASSWORD || 'ChangeMe123!';
  const outDir = process.env.SMOKE_OUTDIR || './smoke-output';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 900 });

  try {
    console.log('Opening app:', base);
    await page.goto(base, { waitUntil: 'networkidle2', timeout: 30000 });

    // Click Login (header) or navigate to / (App shows login button)
    const loginSelector = 'button:has-text("Login"), button:has-text("Sign in")';
    try {
      await page.waitForSelector('button', { timeout: 3000 });
      // find Login button by text
      const btns = await page.$$('button');
      let found = false;
      for (const b of btns) {
        const txt = (await (await b.getProperty('innerText')).jsonValue()).trim();
        if (/login/i.test(txt) || /sign in/i.test(txt) || /sign in/i.test(txt)) {
          await b.click();
          found = true;
          break;
        }
      }
      if (!found) {
        console.log('No header login button found, attempting direct /login route');
        await page.goto(base + '/', { waitUntil: 'networkidle2' });
      }
    } catch (e) {
      // fallback
      console.warn('Could not find login button quickly, continuing to /login', e.message);
      await page.goto(base + '/', { waitUntil: 'networkidle2' });
    }

    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', email, { delay: 20 });
    await page.type('input[type="password"]', password, { delay: 20 });

    // Submit the form - find submit button
    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error('Login submit button not found');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
      submitBtn.click()
    ]);

    console.log('Logged in, waiting for dashboard');
    await page.waitForTimeout(1000);

    // Click Admin -> Clients via sidebar: find button with text 'Clients'
    const sidebarButtons = await page.$$('button');
    for (const b of sidebarButtons) {
      const txt = ((await (await b.getProperty('innerText')).jsonValue()) || '').trim();
      if (/clients/i.test(txt)) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => { }),
          b.click()
        ]);
        break;
      }
    }

    // Wait for clients table/rows
    await page.waitForSelector('table, [data-testid="client-row"], div:has-text("Clients")', { timeout: 10000 }).catch(() => { });
    await page.screenshot({ path: `${outDir}/clients-list.png`, fullPage: true });
    console.log('Saved clients-list.png');

    // Click first client row (try several possible selectors)
    let clicked = false;
    const clientSelectors = ['[data-testid="client-row"]', 'table tbody tr', '.client-row', 'tr'];
    for (const sel of clientSelectors) {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      // try clicking first table row cell
      const firstRowCell = await page.$('table tbody tr td, table tbody tr th');
      if (firstRowCell) {
        await firstRowCell.click();
        clicked = true;
      }
    }

    if (!clicked) console.warn('Could not find a client row to click; skipping detail screenshot');
    else {
      // wait for detail panel
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${outDir}/client-detail.png`, fullPage: true });
      console.log('Saved client-detail.png');
    }

    console.log('Smoke test completed');
  } catch (err) {
    console.error('Smoke test failed:', err && err.message ? err.message : err);
    await page.screenshot({ path: `${outDir}/error.png`, fullPage: true }).catch(() => { });
  } finally {
    await browser.close();
  }
})();
