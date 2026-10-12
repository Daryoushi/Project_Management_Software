const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testNewTheme() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000 ...');
  // First clear localStorage so we see the authentic Login screen
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Capture Login Screen
  await page.screenshot({ path: path.join(screenshotsDir, '10_auth_login_screen.png'), fullPage: true });
  console.log('Captured 10_auth_login_screen.png');

  // Fill login credentials
  await page.fill('input[type="email"]', 'abalfazl@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Capture Home with Pinar font & Charcoal sidebar
  await page.screenshot({ path: path.join(screenshotsDir, '11_pinar_home_dashboard.png'), fullPage: true });
  console.log('Captured 11_pinar_home_dashboard.png');

  // 3. Click Project to view List View
  const projectItem = page.locator('button:has-text("پروژه اول ابوالفضل")').first();
  if (await projectItem.isVisible()) {
    await projectItem.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '12_pinar_list_view.png'), fullPage: true });
    console.log('Captured 12_pinar_list_view.png');
  }

  // 4. Click Team Members & Roles
  const teamBtn = page.locator('button:has-text("مدیریت اعضا و نقش‌ها")').first();
  if (await teamBtn.isVisible()) {
    await teamBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '13_pinar_team_rbac.png') });
    console.log('Captured 13_pinar_team_rbac.png');
  }

  await browser.close();
  console.log('New theme verification finished successfully!');
}

testNewTheme().catch(console.error);
