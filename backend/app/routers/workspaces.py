from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime
from app.database import get_db
from app.schemas import WorkspaceCreate, WorkspaceMemberAdd
from app.routers.auth import get_current_user
from app.email_service import send_invitation_email

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])

ROLE_TITLES = {
    "owner": "مالک فضای کاری",
    "admin": "مدیر ارشد",
    "project_manager": "مدیر پروژه",
    "member": "عضو تیم",
    "viewer": "مشاهده‌گر"
}

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

    # If user has no workspaces, automatically ensure a default workspace exists
    if not workspaces:
        ws_id = f"ws-{uuid.uuid4().hex[:8]}"
        now_str = datetime.utcnow().isoformat()
        user_name = current_user.get("full_name") or current_user.get("email", "").split("@")[0] or "من"
        ws_name = f"فضای کاری {user_name}"
        cursor.execute("""
            INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
            VALUES (?, ?, ?, 'Briefcase', '#4F46E5', ?, ?)
        """, (ws_id, ws_name, "فضای کاری اختصاصی شما", current_user["id"], now_str))
        cursor.execute("""
            INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
            VALUES (?, ?, ?, 'owner', ?)
        """, (str(uuid.uuid4()), ws_id, current_user["id"], now_str))
        conn.commit()

        cursor.execute("SELECT * FROM workspaces WHERE id = ?", (ws_id,))
        created_ws = dict(cursor.fetchone())
        created_ws["user_role"] = "owner"
        created_ws["projects_count"] = 0
        created_ws["members_count"] = 1
        workspaces = [created_ws]

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

@router.put("/{workspace_id}")
def update_workspace(workspace_id: str, ws_data: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, current_user["id"]))
    row = cursor.fetchone()
    if not row or row["role"] not in ["owner", "admin"]:
        conn.close()
        raise HTTPException(status_code=403, detail="فقط مالک یا مدیر ارشد مجاز به ویرایش نام و مشخصات فضای کاری است.")

    cursor.execute("""
        UPDATE workspaces
        SET name = ?, description = ?, color = ?
        WHERE id = ?
    """, (ws_data.name.strip(), ws_data.description or "", ws_data.color or "#4F46E5", workspace_id))
    conn.commit()
    conn.close()
    return {"message": "فضای کاری با موفقیت بروزرسانی شد."}

@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, current_user["id"]))
    row = cursor.fetchone()
    if not row or row["role"] != "owner":
        conn.close()
        raise HTTPException(status_code=403, detail="فقط مالک فضای کاری مجاز به حذف آن است.")

    # Prevent deleting if user only has 1 workspace
    cursor.execute("SELECT COUNT(*) FROM workspace_members WHERE user_id = ?", (current_user["id"],))
    count = cursor.fetchone()[0]
    if count <= 1:
        conn.close()
        raise HTTPException(status_code=400, detail="شما حداقل باید یک فضای کاری فعال داشته باشید.")

    cursor.execute("DELETE FROM workspaces WHERE id = ?", (workspace_id,))
    conn.commit()
    conn.close()
    return {"message": "فضای کاری با موفقیت حذف شد."}

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

    # Case A: If email is provided -> Invite user
    if member_data.email:
        email_clean = member_data.email.strip().lower()
        cursor.execute("SELECT id, full_name, email FROM users WHERE LOWER(email) = LOWER(?)", (email_clean,))
        u = cursor.fetchone()
        if not u:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="این ایمیل عضو سایت نیست. شخص مورد نظر ابتدا باید در سامانه ثبت‌نام کند."
            )

        # Check if already member
        cursor.execute("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, u["id"]))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="این کاربر در حال حاضر عضو این فضای کاری است.")

        # Get workspace name
        cursor.execute("SELECT name FROM workspaces WHERE id = ?", (workspace_id,))
        ws_row = cursor.fetchone()
        ws_name = ws_row["name"] if ws_row else "فضای کاری"

        # Check if pending invite already exists
        cursor.execute("SELECT id FROM workspace_invitations WHERE workspace_id = ? AND invitee_id = ? AND status = 'pending'", (workspace_id, u["id"]))
        existing_inv = cursor.fetchone()
        now_str = datetime.utcnow().isoformat()
        role_title = ROLE_TITLES.get(member_data.role, "عضو تیم")

        if existing_inv:
            invitation_id = existing_inv["id"]
            cursor.execute("UPDATE workspace_invitations SET role = ?, updated_at = ? WHERE id = ?", (member_data.role, now_str, invitation_id))
        else:
            invitation_id = f"inv-{uuid.uuid4().hex[:10]}"
            cursor.execute("""
                INSERT INTO workspace_invitations (id, workspace_id, inviter_id, invitee_id, invitee_email, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            """, (invitation_id, workspace_id, current_user["id"], u["id"], u["email"], member_data.role, now_str, now_str))

        # In-app notification for invitee
        notif_id = f"notif-{uuid.uuid4().hex[:8]}"
        inviter_name = current_user.get("full_name") or current_user.get("email")
        cursor.execute("""
            INSERT INTO notifications (id, user_id, title, message, link, type, created_at)
            VALUES (?, ?, ?, ?, ?, 'workspace_invitation', ?)
        """, (
            notif_id,
            u["id"],
            "دعوت به همکاری در پروژه",
            f"شما توسط {inviter_name} به فضای کاری «{ws_name}» با نقش «{role_title}» دعوت شدید.",
            f"invitation:{invitation_id}",
            now_str
        ))

        conn.commit()
        conn.close()

        # Send notification email
        send_invitation_email(u["email"], inviter_name, ws_name, role_title)

        return {
            "message": f"دعوت‌نامه با موفقیت برای {u['full_name']} ارسال شد و به ایمیل و پنل کاربری ایشان ابلاغ گردید.",
            "status": "invited",
            "invitation_id": invitation_id
        }

    # Case B: If user_id is provided -> Role update of existing member
    target_user_id = member_data.user_id
    if not target_user_id:
        conn.close()
        raise HTTPException(status_code=400, detail="شناسه کاربر یا ایمیل الزامی است.")

    # A user cannot change their own role!
    if target_user_id == current_user["id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="شما نمی‌توانید نقش خود را تغییر دهید.")

    # Check if target is owner
    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, target_user_id))
    target_row = cursor.fetchone()
    if not target_row:
        conn.close()
        raise HTTPException(status_code=404, detail="عضو یافت نشد.")

    if target_row["role"] == "owner" and current_user.get("global_role") != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="نقش مالک فضای کاری قابل تغییر نیست.")

    cursor.execute("UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?", (member_data.role, workspace_id, target_user_id))
    conn.commit()
    conn.close()
    return {"message": "نقش عضو با موفقیت بروزرسانی شد."}

@router.delete("/{workspace_id}/members/{user_id}")
def remove_workspace_member(workspace_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, current_user["id"]))
    row = cursor.fetchone()
    if not row or row["role"] not in ["owner", "admin", "project_manager"]:
        conn.close()
        raise HTTPException(status_code=403, detail="شما دسترسی حذف اعضا را ندارید.")

    # Cannot remove owner
    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, user_id))
    target_row = cursor.fetchone()
    if target_row and target_row["role"] == "owner":
        conn.close()
        raise HTTPException(status_code=400, detail="امکان حذف مالک فضای کاری وجود ندارد.")

    cursor.execute("DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "عضو با موفقیت از فضای کاری حذف شد."}

@router.get("/invitations/pending")
def get_my_pending_invitations(current_user: dict = Depends(get_current_user)):
    """
    Returns pending workspace invitations for the current logged in user.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT wi.id, wi.workspace_id, wi.role, wi.created_at, wi.status,
               w.name as workspace_name, w.color as workspace_color,
               u.full_name as inviter_name, u.email as inviter_email
        FROM workspace_invitations wi
        JOIN workspaces w ON wi.workspace_id = w.id
        JOIN users u ON wi.inviter_id = u.id
        WHERE wi.invitee_id = ? AND wi.status = 'pending'
        ORDER BY wi.created_at DESC
    """, (current_user["id"],))
    invites = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return invites

@router.post("/invitations/{invitation_id}/respond")
def respond_to_invitation(invitation_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """
    Accepts or rejects an invitation.
    """
    action = data.get("action")
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="عملیات نامعتبر است.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workspace_invitations WHERE id = ? AND invitee_id = ?", (invitation_id, current_user["id"]))
    inv = cursor.fetchone()
    if not inv:
        conn.close()
        raise HTTPException(status_code=404, detail="دعوت‌نامه یافت نشد.")

    if inv["status"] != "pending":
        conn.close()
        status_fa = "پذیرفته" if inv["status"] == "accepted" else "رد"
        raise HTTPException(status_code=400, detail=f"این دعوت‌نامه قبلاً {status_fa} شده است.")

    now_str = datetime.utcnow().isoformat()
    cursor.execute("SELECT name FROM workspaces WHERE id = ?", (inv["workspace_id"],))
    ws_row = cursor.fetchone()
    ws_name = ws_row["name"] if ws_row else "فضای کاری"

    if action == "accept":
        cursor.execute("UPDATE workspace_invitations SET status = 'accepted', updated_at = ? WHERE id = ?", (now_str, invitation_id))

        # Check if already member
        cursor.execute("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (inv["workspace_id"], current_user["id"]))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
                VALUES (?, ?, ?, ?, ?)
            """, (f"wm-{uuid.uuid4().hex[:8]}", inv["workspace_id"], current_user["id"], inv["role"], now_str))

        # Notify inviter
        cursor.execute("""
            INSERT INTO notifications (id, user_id, title, message, link, type, created_at)
            VALUES (?, ?, ?, ?, ?, 'info', ?)
        """, (
            f"notif-{uuid.uuid4().hex[:8]}",
            inv["inviter_id"],
            "پذیرش دعوت به پروژه",
            f"«{current_user.get('full_name')}» دعوت شما برای پیوستن به فضای کاری «{ws_name}» را پذیرفت.",
            f"/workspaces/{inv['workspace_id']}",
            now_str
        ))

        # Mark invitation notification as read
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND link LIKE ?", (current_user["id"], f"%{invitation_id}%"))
        conn.commit()
        conn.close()
        return {
            "message": "دعوت با موفقیت پذیرفته شد و شما به فضای کاری افزوده شدید.",
            "workspace_id": inv["workspace_id"],
            "status": "accepted"
        }

    else:
        cursor.execute("UPDATE workspace_invitations SET status = 'rejected', updated_at = ? WHERE id = ?", (now_str, invitation_id))

        # Notify inviter
        cursor.execute("""
            INSERT INTO notifications (id, user_id, title, message, link, type, created_at)
            VALUES (?, ?, ?, ?, ?, 'info', ?)
        """, (
            f"notif-{uuid.uuid4().hex[:8]}",
            inv["inviter_id"],
            "رد دعوت به پروژه",
            f"«{current_user.get('full_name')}» دعوت شما برای فضای کاری «{ws_name}» را رد کرد.",
            None,
            now_str
        ))

        # Mark notification as read
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND link LIKE ?", (current_user["id"], f"%{invitation_id}%"))
        conn.commit()
        conn.close()
        return {"message": "دعوت‌نامه رد شد.", "status": "rejected"}

@router.get("/{workspace_id}/invitations")
def get_workspace_pending_invitations(workspace_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns pending invitations for a workspace so admins can see who has been invited.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT wi.id, wi.role, wi.status, wi.created_at,
               u.email, u.full_name, u.avatar_url
        FROM workspace_invitations wi
        JOIN users u ON wi.invitee_id = u.id
        WHERE wi.workspace_id = ? AND wi.status = 'pending'
        ORDER BY wi.created_at DESC
    """, (workspace_id,))
    invites = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return invites

@router.delete("/{workspace_id}/invitations/{invitation_id}")
def cancel_workspace_invitation(workspace_id: str, invitation_id: str, current_user: dict = Depends(get_current_user)):
    """
    Cancels a pending invitation.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, current_user["id"]))
    row = cursor.fetchone()
    if not row or row["role"] not in ["owner", "admin", "project_manager"]:
        conn.close()
        raise HTTPException(status_code=403, detail="شما دسترسی لغو دعوت را ندارید.")

    cursor.execute("DELETE FROM workspace_invitations WHERE id = ? AND workspace_id = ?", (invitation_id, workspace_id))
    conn.commit()
    conn.close()
    return {"message": "دعوت‌نامه لغو شد."}
