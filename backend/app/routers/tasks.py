from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
import uuid
import json
from datetime import datetime
from app.database import get_db
from app.schemas import TaskCreate, TaskUpdate, SubtaskCreate, SubtaskUpdate, CommentCreate, AttachmentCreate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("")
def get_tasks(
    project_id: Optional[str] = None,
    assignee_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT t.*,
               u.full_name as assignee_name, u.avatar_url as assignee_avatar,
               r.full_name as reporter_name,
               p.name as project_name, p.color as project_color
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users r ON t.reporter_id = r.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE 1=1
    """
    params = []

    if project_id:
        query += " AND t.project_id = ?"
        params.append(project_id)
    if assignee_id:
        query += " AND t.assignee_id = ?"
        params.append(assignee_id)
    if status:
        query += " AND t.status = ?"
        params.append(status)
    if search:
        query += " AND (t.title LIKE ? OR t.description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY t.position ASC, t.created_at DESC"
    cursor.execute(query, params)
    tasks = [dict(row) for row in cursor.fetchall()]

    for t in tasks:
        # Parse tags
        try:
            t["tags"] = json.loads(t["tags"]) if t["tags"] else []
        except Exception:
            t["tags"] = []

        # Count subtasks
        cursor.execute("SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed FROM subtasks WHERE task_id = ?", (t["id"],))
        sub_row = cursor.fetchone()
        t["subtasks_count"] = sub_row["total"] or 0
        t["subtasks_completed"] = sub_row["completed"] or 0

        # Count comments
        cursor.execute("SELECT COUNT(*) FROM comments WHERE task_id = ?", (t["id"],))
        t["comments_count"] = cursor.fetchone()[0]

    conn.close()
    return tasks

@router.get("/my-tasks")
def get_my_tasks(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT t.*,
               u.full_name as assignee_name, u.avatar_url as assignee_avatar,
               p.name as project_name, p.color as project_color
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.assignee_id = ?
        ORDER BY t.due_date ASC, t.created_at DESC
    """, (current_user["id"],))
    tasks = [dict(row) for row in cursor.fetchall()]

    now_date = datetime.utcnow().strftime("%Y-%m-%d")
    categorized = {
        "today": [],
        "upcoming": [],
        "overdue": [],
        "completed": []
    }

    for t in tasks:
        try:
            t["tags"] = json.loads(t["tags"]) if t["tags"] else []
        except Exception:
            t["tags"] = []

        if t["status"] == "done":
            categorized["completed"].append(t)
        elif t["due_date"] and t["due_date"] < now_date:
            categorized["overdue"].append(t)
        elif t["due_date"] and t["due_date"] == now_date:
            categorized["today"].append(t)
        else:
            categorized["upcoming"].append(t)

    conn.close()
    return categorized

@router.get("/{task_id}")
def get_task_detail(task_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT t.*,
               u.full_name as assignee_name, u.avatar_url as assignee_avatar,
               r.full_name as reporter_name,
               p.name as project_name, p.color as project_color
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users r ON t.reporter_id = r.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
    """, (task_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="تسک مورد نظر یافت نشد")

    task = dict(row)
    try:
        task["tags"] = json.loads(task["tags"]) if task["tags"] else []
    except Exception:
        task["tags"] = []

    # Get subtasks
    cursor.execute("SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC, created_at ASC", (task_id,))
    task["subtasks"] = [dict(r) for r in cursor.fetchall()]

    # Get comments
    cursor.execute("""
        SELECT c.*, u.full_name as user_name, u.avatar_url as user_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ?
        ORDER BY c.created_at ASC
    """, (task_id,))
    task["comments"] = [dict(r) for r in cursor.fetchall()]

    # Get attachments
    cursor.execute("SELECT * FROM task_attachments WHERE task_id = ? ORDER BY created_at DESC", (task_id,))
    task["attachments"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return task

@router.post("")
def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    task_id = f"task-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()
    tags_json = json.dumps(task_data.tags or [])

    # Map status to section if not specified
    section = task_data.section or ("To do" if task_data.status == "todo" else ("Doing" if task_data.status == "in_progress" else "Done"))

    cursor.execute("""
        INSERT INTO tasks (
            id, project_id, title, description, status, section, priority,
            assignee_id, reporter_id, start_date, due_date, estimated_hours, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task_id, task_data.project_id, task_data.title, task_data.description or "",
        task_data.status or "todo", section, task_data.priority or "medium",
        task_data.assignee_id, current_user["id"],
        task_data.start_date, task_data.due_date, task_data.estimated_hours or 0,
        tags_json, now_str, now_str
    ))

    # Send notification if assigned
    if task_data.assignee_id and task_data.assignee_id != current_user["id"]:
        cursor.execute("""
            INSERT INTO notifications (id, user_id, title, message, link, type, created_at)
            VALUES (?, ?, ?, ?, ?, 'task_assigned', ?)
        """, (
            str(uuid.uuid4()), task_data.assignee_id,
            "تسک جدید به شما محول شد",
            f"تسک '{task_data.title}' توسط {current_user['full_name']} به شما ارجاع گردید.",
            f"/projects/{task_data.project_id}", now_str
        ))

    conn.commit()
    conn.close()
    return get_task_detail(task_id, current_user)

@router.put("/{task_id}")
def update_task(task_id: str, update_data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="تسک یافت نشد")

    fields = []
    params = []

    for k, v in update_data.model_dump(exclude_unset=True).items():
        if k == "tags" and v is not None:
            fields.append("tags = ?")
            params.append(json.dumps(v))
        elif v is not None:
            fields.append(f"{k} = ?")
            params.append(v)

    if fields:
        fields.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(task_id)
        cursor.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?", params)
        conn.commit()

    conn.close()
    return get_task_detail(task_id, current_user)

@router.delete("/{task_id}")
def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "تسک با موفقیت حذف گردید."}

@router.post("/{task_id}/subtasks")
def add_subtask(task_id: str, sub: SubtaskCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    sub_id = f"sub-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at)
        VALUES (?, ?, ?, 0, 0, ?)
    """, (sub_id, task_id, sub.title, now_str))
    conn.commit()
    conn.close()
    return {"id": sub_id, "title": sub.title, "is_completed": 0}

@router.put("/{task_id}/subtasks/{subtask_id}")
def update_subtask(task_id: str, subtask_id: str, update_data: SubtaskUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    if update_data.is_completed is not None:
        cursor.execute("UPDATE subtasks SET is_completed = ? WHERE id = ? AND task_id = ?", (1 if update_data.is_completed else 0, subtask_id, task_id))
    if update_data.title is not None:
        cursor.execute("UPDATE subtasks SET title = ? WHERE id = ? AND task_id = ?", (update_data.title, subtask_id, task_id))
    conn.commit()
    conn.close()
    return {"message": "زیرتسک بروزرسانی شد"}

@router.delete("/{task_id}/subtasks/{subtask_id}")
def delete_subtask(task_id: str, subtask_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM subtasks WHERE id = ? AND task_id = ?", (subtask_id, task_id))
    conn.commit()
    conn.close()
    return {"message": "زیرتسک حذف شد"}

@router.post("/{task_id}/comments")
def add_comment(task_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    comm_id = f"comm-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO comments (id, task_id, user_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (comm_id, task_id, current_user["id"], comment_data.content, now_str))

    # Notify assignee if someone else comments
    cursor.execute("SELECT assignee_id, title, project_id FROM tasks WHERE id = ?", (task_id,))
    t_row = cursor.fetchone()
    if t_row and t_row["assignee_id"] and t_row["assignee_id"] != current_user["id"]:
        cursor.execute("""
            INSERT INTO notifications (id, user_id, title, message, link, type, created_at)
            VALUES (?, ?, ?, ?, ?, 'comment', ?)
        """, (
            str(uuid.uuid4()), t_row["assignee_id"],
            "نظر جدید در تسک شما",
            f"{current_user['full_name']} در تسک '{t_row['title']}' نظری ثبت کرد.",
            f"/projects/{t_row['project_id']}", now_str
        ))

    conn.commit()
    conn.close()
    return {
        "id": comm_id,
        "task_id": task_id,
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_avatar": current_user["avatar_url"],
        "content": comment_data.content,
        "created_at": now_str
    }

@router.post("/{task_id}/attachments")
def add_attachment(task_id: str, att_data: AttachmentCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    att_id = f"att-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO task_attachments (id, task_id, user_id, file_name, file_size, file_url, file_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (att_id, task_id, current_user["id"], att_data.file_name, att_data.file_size, att_data.file_url, att_data.file_type or "file", now_str))
    conn.commit()
    conn.close()
    return {"id": att_id, "file_name": att_data.file_name, "file_url": att_data.file_url}
