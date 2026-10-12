from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime
from app.database import get_db
from app.schemas import WorkspaceCreate, WorkspaceMemberAdd
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])

@router.get("")
def get_user_workspaces(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT w.*, wm.role as user_role
        FROM workspaces w
        JOIN workspace_members wm ON w.id = wm.workspace_id
        WHERE wm.user_id = ?
        ORDER BY w.created_at DESC
    """, (current_user["id"],))
    workspaces = [dict(row) for row in cursor.fetchall()]

    for ws in workspaces:
        # Count projects
        cursor.execute("SELECT COUNT(*) FROM projects WHERE workspace_id = ?", (ws["id"],))
        ws["projects_count"] = cursor.fetchone()[0]
        # Count members
        cursor.execute("SELECT COUNT(*) FROM workspace_members WHERE workspace_id = ?", (ws["id"],))
        ws["members_count"] = cursor.fetchone()[0]

    conn.close()
    return workspaces

@router.post("")
def create_workspace(ws_data: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    ws_id = f"ws-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (ws_id, ws_data.name, ws_data.description or "", ws_data.icon or "Briefcase", ws_data.color or "#4F46E5", current_user["id"], now_str))

    # Add creator as owner
    cursor.execute("""
        INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), ws_id, current_user["id"], "owner", now_str))

    conn.commit()

    cursor.execute("SELECT * FROM workspaces WHERE id = ?", (ws_id,))
    new_ws = dict(cursor.fetchone())
    new_ws["user_role"] = "owner"
    new_ws["projects_count"] = 0
    new_ws["members_count"] = 1
    conn.close()
    return new_ws

@router.get("/{workspace_id}/members")
def get_workspace_members(workspace_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT wm.id as membership_id, wm.role, wm.joined_at, u.id as user_id, u.email, u.full_name, u.avatar_url, u.global_role
        FROM workspace_members wm
        JOIN users u ON wm.user_id = u.id
        WHERE wm.workspace_id = ?
    """, (workspace_id,))
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return members

@router.post("/{workspace_id}/members")
def add_workspace_member(workspace_id: str, member_data: WorkspaceMemberAdd, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    # Check permission
    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, current_user["id"]))
    row = cursor.fetchone()
    if not row or row["role"] not in ["owner", "admin", "project_manager"]:
        conn.close()
        raise HTTPException(status_code=403, detail="فقط مدیران ارشد و مدیران پروژه مجاز به افزودن یا تعیین نقش عضو هستند.")

    target_user_id = member_data.user_id
    if not target_user_id and member_data.email:
        cursor.execute("SELECT id FROM users WHERE email = ?", (member_data.email,))
        u = cursor.fetchone()
        if not u:
            conn.close()
            raise HTTPException(status_code=404, detail="کاربری با این ایمیل یافت نشد.")
        target_user_id = u["id"]

    if not target_user_id:
        conn.close()
        raise HTTPException(status_code=400, detail="شناسه کاربر یا ایمیل الزامی است.")

    # Check if already member
    cursor.execute("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, target_user_id))
    if cursor.fetchone():
        # Update role
        cursor.execute("UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?", (member_data.role, workspace_id, target_user_id))
    else:
        now_str = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), workspace_id, target_user_id, member_data.role, now_str))

    conn.commit()
    conn.close()
    return {"message": "عضو با موفقیت به فضای کاری اضافه یا بروزرسانی شد."}

@router.delete("/{workspace_id}/members/{user_id}")
def remove_workspace_member(workspace_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, current_user["id"]))
    row = cursor.fetchone()
    if not row or row["role"] not in ["owner", "admin", "project_manager"]:
        conn.close()
        raise HTTPException(status_code=403, detail="شما دسترسی حذف اعضا را ندارید.")

    cursor.execute("DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "عضو با موفقیت از فضای کاری حذف شد."}
