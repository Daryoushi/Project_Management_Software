const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '38_google_button_preview.png' });
  console.log('Login view screenshot taken');
  
  const googleBtn = await page.getByRole('button', { name: 'ورود مستقیم با حساب گوگل' });
  await googleBtn.click();
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '39_google_signed_in_dashboard.png' });
  console.log('Dashboard after Google Sign-in screenshot taken');
  
  await browser.close();
})();
