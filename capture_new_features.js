const { chromium } = require('playwright');
const path = require('path');
const ARTIFACT_DIR = 'C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Visit Login screen (Split layout with feature showcase)
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '23_split_layout_login.png') });
  console.log('Saved 23_split_layout_login.png');

  // 2. Click register tab to verify email verification code input
  await page.click('button:has-text("ثبت‌نام کاربر جدید")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '24_register_email_code.png') });
  console.log('Saved 24_register_email_code.png');

  // 3. Switch back to login, test forgot password
  await page.click('button:has-text("ورود به حساب کاربری")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("فراموشی رمز عبور؟")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '25_forgot_password_view.png') });
  console.log('Saved 25_forgot_password_view.png');

  // 4. Back to login and submit credentials
  await page.click('button:has-text("بازگشت به ورود")');
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'abalfazl@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '26_clean_dashboard_no_parentheses.png') });
  console.log('Saved 26_clean_dashboard_no_parentheses.png');

  // 5. Open user profile modal to verify photo upload and name edit
  await page.click('text=اباالفضل داریوشی');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '27_user_profile_edit_modal.png') });
  console.log('Saved 27_user_profile_edit_modal.png');

  await browser.close();
  console.log('Verification finished successfully.');
}

main().catch(console.error);
