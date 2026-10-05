const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
  await page.goto('http://localhost:8000/ciudadlink/index.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/verification_fixed.png' });
  await browser.close();
})();
