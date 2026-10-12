import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # 1. First Visit (Must show login screen with BrandLogo)
        await page.goto('http://localhost:3000')
        await page.wait_for_timeout(2000)
        await page.screenshot(path='C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda/14_first_visit_auth.png')
        print("Captured 14_first_visit_auth.png")

        # 2. Login as Super Admin اباالفضل
        await page.fill('input[type="email"]', 'abalfazl@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)
        await page.screenshot(path='C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda/15_dashboard_templates.png')
        print("Captured 15_dashboard_templates.png")

        # 3. Test 'وظایف من' (My Tasks)
        await page.click('text=وظایف من')
        await page.wait_for_timeout(1500)
        await page.screenshot(path='C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda/16_my_tasks_view.png')
        print("Captured 16_my_tasks_view.png")

        # 4. Open task detail to verify Jalali Date Picker and right-side scrollbar
        await page.click('text=لیست وظایف')
        await page.wait_for_timeout(1000)
        task_item = page.locator('div:has-text("طراحی رابط کاربری داشبورد بر اساس Shadcn")').first
        await task_item.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path='C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda/17_task_modal_jalali_scroll.png')
        print("Captured 17_task_modal_jalali_scroll.png")

        # 5. Test Mobile Viewport & Hamburger Menu
        mobile_context = await browser.new_context(viewport={'width': 390, 'height': 844})
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto('http://localhost:3000')
        await mobile_page.fill('input[type="email"]', 'abalfazl@example.com')
        await mobile_page.fill('input[type="password"]', 'password123')
        await mobile_page.click('button[type="submit"]')
        await mobile_page.wait_for_timeout(2000)
        await mobile_page.screenshot(path='C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda/18_mobile_home.png')
        print("Captured 18_mobile_home.png")

        # Click hamburger button
        await mobile_page.click('button[aria-label="Toggle Navigation Menu"]')
        await mobile_page.wait_for_timeout(1000)
        await mobile_page.screenshot(path='C:/Users/Abalfazl Daryoushi/.gemini/antigravity/brain/8f14d53b-fcb5-4ad2-a6c3-97a9da637bda/19_mobile_hamburger_drawer.png')
        print("Captured 19_mobile_hamburger_drawer.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(verify())
