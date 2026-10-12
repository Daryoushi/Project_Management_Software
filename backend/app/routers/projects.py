from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
import uuid
from datetime import datetime
from app.database import get_db
from app.schemas import ProjectCreate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("")
def get_projects(workspace_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    if workspace_id:
        cursor.execute("""
            SELECT p.*, w.name as workspace_name
            FROM projects p
            JOIN workspaces w ON p.workspace_id = w.id
            WHERE p.workspace_id = ?
            ORDER BY p.created_at DESC
        """, (workspace_id,))
    else:
        cursor.execute("""
            SELECT p.*, w.name as workspace_name
            FROM projects p
            JOIN workspaces w ON p.workspace_id = w.id
            JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE wm.user_id = ?
            ORDER BY p.created_at DESC
        """, (current_user["id"],))

    projects = [dict(row) for row in cursor.fetchall()]

    for proj in projects:
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE project_id = ?", (proj["id"],))
        proj["tasks_count"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE project_id = ? AND status = 'done'", (proj["id"],))
        proj["completed_tasks_count"] = cursor.fetchone()[0]

    conn.close()
    return projects

@router.get("/{project_id}")
def get_project_detail(project_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.*, w.name as workspace_name
        FROM projects p
        JOIN workspaces w ON p.workspace_id = w.id
        WHERE p.id = ?
    """, (project_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="پروژه یافت نشد")

    proj = dict(row)

    # Get project stats
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE project_id = ?", (project_id,))
    proj["tasks_count"] = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE project_id = ? AND status = 'done'", (project_id,))
    proj["completed_tasks_count"] = cursor.fetchone()[0]

    conn.close()
    return proj

@router.post("")
def create_project(proj_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    # Check permission in workspace
    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (proj_data.workspace_id, current_user["id"]))
    row = cursor.fetchone()
    if not row or row["role"] == "viewer":
        conn.close()
        raise HTTPException(status_code=403, detail="مشاهده‌گر نمی‌تواند پروژه جدید ایجاد کند.")

    proj_id = f"proj-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    """, (proj_id, proj_data.workspace_id, proj_data.name, proj_data.description or "", proj_data.icon or "FolderKanban", proj_data.color or "#6366F1", current_user["id"], now_str))

    conn.commit()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (proj_id,))
    new_proj = dict(cursor.fetchone())
    new_proj["tasks_count"] = 0
    new_proj["completed_tasks_count"] = 0
    conn.close()
    return new_proj

@router.delete("/{project_id}")
def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT owner_id, workspace_id FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="پروژه یافت نشد")

    # Check if owner or workspace admin
    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (row["workspace_id"], current_user["id"]))
    wm = cursor.fetchone()
    if row["owner_id"] != current_user["id"] and (not wm or wm["role"] not in ["owner", "admin"]):
        conn.close()
        raise HTTPException(status_code=403, detail="دسترسی حذف این پروژه را ندارید.")

    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"message": "پروژه با موفقیت حذف گردید."}

@router.get("/{project_id}/stats")
def get_project_stats(project_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    # Task counts by status
    cursor.execute("SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status", (project_id,))
    status_counts = {r["status"]: r["count"] for r in cursor.fetchall()}

    # Task counts by priority
    cursor.execute("SELECT priority, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY priority", (project_id,))
    priority_counts = {r["priority"]: r["count"] for r in cursor.fetchall()}

    # Workload by assignee
    cursor.execute("""
        SELECT u.id, u.full_name, u.avatar_url, COUNT(t.id) as task_count
        FROM tasks t
        JOIN users u ON t.assignee_id = u.id
        WHERE t.project_id = ?
        GROUP BY u.id
    """, (project_id,))
    workload = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "status_distribution": status_counts,
        "priority_distribution": priority_counts,
        "team_workload": workload
    }
