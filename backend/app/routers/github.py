import os
import re
import urllib.request
import urllib.error
import json
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/github", tags=["GitHub Integration"])

def is_valid_github_client_id(cid: str) -> bool:
    if not cid or "@" in cid or len(cid) < 8 or " " in cid:
        return False
    return True

@router.get("/config")
def get_github_config():
    from app.email_service import load_env_file
    load_env_file()
    client_id = os.getenv("GITHUB_CLIENT_ID", "").strip()
    is_valid = is_valid_github_client_id(client_id)
    return {"client_id": client_id if is_valid else "", "configured": is_valid}

def update_env_file(filepath: str, updates: dict):
    lines = []
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception:
            lines = []
    
    existing_keys = set()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        matched = False
        if stripped and not stripped.startswith("#") and "=" in stripped:
            k = stripped.split("=", 1)[0].strip()
            if k in updates:
                new_lines.append(f"{k}={updates[k]}\n")
                existing_keys.add(k)
                matched = True
        if not matched:
            new_lines.append(line)
    
    for k, v in updates.items():
        if k not in existing_keys:
            if new_lines and not new_lines[-1].endswith("\n"):
                new_lines[-1] += "\n"
            new_lines.append(f"{k}={v}\n")
    
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception:
        pass

@router.post("/config")
def save_github_config(data: dict):
    client_id = data.get("client_id", "").strip()
    client_secret = data.get("client_secret", "").strip()
    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="هر دو فیلد Client ID و Client Secret الزامی هستند.")
    if not is_valid_github_client_id(client_id):
        raise HTTPException(status_code=400, detail="شناسه Client ID آدرس ایمیل نیست! بلکه کد ۲۰ کاراکتری است که در صفحه تنظیمات برنامه در گیت‌هاب قرار دارد (مانند Ov23li...).")
    
    backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", ".env")
    root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
    frontend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", ".env.local")

    update_env_file(backend_env, {"GITHUB_CLIENT_ID": client_id, "GITHUB_CLIENT_SECRET": client_secret})
    update_env_file(root_env, {"GITHUB_CLIENT_ID": client_id, "GITHUB_CLIENT_SECRET": client_secret})
    update_env_file(frontend_env, {"NEXT_PUBLIC_GITHUB_CLIENT_ID": client_id})
            
    os.environ["GITHUB_CLIENT_ID"] = client_id
    os.environ["GITHUB_CLIENT_SECRET"] = client_secret
    return {"message": "تنظیمات OAuth گیت‌هاب با موفقیت ذخیره شد.", "client_id": client_id}

def github_request(url: str, token: Optional[str] = None):
    headers = {
        "User-Agent": "PM-System-GitHub-Integration",
        "Accept": "application/vnd.github.v3+json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode("utf-8")
        except Exception:
            pass
        if e.code == 404:
            raise HTTPException(status_code=404, detail="مخزن یا کاربر گیت‌هاب مورد نظر یافت نشد.")
        if e.code == 401:
            raise HTTPException(status_code=401, detail="توکن گیت‌هاب نامعتبر یا منقضی شده است.")
        if e.code == 403:
            raise HTTPException(status_code=403, detail="محدودیت نرخ درخواست گیت‌هاب (Rate Limit) یا دسترسی نامعتبر. لطفاً توکن گیت‌هاب وارد فرمایید.")
        raise HTTPException(status_code=e.code, detail=f"خطا در ارتباط با سرور گیت‌هاب: {e.reason}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطای ارتباط با اینترنت/گیت‌هاب: {str(e)}")

@router.post("/repos")
def list_repositories(data: dict, current_user: dict = Depends(get_current_user)):
    username = data.get("username", "").strip()
    token = data.get("token", "").strip()

    # If no token provided, check if user has a stored github_token
    if not token and current_user.get("id"):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT github_token, github_username FROM users WHERE id = ?", (current_user["id"],))
        u_row = cursor.fetchone()
        conn.close()
        if u_row:
            token = u_row["github_token"] or ""
            if not username:
                username = u_row["github_username"] or ""

    if token:
        # Fetch authenticated user's repositories (public + private)
        url = "https://api.github.com/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator"
    elif username:
        # Fetch public repos for username
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=50"
    else:
        raise HTTPException(status_code=400, detail="لطفاً نام کاربری گیت‌هاب یا توکن دسترسی وارد فرمایید.")

    repos_raw = github_request(url, token=token if token else None)
    results = []
    for r in repos_raw:
        results.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description") or "",
            "html_url": r.get("html_url"),
            "stars": r.get("stargazers_count", 0),
            "forks": r.get("forks_count", 0),
            "open_issues": r.get("open_issues_count", 0),
            "language": r.get("language") or "Code",
            "private": r.get("private", False),
            "updated_at": r.get("updated_at")
        })
    return results

@router.post("/import-project")
def import_github_project(data: dict, current_user: dict = Depends(get_current_user)):
    workspace_id = data.get("workspace_id")
    repo_input = data.get("repo_url", "").strip() or data.get("repo_full_name", "").strip()
    token = data.get("token", "").strip()
    import_issues = data.get("import_issues", True)

    if not workspace_id:
        raise HTTPException(status_code=400, detail="شناسه فضای کاری الزامی است.")
    if not repo_input:
        raise HTTPException(status_code=400, detail="آدرس یا نام مخزن گیت‌هاب الزامی است.")

    # Extract owner and repo from URL or string (e.g. https://github.com/facebook/react or facebook/react)
    match = re.search(r"(?:github\.com/)?([^/\s]+)/([^/\s#?]+)", repo_input)
    if not match:
        raise HTTPException(status_code=400, detail="فرمت نام مخزن معتبر نیست. مثال صحیح: owner/repository یا https://github.com/owner/repository")

    owner, repo_name = match.group(1), match.group(2).replace(".git", "")
    full_repo = f"{owner}/{repo_name}"

    # Fetch repo details from GitHub first
    repo_data = github_request(f"https://api.github.com/repos/{full_repo}", token=token if token else None)

    # Pre-fetch GitHub issues BEFORE holding database connection to prevent locking
    issues_data = []
    if import_issues:
        try:
            issues_data = github_request(f"https://api.github.com/repos/{full_repo}/issues?state=all&per_page=40", token=token if token else None)
        except Exception as e:
            print(f"[GITHUB IMPORT ISSUES WARNING]: {e}")
            issues_data = []

    conn = get_db()
    try:
        cursor = conn.cursor()

        # Check workspace membership
        cursor.execute("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?", (workspace_id, current_user["id"]))
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="شما عضو این فضای کاری نیستید.")

        now_str = datetime.utcnow().isoformat()
        proj_id = f"proj-{uuid.uuid4().hex[:8]}"
        proj_name = repo_data.get("name", repo_name)
        proj_desc = repo_data.get("description") or f"مخزن گیت‌هاب {full_repo}"
        github_url = repo_data.get("html_url") or f"https://github.com/{full_repo}"

        cursor.execute("""
            INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, github_repo_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (proj_id, workspace_id, proj_name, proj_desc, "Github", "#24292E", "active", current_user["id"], github_url, now_str))

        # Create standard sections
        sections = [
            ("در صف انجام (To Do)", 0),
            ("در حال انجام (In Progress)", 1),
            ("بازبینی و بررسی (Review)", 2),
            ("تکمیل شده (Done)", 3)
        ]
        for sec_name, sec_order in sections:
            cursor.execute("""
                INSERT INTO project_sections (id, project_id, name, order_index, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), proj_id, sec_name, sec_order, now_str))

        tasks_imported = 0

        # Import GitHub issues as tasks
        for idx, issue in enumerate(issues_data):
            # We skip pull requests if they're purely PRs
            is_pr = "pull_request" in issue
            issue_num = issue.get("number")
            raw_title = issue.get("title", f"Issue #{issue_num}")
            task_title = f"[#{issue_num}] {raw_title}"
            if is_pr:
                task_title = f"[PR #{issue_num}] {raw_title}"

            issue_body = issue.get("body") or ""
            issue_url = issue.get("html_url", "")
            task_desc = f"{issue_body}\n\n🔗 لینک در گیت‌هاب: {issue_url}".strip()

            is_closed = issue.get("state") == "closed"
            status = "done" if is_closed else ("in_progress" if issue.get("assignees") else "todo")
            section = "تکمیل شده (Done)" if is_closed else ("در حال انجام (In Progress)" if issue.get("assignees") else "در صف انجام (To Do)")

            # Labels to tags
            labels = issue.get("labels", [])
            tags_list = []
            priority = "medium"
            for l in labels:
                lbl_name = l.get("name", "") if isinstance(l, dict) else str(l)
                lbl_color = f"#{l.get('color', '3B82F6')}" if isinstance(l, dict) else "#3B82F6"
                tags_list.append({"name": lbl_name, "color": lbl_color})
                lbl_lower = lbl_name.lower()
                if "bug" in lbl_lower or "critical" in lbl_lower or "urgent" in lbl_lower:
                    priority = "urgent"
                elif "high" in lbl_lower or "enhancement" in lbl_lower:
                    priority = "high"

            task_id = f"task-{uuid.uuid4().hex[:8]}"
            created_at_val = issue.get("created_at") or now_str
            
            cursor.execute("""
                INSERT INTO tasks (
                    id, project_id, title, description, status, section, priority,
                    assignee_id, reporter_id, start_date, due_date, position,
                    estimated_hours, tags, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id, proj_id, task_title, task_desc, status, section, priority,
                current_user["id"], current_user["id"], now_str[:10], None, idx,
                0, json.dumps(tags_list), created_at_val, now_str
            ))
            tasks_imported += 1

        conn.commit()

        # Fetch created project
        cursor.execute("SELECT * FROM projects WHERE id = ?", (proj_id,))
        new_proj = dict(cursor.fetchone())
        return {
            "project": new_proj,
            "tasks_imported": tasks_imported,
            "message": f"پروژه «{proj_name}» با موفقیت از گیت‌هاب ایجاد و متصل شد ({tasks_imported} تسک/ایشیو همگام گردید)."
        }
    finally:
        conn.close()

@router.get("/status")
def get_user_github_status(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT github_username, github_token, avatar_url FROM users WHERE id = ?", (current_user["id"],))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"connected": False, "github_username": "", "has_token": False, "avatar_url": ""}
    
    username = row["github_username"] or ""
    has_token = bool(row["github_token"])
    return {
        "connected": bool(username or has_token),
        "github_username": username,
        "has_token": has_token,
        "avatar_url": row["avatar_url"] or ""
    }

@router.post("/connect-token")
def connect_github_token(data: dict, current_user: dict = Depends(get_current_user)):
    token = data.get("token", "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="لطفاً توکن دسترسی گیت‌هاب را وارد فرمایید.")
    
    # Verify token with GitHub
    try:
        gh_user = github_request("https://api.github.com/user", token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail="توکن گیت‌هاب نامعتبر است یا منقضی شده است.")
    
    username = gh_user.get("login") or ""
    avatar_url = gh_user.get("avatar_url") or ""
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET github_token = ?, github_username = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?", (token, username, avatar_url, current_user["id"]))
    conn.commit()
    conn.close()
    
    return {
        "connected": True,
        "github_username": username,
        "avatar_url": avatar_url,
        "message": f"حساب گیت‌هاب @{username} با موفقیت متصل گردید."
    }

@router.post("/disconnect")
def disconnect_github(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET github_token = NULL, github_username = NULL WHERE id = ?", (current_user["id"],))
    conn.commit()
    conn.close()
    return {"connected": False, "message": "ارتباط با حساب گیت‌هاب قطع گردید."}

@router.post("/sync-project-issues")
def sync_project_issues(data: dict, current_user: dict = Depends(get_current_user)):
    project_id = data.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="شناسه پروژه الزامی است.")
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, github_repo_url, workspace_id FROM projects WHERE id = ?", (project_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="پروژه یافت نشد.")
    
    github_repo_url = proj["github_repo_url"]
    if not github_repo_url:
        conn.close()
        raise HTTPException(status_code=400, detail="این پروژه به مخزن گیت‌هاب متصل نیست.")
    
    # Get user token
    cursor.execute("SELECT github_token FROM users WHERE id = ?", (current_user["id"],))
    u_row = cursor.fetchone()
    token = u_row["github_token"] if u_row else None
    
    match = re.search(r"(?:github\.com/)?([^/\s]+)/([^/\s#?]+)", github_repo_url)
    if not match:
        conn.close()
        raise HTTPException(status_code=400, detail="آدرس مخزن گیت‌هاب این پروژه نامعتبر است.")
    
    owner, repo_name = match.group(1), match.group(2).replace(".git", "")
    full_repo = f"{owner}/{repo_name}"
    
    # Fetch issues
    issues_data = github_request(f"https://api.github.com/repos/{full_repo}/issues?state=all&per_page=50", token=token)
    
    # Fetch existing tasks for this project
    cursor.execute("SELECT id, title, status FROM tasks WHERE project_id = ?", (project_id,))
    existing_tasks = [dict(t) for t in cursor.fetchall()]
    
    # Map issue number to existing task
    task_by_issue_num = {}
    for t in existing_tasks:
        m = re.search(r"\[(?:PR\s+)?#(\d+)\]", t["title"])
        if m:
            task_by_issue_num[int(m.group(1))] = t
    
    now_str = datetime.utcnow().isoformat()
    new_tasks_count = 0
    updated_tasks_count = 0
    
    for idx, issue in enumerate(issues_data):
        num = issue.get("number")
        if not num:
            continue
        
        is_pr = "pull_request" in issue
        is_closed = issue.get("state") == "closed"
        target_status = "done" if is_closed else ("in_progress" if issue.get("assignees") else "todo")
        target_section = "تکمیل شده (Done)" if is_closed else ("در حال انجام (In Progress)" if issue.get("assignees") else "در صف انجام (To Do)")
        
        if num in task_by_issue_num:
            # Update existing task if status changed
            existing_t = task_by_issue_num[num]
            if existing_t["status"] != target_status:
                cursor.execute("UPDATE tasks SET status = ?, section = ?, updated_at = ? WHERE id = ?", (target_status, target_section, now_str, existing_t["id"]))
                updated_tasks_count += 1
        else:
            # Insert as new task
            raw_title = issue.get("title", f"Issue #{num}")
            task_title = f"[#{num}] {raw_title}" if not is_pr else f"[PR #{num}] {raw_title}"
            issue_body = issue.get("body") or ""
            issue_url = issue.get("html_url", "")
            task_desc = f"{issue_body}\n\n🔗 لینک در گیت‌هاب: {issue_url}".strip()
            
            labels = issue.get("labels", [])
            tags_list = []
            priority = "medium"
            for l in labels:
                lbl_name = l.get("name", "") if isinstance(l, dict) else str(l)
                lbl_color = f"#{l.get('color', '3B82F6')}" if isinstance(l, dict) else "#3B82F6"
                tags_list.append({"name": lbl_name, "color": lbl_color})
                lbl_lower = lbl_name.lower()
                if "bug" in lbl_lower or "critical" in lbl_lower or "urgent" in lbl_lower:
                    priority = "urgent"
                elif "high" in lbl_lower or "enhancement" in lbl_lower:
                    priority = "high"
            
            task_id = f"task-{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO tasks (
                    id, project_id, title, description, status, section, priority,
                    assignee_id, reporter_id, start_date, due_date, position,
                    estimated_hours, tags, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id, project_id, task_title, task_desc, target_status, target_section, priority,
                current_user["id"], current_user["id"], now_str[:10], None, len(existing_tasks) + new_tasks_count,
                0, json.dumps(tags_list), issue.get("created_at") or now_str, now_str
            ))
            new_tasks_count += 1
    
    conn.commit()
    conn.close()
    
    return {
        "project_id": project_id,
        "new_tasks": new_tasks_count,
        "updated_tasks": updated_tasks_count,
        "message": f"همگام‌سازی با موفقیت انجام شد: {new_tasks_count} وظیفه جدید دریافت و {updated_tasks_count} وظیفه به‌روزرسانی شد."
    }
