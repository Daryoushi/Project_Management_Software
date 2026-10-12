const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  const regTab = await page.getByText('ثبت‌نام کاربر جدید');
  await regTab.click();
  await page.waitForTimeout(500);
  
  const emailInput = await page.locator('input[placeholder="name@company.com"]');
  await emailInput.fill('abalfazl.daryishii@gmail.com');
  
  const getCodeBtn = await page.getByRole('button', { name: 'دریافت کد' });
  await getCodeBtn.click();
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_click_get_code.png' });
  await browser.close();
  console.log('Finished Playwright test.');
})();
