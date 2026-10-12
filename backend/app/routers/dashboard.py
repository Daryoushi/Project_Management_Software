from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    user_id = current_user["id"]
    now_date = datetime.utcnow().strftime("%Y-%m-%d")

    # Tasks assigned to user
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE assignee_id = ?", (user_id,))
    total_assigned = cursor.fetchone()[0]

    # Completed tasks
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND status = 'done'", (user_id,))
    completed_tasks = cursor.fetchone()[0]

    # Overdue tasks
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND status != 'done' AND due_date < ?", (user_id, now_date))
    overdue_tasks = cursor.fetchone()[0]

    # Total projects user has access to
    cursor.execute("""
        SELECT COUNT(DISTINCT p.id)
        FROM projects p
        JOIN workspaces w ON p.workspace_id = w.id
        JOIN workspace_members wm ON w.id = wm.workspace_id
        WHERE wm.user_id = ?
    """, (user_id,))
    projects_count = cursor.fetchone()[0]

    # Total collaborators across workspaces
    cursor.execute("""
        SELECT COUNT(DISTINCT wm2.user_id)
        FROM workspace_members wm1
        JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
        WHERE wm1.user_id = ? AND wm2.user_id != ?
    """, (user_id, user_id))
    collaborators_count = cursor.fetchone()[0]

    # Unread notifications
    cursor.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,))
    unread_notifications = cursor.fetchone()[0]

    conn.close()

    return {
        "user_name": current_user["full_name"],
        "total_assigned": total_assigned,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "projects_count": projects_count,
        "collaborators_count": collaborators_count,
        "unread_notifications": unread_notifications,
        "ai_recommendations": [
            {
                "title": "نویسنده محتوا و مستندات (Content Writer AI)",
                "description": "تهیه پیش‌نویس خودکار تسک‌ها، شرح نیازمندی‌ها و خلاصه‌سازی گزارش‌های هفتگی پروژه بر اساس دیتا.",
                "badge": "محبوب / Popular",
                "color": "#3B82F6"
            },
            {
                "title": "دستیار پایش ریسک و اسپرینت (Sprint Copilot AI)",
                "description": "شناسایی تسک‌های در معرض تاخیر، بازتوزیع حجم کاری بین اعضا و پیشنهاد تاریخ‌های تحویل منطقی.",
                "badge": "هوشمند / Smart",
                "color": "#10B981"
            }
        ]
    }

@router.get("/notifications")
def get_notifications(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    """, (current_user["id"],))
    notifs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return notifs

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (notif_id, current_user["id"]))
    conn.commit()
    conn.close()
    return {"message": "خوانده شد"}

@router.post("/notifications/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (current_user["id"],))
    conn.commit()
    conn.close()
    return {"message": "تمام اعلان‌ها خوانده شدند"}
