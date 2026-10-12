const { chromium } = require('playwright');
const path = require('path');
const ARTIFACT_DIR = 'C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  // 1. Visit Login screen in Light mode
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '20_light_mode_login_screen.png') });
  console.log('Saved 20_light_mode_login_screen.png');

  // 2. Toggle to dark mode using the top header button
  const toggleBtn = page.locator('button[title*="تغییر تم"]').first();
  await toggleBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '21_dark_mode_login_screen.png') });
  console.log('Saved 21_dark_mode_login_screen.png');

  // 3. Toggle back to light mode and login
  await toggleBtn.click();
  await page.waitForTimeout(500);

  await page.fill('input[type="email"]', 'abalfazl@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '22_logged_in_dashboard.png') });
  console.log('Saved 22_logged_in_dashboard.png');

  await browser.close();
  console.log('Done.');
}

run().catch(console.error);
