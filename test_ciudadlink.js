const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('Navigating to http://localhost:8000/ciudadlink/index.html ...');
  await page.goto('http://localhost:8000/ciudadlink/index.html');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'screenshot_updated.png' });

  // Check HUD text for 10x10x10 hierarchy code
  const hudSectorText = await page.locator('#hudSubSector').innerText();
  console.log('HUD SubSector text:', hudSectorText);

  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
    process.exit(1);
  } else {
    console.log('Game loaded successfully with 0 console errors!');
  }

  await browser.close();
})();
