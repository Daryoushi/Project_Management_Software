const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
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
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Home Dashboard
  await page.screenshot({ path: path.join(screenshotsDir, '1_home_dashboard.png'), fullPage: true });
  console.log('Captured 1_home_dashboard.png');

  // 2. Click project in sidebar
  const projectItem = page.locator('button:has-text("پروژه اول ابوالفضل")').first();
  if (await projectItem.isVisible()) {
    await projectItem.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '2_asana_list_view.png'), fullPage: true });
    console.log('Captured 2_asana_list_view.png');
  }

  // 3. Board View (Kanban)
  const boardButton = page.locator('button:has-text("تخته کانبان")').first();
  if (await boardButton.isVisible()) {
    await boardButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '3_kanban_board_view.png'), fullPage: true });
    console.log('Captured 3_kanban_board_view.png');
  }

  // 4. Timeline View
  const timelineButton = page.locator('button:has-text("تایم‌لاین")').first();
  if (await timelineButton.isVisible()) {
    await timelineButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '4_timeline_gantt_view.png'), fullPage: true });
    console.log('Captured 4_timeline_gantt_view.png');
  }

  // 5. Calendar View (Jalali)
  const calendarButton = page.locator('button:has-text("تقویم جلالی")').first();
  if (await calendarButton.isVisible()) {
    await calendarButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '5_jalali_calendar_view.png'), fullPage: true });
    console.log('Captured 5_jalali_calendar_view.png');
  }

  // 6. Dashboard View
  const dashboardButton = page.locator('button:has-text("داشبورد تحلیلی")').first();
  if (await dashboardButton.isVisible()) {
    await dashboardButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '6_project_analytics.png'), fullPage: true });
    console.log('Captured 6_project_analytics.png');
  }

  // 7. Click Task to open Modal
  const listButton = page.locator('button:has-text("فهرست")').first();
  if (await listButton.isVisible()) {
    await listButton.click();
    await page.waitForTimeout(1000);

    const taskRow = page.locator('text=task 1:').first();
    if (await taskRow.isVisible()) {
      await taskRow.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(screenshotsDir, '7_task_detail_modal.png') });
      console.log('Captured 7_task_detail_modal.png');
    }
  }

  // Close modal with Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 8. Open Workspace Team & Roles Modal
  const teamBtn = page.locator('button:has-text("مدیریت اعضا و نقش‌ها")').first();
  if (await teamBtn.isVisible()) {
    await teamBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '8_workspace_team_roles.png') });
    console.log('Captured 8_workspace_team_roles.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 9. English LTR Mode
  const langToggle = page.locator('button:has-text("EN")').first();
  if (await langToggle.isVisible()) {
    await langToggle.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '9_english_ltr_mode.png'), fullPage: true });
    console.log('Captured 9_english_ltr_mode.png');
  }

  await browser.close();
  console.log('ALL screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
