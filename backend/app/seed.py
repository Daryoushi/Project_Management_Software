import uuid
from datetime import datetime, timedelta
from app.database import get_db, init_db
from app.auth import hash_password

def seed_database():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    now = datetime.utcnow()
    now_str = now.isoformat()

    # Users
    users_data = [
        {
            "id": "user-abalfazl",
            "email": "abalfazl@example.com",
            "full_name": "اباالفضل داریوشی (Abalfazl)",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
            "global_role": "super_admin",
            "password": "password123",
            "preferred_lang": "fa"
        },
        {
            "id": "user-maryam",
            "email": "maryam@example.com",
            "full_name": "مریم راد (Maryam Rad)",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
            "global_role": "project_manager",
            "password": "password123",
            "preferred_lang": "fa"
        },
        {
            "id": "user-ali",
            "email": "ali@example.com",
            "full_name": "علی رضایی (Ali Rezaei)",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
            "global_role": "member",
            "password": "password123",
            "preferred_lang": "fa"
        },
        {
            "id": "user-sara",
            "email": "sara@example.com",
            "full_name": "سارا تهرانی (Sara Tehrani)",
            "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
            "global_role": "viewer",
            "password": "password123",
            "preferred_lang": "fa"
        }
    ]

    for u in users_data:
        cursor.execute("""
            INSERT INTO users (id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            u["id"], u["email"], u["full_name"], u["avatar_url"],
            u["global_role"], hash_password(u["password"]), u["preferred_lang"], now_str
        ))

    # Workspace 1: Main workspace
    ws_id = "ws-main"
    cursor.execute("""
        INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        ws_id, "استارکوچ / StarKooch Workspace",
        "فضای کاری اصلی تیم مدیریت پروژه و توسعه محصول",
        "Briefcase", "#6366F1", "user-abalfazl", now_str
    ))

    # Workspace 2: Dev team workspace
    ws_id2 = "ws-dev"
    cursor.execute("""
        INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        ws_id2, "تیم نرم‌افزار / Software Team",
        "فضای تخصصی تیم مهندسی نرم‌افزار و زیرساخت",
        "Layers", "#06B6D4", "user-abalfazl", now_str
    ))

    # Workspace members
    members = [
        (str(uuid.uuid4()), ws_id, "user-abalfazl", "owner", now_str),
        (str(uuid.uuid4()), ws_id, "user-maryam", "project_manager", now_str),
        (str(uuid.uuid4()), ws_id, "user-ali", "member", now_str),
        (str(uuid.uuid4()), ws_id, "user-sara", "viewer", now_str),
        (str(uuid.uuid4()), ws_id2, "user-abalfazl", "owner", now_str),
        (str(uuid.uuid4()), ws_id2, "user-maryam", "project_manager", now_str),
        (str(uuid.uuid4()), ws_id2, "user-ali", "member", now_str),
    ]
    cursor.executemany("""
        INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    """, members)

    # Project 1: Asana match "Abalfazl's first project"
    proj_id1 = "proj-first"
    cursor.execute("""
        INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        proj_id1, ws_id, "پروژه اول اباالفضل (Abalfazl's first project)",
        "پیاده‌سازی پلتفرم جامع مدیریت تسک‌ها و کنترل کیفی پروژه",
        "Sparkles", "#4F46E5", "active", "user-abalfazl", now_str
    ))

    # Project 2: Billing System Dev
    proj_id2 = "proj-billing"
    cursor.execute("""
        INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        proj_id2, ws_id2, "توسعه سیستم مالی و اشتراک (Billing System Dev)",
        "ماژول صدور فاکتور، درگاه‌های بانکی و اشتراک‌های سازمانی",
        "CreditCard", "#10B981", "active", "user-maryam", now_str
    ))

    # Tasks for Project 1 (matching Asana screenshot)
    tasks_data = [
        {
            "id": "task-1",
            "project_id": proj_id1,
            "title": "task 1: طراحی معماری پایگاه داده و احراز هویت با سطوح دسترسی",
            "description": "ایجاد مدل‌های داده کاربران، فضاهای کاری، سطوح دسترسی RBAC و سیستم توکن‌های امن JWT به همراه تست یکپارچگی.",
            "status": "todo",
            "section": "To do",
            "priority": "low",
            "assignee_id": "user-abalfazl",
            "start_date": (now).strftime("%Y-%m-%d"),
            "due_date": (now + timedelta(days=3)).strftime("%Y-%m-%d"),
            "tags": '[{"name": "Architecture", "color": "#3B82F6"}, {"name": "On track", "color": "#10B981"}]',
            "subtasks": ["طراحی دیاگرام ERD", "پیاده‌سازی مدل‌های دیتابیس", "تست نقش‌های کاربری"],
            "comments": [
                ("user-abalfazl", "معماری اولیه جداول بررسی شد و استانداردهای RBAC به دقت پیاده‌سازی شدند.")
            ]
        },
        {
            "id": "task-2",
            "project_id": proj_id1,
            "title": "task 2: پیاده‌سازی رابط کاربری مدرن با Shadcn و پشتیبانی کامل RTL",
            "description": "پیاده‌سازی کامپوننت‌های مدرن شبیه آسانا و ترلو همراه با تقویم شمسی جلالی و تم تاریک/روشن یکپارچه.",
            "status": "in_progress",
            "section": "Doing",
            "priority": "medium",
            "assignee_id": "user-abalfazl",
            "start_date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
            "due_date": (now + timedelta(days=4)).strftime("%Y-%m-%d"),
            "tags": '[{"name": "Frontend", "color": "#8B5CF6"}, {"name": "At risk", "color": "#F59E0B"}]',
            "subtasks": ["نصب و پیکربندی Shadcn/UI", "طراحی ویوهای پنج‌گانه (List, Board, Timeline, Calendar, Dashboard)", "تطبیق فونت وزیرمتن و استایل‌های RTL"],
            "comments": [
                ("user-maryam", "لطفا دقت کنید در نمای تقویم روزهای تعطیل و تقویم شمسی به درستی مشخص شوند."),
                ("user-abalfazl", "بله حتما، ماژول تقویم جلالی با دیت‌های شمسی بهینه‌سازی شد.")
            ]
        },
        {
            "id": "task-3",
            "project_id": proj_id1,
            "title": "task 3: نمای کانبان و درگ اند دراپ با انیمیشن‌های روان",
            "description": "قابلیت جابجایی کارت‌های تسک بین ستون‌ها، فیلتر پیشرفته بر اساس برچسب‌ها و افراد مسئول، همراه با انیمیشن‌های Framer Motion.",
            "status": "todo",
            "section": "To do",
            "priority": "high",
            "assignee_id": "user-ali",
            "start_date": (now + timedelta(days=1)).strftime("%Y-%m-%d"),
            "due_date": (now + timedelta(days=5)).strftime("%Y-%m-%d"),
            "tags": '[{"name": "UI/UX", "color": "#EC4899"}, {"name": "Off track", "color": "#EF4444"}]',
            "subtasks": ["ایجاد ستون‌های کانبان پویا", "قابلیت افزودن سریع تسک در ستون", "انیمیشن جابجایی"],
            "comments": [
                ("user-ali", "در حال بررسی استیت منیجمنت کانبان هستیم.")
            ]
        },
        {
            "id": "task-4",
            "project_id": proj_id1,
            "title": "task 4: نمای تایم‌لاین و گانت چارت پیشرفته",
            "description": "رسم برنامه زمانی وظایف و تسک‌ها بر روی خط زمان بر اساس تاریخ شروع و سررسید برای مانیتورینگ پروژه.",
            "status": "done",
            "section": "Done",
            "priority": "urgent",
            "assignee_id": "user-abalfazl",
            "start_date": (now - timedelta(days=4)).strftime("%Y-%m-%d"),
            "due_date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
            "tags": '[{"name": "Timeline", "color": "#10B981"}]',
            "subtasks": ["محاسبه بازه زمانی", "رندر نوارهای گانت", "تست ریسپانسیو"],
            "comments": []
        },
        {
            "id": "task-5",
            "project_id": proj_id2,
            "title": "اتصال به درگاه زرین‌پال و مدیریت اشتراک‌های سازمانی",
            "description": "پیاده‌سازی وب‌هوک‌های پرداخت و ثبت لاگ‌های مالی با امکان صدور پیش‌فاکتور رسمی به ریال و تومان.",
            "status": "in_progress",
            "section": "Doing",
            "priority": "high",
            "assignee_id": "user-maryam",
            "start_date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
            "due_date": (now + timedelta(days=6)).strftime("%Y-%m-%d"),
            "tags": '[{"name": "Fintech", "color": "#F59E0B"}]',
            "subtasks": ["پیاده‌سازی رکوئست توکن", "هندل کردن کال‌بک", "تولید رسید PDF"],
            "comments": []
        }
    ]

    for t in tasks_data:
        cursor.execute("""
            INSERT INTO tasks (
                id, project_id, title, description, status, section, priority,
                assignee_id, reporter_id, start_date, due_date, tags, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t["id"], t["project_id"], t["title"], t["description"], t["status"],
            t["section"], t["priority"], t["assignee_id"], "user-abalfazl",
            t["start_date"], t["due_date"], t["tags"], now_str, now_str
        ))

        # Add subtasks
        for idx, sub in enumerate(t["subtasks"]):
            sub_id = str(uuid.uuid4())
            is_comp = 1 if t["status"] == "done" or idx == 0 else 0
            cursor.execute("""
                INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (sub_id, t["id"], sub, is_comp, idx, now_str))

        # Add comments
        for author_id, comment_text in t["comments"]:
            comm_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO comments (id, task_id, user_id, content, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (comm_id, t["id"], author_id, comment_text, now_str))

    # Add initial notification
    cursor.execute("""
        INSERT INTO notifications (id, user_id, title, message, link, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        str(uuid.uuid4()), "user-abalfazl",
        "به سامانه مدیریت پروژه خوش آمدید!",
        "فضای کاری 'استارکوچ' و پروژه 'پروژه اول ابوالفضل' برای شما آماده است.",
        "/projects/proj-first", "info", now_str
    ))

    conn.commit()
    conn.close()
    print("Database successfully seeded with realistic enterprise data!")

if __name__ == "__main__":
    seed_database()
