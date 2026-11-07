# -*- coding: utf-8 -*-
import sqlite3
import uuid
from datetime import datetime, timedelta
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import get_db, init_db

def seed(conn=None):
    should_close = False
    if conn is None:
        conn = get_db()
        should_close = True
    cur = conn.cursor()

    target_emails = [
        "abalfazl.daryoushii@gmail.com",
        "abalfazl.daryoushi37073@gmail.com",
        "abalfazl.daryoushi37073@gmail.co"
    ]

    # Ensure other teammates exist for demo
    teammates = [
        ("user-maryam", "maryam@example.com", "مریم راد", "project_manager"),
        ("user-ali", "ali@example.com", "علی رضایی", "member"),
        ("user-sara", "sara@example.com", "سارا تهرانی", "viewer")
    ]
    for uid, uemail, uname, urole in teammates:
        cur.execute("SELECT id FROM users WHERE id = ?", (uid,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO users (id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, theme, created_at)
                VALUES (?, ?, ?, '', ?, 'pbkdf2:sha256:dummy', 'fa', 'light', ?)
            """, (uid, uemail, uname, urole, datetime.utcnow().isoformat()))

    for target_email in target_emails:
        cur.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (target_email,))
        row = cur.fetchone()
        if row:
            user_id = row[0]
            cur.execute("UPDATE users SET full_name = 'اباالفضل داریوشی', global_role = 'admin' WHERE id = ?", (user_id,))
        else:
            user_id = f"user-{uuid.uuid4().hex[:8]}"
            now_str = datetime.utcnow().isoformat()
            cur.execute("""
                INSERT INTO users (id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, theme, created_at)
                VALUES (?, ?, 'اباالفضل داریوشی', '', 'admin', 'pbkdf2:sha256:dummy', 'fa', 'light', ?)
            """, (user_id, target_email, now_str))

        # 2. Create Workspace
        ws_id = f"ws-demo-{user_id[:8]}"
        cur.execute("SELECT id FROM workspaces WHERE id = ?", (ws_id,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
                VALUES (?, 'توسعه سامانه مدیریت پروژه و وظایف', 'فضای کاری سازمانی جهت مدیریت محصول و مهندسی نرم‌افزار', 'Briefcase', '#4F46E5', ?, ?)
            """, (ws_id, user_id, datetime.utcnow().isoformat()))

        # Workspace Members
        for uid, urole in [(user_id, "owner"), ("user-maryam", "project_manager"), ("user-ali", "member"), ("user-sara", "viewer")]:
            cur.execute("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (ws_id, uid))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (f"wm-{uuid.uuid4().hex[:8]}", ws_id, uid, urole, datetime.utcnow().isoformat()))

        # 3. Create Project linked to repo Daryoushi/Project_Management_Software
        proj_id = f"proj-taskflow-{user_id[:8]}"
        cur.execute("SELECT id FROM projects WHERE id = ?", (proj_id,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, github_repo_url, created_at)
                VALUES (?, ?, 'سامانه مدیریت پروژه تسک‌فلو (TaskFlow)', 'مدیریت و پیگیری چرخه‌حیات توسعه نرم‌افزار، اتصال مخازن گیت‌هاب و اتوماسیون وظایف تیمی', 'FolderKanban', '#3B82F6', 'active', ?, 'Daryoushi/Project_Management_Software', ?)
            """, (proj_id, ws_id, user_id, datetime.utcnow().isoformat()))

        # 4. Create Rich Tasks
        today = datetime.now()
        sample_tasks = [
            {
                "id": f"task-1-{user_id[:6]}",
                "title": "طراحی معماری میکروسرویس و اتصال سرویس‌ها به Vercel",
                "desc": "جداسازی فرانت‌اند Next.js و بک‌اند FastAPI به همراه کانفیگ vercel.json و دپلوی خودکار monorepo",
                "section": "Done",
                "status": "done",
                "priority": "urgent",
                "assignee": user_id,
                "start": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "due": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                "tags": '[{"name": "معماری", "color": "#6366F1"}, {"name": "زیرساخت", "color": "#10B981"}]',
                "subtasks": [
                    ("پیکربندی Rewrite های vercel.json برای سرویس بک‌اند", 1),
                    ("تنظیم CORS و مدیریت متغیرهای محیطی در Vercel", 1),
                    ("تست استقرار بدون کارت بانکی و با سرعت پاسخ‌دهی زیر ۱۰۰ میلی‌ثانیه", 1)
                ]
            },
            {
                "id": f"task-2-{user_id[:6]}",
                "title": "پیاده‌سازی پاپ‌آپ ماژولار تقویم شمسی جلالی و انتخابگر بازه زمانی",
                "desc": "نمایش تقویم بدون تداخل با اسکرول مودال با استفاده از React Portal و هایلایت روزهای جمعه",
                "section": "Done",
                "status": "done",
                "priority": "high",
                "assignee": user_id,
                "start": (today - timedelta(days=3)).strftime("%Y-%m-%d"),
                "due": (today).strftime("%Y-%m-%d"),
                "tags": '[{"name": "فرانت‌اند", "color": "#3B82F6"}, {"name": "تقویم", "color": "#EC4899"}]',
                "subtasks": [
                    ("طراحی کامپوننت JalaliDatePicker با قابلیت تغییر ماه و سال", 1),
                    ("رندر تقویم از طریق React Portal در body برای رفع Overflow", 1),
                    ("پشتیبانی از اعداد فارسی و هایلایت تعطیلات پایان هفته", 1)
                ]
            },
            {
                "id": f"task-3-{user_id[:6]}",
                "title": "یکپارچه‌سازی کامل گیت‌هاب هاب (GitHub Hub) و سینک دوطرفه ایشیوها",
                "desc": "اتصال به ریپازیتوری Daryoushi/Project_Management_Software، درون‌ریزی ایشیوها و بروزرسانی خودکار",
                "section": "Done",
                "status": "done",
                "priority": "urgent",
                "assignee": user_id,
                "start": (today - timedelta(days=4)).strftime("%Y-%m-%d"),
                "due": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
                "tags": '[{"name": "گیت‌هاب", "color": "#1F2937"}, {"name": "API", "color": "#8B5CF6"}]',
                "subtasks": [
                    ("احراز هویت از طریق GitHub OAuth و Personal Access Token", 1),
                    ("درون‌ریزی ایشیوها به عنوان تسک با حفظ وضعیت و برچسب‌ها", 1),
                    ("دکمه سینک آنی در ناوبار برای دریافت تغییرات جدید مخزن", 1)
                ]
            },
            {
                "id": f"task-4-{user_id[:6]}",
                "title": "طراحی داشبورد بینش‌های هوشمند، بهره‌وری تیمی و سلامت پروژه",
                "desc": "محاسبه دقیق درصد پیشرفت، نرخ تکمیل اسپرینت، نمودارهای تعاملی و پیش‌بینی تاخیرات",
                "section": "Doing",
                "status": "in_progress",
                "priority": "high",
                "assignee": "user-maryam",
                "start": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                "due": (today + timedelta(days=4)).strftime("%Y-%m-%d"),
                "tags": '[{"name": "داشبورد", "color": "#10B981"}, {"name": "هوش مصنوعی", "color": "#F59E0B"}]',
                "subtasks": [
                    ("طراحی ویجت‌های تحلیلی توزیع وظایف و بار کاری اعضا", 1),
                    ("محاسبه خودکار زمان تخمینی باقیمانده تا تحویل نهایی فاز", 0),
                    ("نمودار پیشرفت خطی اسپرینت با چارت‌های واکنش‌گرا", 0)
                ]
            },
            {
                "id": f"task-5-{user_id[:6]}",
                "title": "سیستم دعوت و ارجاع نقش‌ها با تأیید دوطرفه ایمیلی و درون‌برنامه‌ای",
                "desc": "بررسی عضویت کاربر در سامانه، ارسال ایمیل اعلان و نوتیفیکیشن درون‌برنامه‌ای با امکان پذیرش یا رد",
                "section": "Doing",
                "status": "in_progress",
                "priority": "medium",
                "assignee": user_id,
                "start": today.strftime("%Y-%m-%d"),
                "due": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
                "tags": '[{"name": "امنیت", "color": "#EF4444"}, {"name": "اعلان‌ها", "color": "#06B6D4"}]',
                "subtasks": [
                    ("بررسی وجود کاربر و خطای راهنما در صورت عدم ثبت‌نام", 1),
                    ("تولید نوتیفیکیشن اختصاصی با دکمه‌های پذیرش و رد", 1),
                    ("تثبیت نقش عضو و جلوگیری از تغییر نقش توسط خود کاربر", 1)
                ]
            },
            {
                "id": f"task-6-{user_id[:6]}",
                "title": "تست‌های نهایی E2E و ضبط ویدیوی معرفی محصول",
                "desc": "بررسی جامع گردش کار از ورود و ثبت‌نام تا مدیریت وظایف در نماهای کانبان، لیست و تایم‌لاین گانت",
                "section": "To do",
                "status": "todo",
                "priority": "high",
                "assignee": user_id,
                "start": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
                "due": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
                "tags": '[{"name": "ارائه", "color": "#F97316"}, {"name": "ویدیو", "color": "#8B5CF6"}]',
                "subtasks": [
                    ("آماده‌سازی سناریوی سناریوی ۵ دقیقه‌ای معرفی قابلیت‌ها", 1),
                    ("شبیه‌سازی دعوت همکار و همگام‌سازی ریپازیتوری گیت‌هاب", 0),
                    ("ضبط و تدوین نسخه باکیفیت ویدیوی دمو", 0)
                ]
            },
            {
                "id": f"task-7-{user_id[:6]}",
                "title": "بهینه‌سازی سرعت و لود تنبل تسک‌ها (Pagination & Infinite Scroll)",
                "desc": "محدود کردن نمایش به ۱۰ آیتم اول برای حفظ حداکثر سرعت رندر و دکمه بارگذاری موارد بیشتر",
                "section": "Done",
                "status": "done",
                "priority": "medium",
                "assignee": "user-ali",
                "start": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                "due": (today).strftime("%Y-%m-%d"),
                "tags": '[{"name": "کارایی", "color": "#10B981"}]',
                "subtasks": [
                    ("اعمال لیمیت ۱۰ تسک در نمای برد کانبان با Load More", 1),
                    ("اعمال لیمیت ۱۰ تسک در نمای فهرست و تایم‌لاین", 1),
                    ("بهینه‌سازی کوئری‌های مخازن گیت‌هاب", 1)
                ]
            }
        ]

        for t_data in sample_tasks:
            cur.execute("SELECT id FROM tasks WHERE id = ?", (t_data["id"],))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO tasks (id, project_id, title, description, status, section, priority, assignee_id, reporter_id, start_date, due_date, tags, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t_data["id"],
                    proj_id,
                    t_data["title"],
                    t_data["desc"],
                    t_data["status"],
                    t_data["section"],
                    t_data["priority"],
                    t_data["assignee"],
                    user_id,
                    t_data["start"],
                    t_data["due"],
                    t_data["tags"],
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat()
                ))

                for st_title, st_done in t_data["subtasks"]:
                    cur.execute("""
                        INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at)
                        VALUES (?, ?, ?, ?, 0, ?)
                    """, (f"sub-{uuid.uuid4().hex[:8]}", t_data["id"], st_title, st_done, datetime.utcnow().isoformat()))

        # Sample invitation notification so the user can demonstrate acceptance
        sample_inv_id = f"inv-demo-{user_id[:6]}"
        cur.execute("SELECT id FROM workspace_invitations WHERE id = ?", (sample_inv_id,))
        if not cur.fetchone():
            now_str = datetime.utcnow().isoformat()
            cur.execute("""
                INSERT INTO workspace_invitations (id, workspace_id, inviter_id, invitee_id, invitee_email, role, status, created_at, updated_at)
                VALUES (?, ?, 'user-maryam', ?, ?, 'admin', 'pending', ?, ?)
            """, (sample_inv_id, ws_id, user_id, target_email, now_str, now_str))

            cur.execute("""
                INSERT INTO notifications (id, user_id, title, message, link, type, is_read, created_at)
                VALUES (?, ?, 'دعوت به همکاری در پروژه', 'شما توسط «مریم راد» به فضای کاری «توسعه سامانه مدیریت پروژه و وظایف» با نقش «مدیر ارشد» دعوت شدید.', ?, 'workspace_invitation', 0, ?)
            """, (f"notif-inv-{user_id[:6]}", user_id, f"invitation:{sample_inv_id}", now_str))

        print(f"Seed complete for user: {user_id} ({target_email})")

    conn.commit()
    if should_close:
        conn.close()

if __name__ == "__main__":
    seed()
