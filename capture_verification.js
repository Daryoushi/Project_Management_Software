const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Context
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Fresh visit: Login screen (Brand logo & clean layout)
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '14_first_visit_auth.png') });
  console.log('Saved 14_first_visit_auth.png');

  // Login as Super Admin اباالفضل
  await page.fill('input[type="email"]', 'abalfazl@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '15_dashboard_templates.png') });
  console.log('Saved 15_dashboard_templates.png');

  // Click 'وظایف من' (My Tasks)
  await page.click('text=وظایف من');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '16_my_tasks_view.png') });
  console.log('Saved 16_my_tasks_view.png');

  // Go to project list view and open modal to verify Jalali picker & right scrollbar
  await page.click('text=توسعه سامانه جامع');
  await page.waitForTimeout(1000);
  const taskRow = page.locator('div:has-text("طراحی رابط کاربری داشبورد بر اساس Shadcn")').first();
  await taskRow.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '17_task_modal_jalali_scroll.png') });
  console.log('Saved 17_task_modal_jalali_scroll.png');

  // 2. Mobile Context (390 x 844 iPhone 14)
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000');
  await mobilePage.waitForTimeout(1500);
  await mobilePage.fill('input[type="email"]', 'abalfazl@example.com');
  await mobilePage.fill('input[type="password"]', 'password123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '18_mobile_home.png') });
  console.log('Saved 18_mobile_home.png');

  // Open mobile drawer with Hamburger button
  await mobilePage.click('button[aria-label="Toggle Navigation Menu"]');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '19_mobile_hamburger_drawer.png') });
  console.log('Saved 19_mobile_hamburger_drawer.png');

  await browser.close();
  console.log('All tests completed successfully!');
}

main().catch(console.error);
