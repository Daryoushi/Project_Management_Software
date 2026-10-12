import os
import json
import urllib.request
import urllib.parse
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
import uuid
from datetime import datetime
from app.database import get_db
from app.schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, decode_token
from app.email_service import send_real_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed authorization header")

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, global_role, preferred_lang, theme, created_at FROM users WHERE id = ?", (payload["sub"],))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(row)

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().isoformat()
    avatar_url = f"https://api.dicebear.com/7.x/initials/svg?seed={user_data.full_name}"

    cursor.execute("""
        INSERT INTO users (id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, user_data.email, user_data.full_name, avatar_url,
        user_data.global_role or "admin", hash_password(user_data.password), "fa", now_str
    ))

    # Also automatically create a default workspace for the user
    ws_id = f"ws-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (ws_id, f"فضای کاری {user_data.full_name}", "فضای کاری اختصاصی شما", "Briefcase", "#6366F1", user_id, now_str))

    cursor.execute("""
        INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), ws_id, user_id, "owner", now_str))

    conn.commit()
    conn.close()

    token = create_access_token({"sub": user_id, "email": user_data.email, "role": user_data.global_role or "admin"})
    user_resp = UserResponse(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        avatar_url=avatar_url,
        global_role=user_data.global_role or "admin",
        preferred_lang="fa",
        theme="light",
        created_at=now_str
    )
    return TokenResponse(access_token=token, user=user_resp)

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, theme, created_at FROM users WHERE email = ?", (login_data.email,))
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(row["hashed_password"], login_data.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    user_dict = dict(row)
    token = create_access_token({"sub": user_dict["id"], "email": user_dict["email"], "role": user_dict["global_role"]})
    del user_dict["hashed_password"]
    return TokenResponse(access_token=token, user=UserResponse(**user_dict))

@router.post("/google")
def google_auth(data: dict):
    credential = data.get("credential")
    email = data.get("email", "").strip().lower()
    full_name = data.get("full_name", "").strip()
    avatar_url = data.get("avatar_url")
    confirm_new_user = data.get("confirm_new_user", False)

    # If Google credential (JWT ID token) is passed from Google Identity Services:
    if credential:
        try:
            import base64
            import json
            parts = credential.split(".")
            if len(parts) >= 2:
                payload_b64 = parts[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                decoded = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))
                email = decoded.get("email", email).strip().lower()
                if not full_name:
                    full_name = decoded.get("name", "")
                if not avatar_url:
                    avatar_url = decoded.get("picture", "")
        except Exception as e:
            print(f"[GOOGLE AUTH] Failed to parse credential token: {e}")

    if not email:
        raise HTTPException(status_code=400, detail="ایمیل معتبر از حساب گوگل دریافت نشد.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, global_role, preferred_lang, theme, created_at FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()

    # 1. Existing user -> log in immediately
    if row:
        user_dict = dict(row)
        if avatar_url and avatar_url != user_dict.get("avatar_url"):
            cursor.execute("UPDATE users SET avatar_url = ? WHERE id = ?", (avatar_url, user_dict["id"]))
            conn.commit()
            user_dict["avatar_url"] = avatar_url
        conn.close()
        token = create_access_token({"sub": user_dict["id"], "email": user_dict["email"], "role": user_dict["global_role"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse(**user_dict),
            "is_new_user": False
        }

    # 2. New user -> check if name confirmation is needed
    if not confirm_new_user:
        conn.close()
        return {
            "needs_name": True,
            "email": email,
            "suggested_name": full_name or "",
            "avatar_url": avatar_url or "",
            "credential": credential or ""
        }

    # 3. Confirmed new user -> create user with chosen full_name
    now_str = datetime.utcnow().isoformat()
    if not full_name:
        full_name = email.split("@")[0]

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    final_avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={full_name}"
    random_pass = hash_password(str(uuid.uuid4()))
    cursor.execute("""
        INSERT INTO users (id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, email, full_name, final_avatar, "admin", random_pass, "fa", now_str))

    ws_id = f"ws-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (ws_id, f"فضای کاری {full_name}", "فضای کاری اختصاصی شما", "Briefcase", "#6366F1", user_id, now_str))

    cursor.execute("""
        INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), ws_id, user_id, "owner", now_str))

    # Also create default project for the new workspace
    proj_id = f"proj-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (proj_id, ws_id, "پروژه اصلی", "مدیریت تسک‌ها و فعالیت‌های روزمره", "FolderKanban", "#2563EB", "active", user_id, now_str))

    task_id = f"task-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO tasks (id, project_id, title, description, status, section, priority, assignee_id, reporter_id, start_date, due_date, position, estimated_hours, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (task_id, proj_id, f"خوش آمدید، {full_name} عزیز", "به سامانه مدیریت پروژه خوش آمدید. اکنون می‌توانید وظایف و اهداف خود را برنامه‌ریزی نمایید.", "todo", "در صف انجام", "medium", user_id, user_id, now_str[:10], now_str[:10], 0, 0, "[]", now_str, now_str))

    conn.commit()
    conn.close()

    token = create_access_token({"sub": user_id, "email": email, "role": "admin"})
    user_resp = UserResponse(
        id=user_id,
        email=email,
        full_name=full_name,
        avatar_url=final_avatar,
        global_role="admin",
        preferred_lang="fa",
        theme="light",
        created_at=now_str
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_resp,
        "is_new_user": True
    }

@router.post("/github")
def github_auth(data: dict):
    username = data.get("username", "").strip()
    token = data.get("token", "").strip()
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    confirm_new_user = data.get("confirm_new_user", False)

    gh_user = None
    if token or username:
        import urllib.request
        headers = {"User-Agent": "PM-System", "Accept": "application/vnd.github.v3+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            url = "https://api.github.com/user"
        else:
            url = f"https://api.github.com/users/{username}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                gh_user = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[GITHUB AUTH WARNING]: {e}")

    if gh_user:
        username = gh_user.get("login") or username
        if not full_name:
            full_name = gh_user.get("name") or username
        if not email and gh_user.get("email"):
            email = gh_user.get("email").strip().lower()
        avatar_url = gh_user.get("avatar_url")
    else:
        avatar_url = f"https://api.dicebear.com/7.x/initials/svg?seed={full_name or username}"

    if not email:
        if username:
            email = f"{username.lower()}@github.com"
        else:
            raise HTTPException(status_code=400, detail="لطفاً نام کاربری گیت‌هاب یا آدرس ایمیل خود را وارد فرمایید.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, global_role, preferred_lang, theme, created_at FROM users WHERE email = ? OR github_username = ?", (email, username))
    row = cursor.fetchone()

    # 1. Existing user -> Log in immediately!
    if row:
        user_dict = dict(row)
        if token or username:
            cursor.execute("UPDATE users SET github_token = COALESCE(?, github_token), github_username = COALESCE(?, github_username) WHERE id = ?", (token or None, username or None, user_dict["id"]))
            conn.commit()
        conn.close()
        access_tok = create_access_token({"sub": user_dict["id"], "email": user_dict["email"], "role": user_dict["global_role"]})
        return {
            "access_token": access_tok,
            "token_type": "bearer",
            "user": UserResponse(**user_dict),
            "is_new_user": False
        }

    # 2. New user -> Ask for full name if not confirmed
    if not confirm_new_user and not full_name:
        conn.close()
        return {
            "needs_name": True,
            "email": email,
            "username": username,
            "suggested_name": full_name or username,
            "avatar_url": avatar_url,
            "token": token
        }

    # 3. Create new user
    now_str = datetime.utcnow().isoformat()
    if not full_name:
        full_name = username or email.split("@")[0]

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    random_pass = hash_password(str(uuid.uuid4()))
    final_avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={full_name}"

    cursor.execute("""
        INSERT INTO users (id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, github_username, github_token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, email, full_name, final_avatar, "admin", random_pass, "fa", username or None, token or None, now_str))

    # Create workspace
    ws_id = f"ws-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (ws_id, f"فضای کاری {full_name}", "فضای کاری اختصاصی شما", "Briefcase", "#24292E", user_id, now_str))

    cursor.execute("""
        INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), ws_id, user_id, "owner", now_str))

    # Default project
    proj_id = f"proj-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (proj_id, ws_id, "پروژه اصلی", "مدیریت تسک‌ها و فعالیت‌های روزمره", "FolderKanban", "#2563EB", "active", user_id, now_str))

    task_id = f"task-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO tasks (id, project_id, title, description, status, section, priority, assignee_id, reporter_id, start_date, due_date, position, estimated_hours, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (task_id, proj_id, f"خوش آمدید، {full_name} عزیز", "به سامانه مدیریت پروژه خوش آمدید. اکنون می‌توانید مخازن گیت‌هاب خود را نیز متصل نمایید.", "todo", "در صف انجام", "medium", user_id, user_id, now_str[:10], now_str[:10], 0, 0, "[]", now_str, now_str))

    conn.commit()
    conn.close()

    access_tok = create_access_token({"sub": user_id, "email": email, "role": "admin"})
    user_resp = UserResponse(
        id=user_id,
        email=email,
        full_name=full_name,
        avatar_url=final_avatar,
        global_role="admin",
        preferred_lang="fa",
        theme="light",
        created_at=now_str
    )
    return {
        "access_token": access_tok,
        "token_type": "bearer",
        "user": user_resp,
        "is_new_user": True
    }

@router.post("/github/exchange")
def github_oauth_exchange(data: dict):
    code = data.get("code", "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="کد تأیید OAuth گیت‌هاب ارسال نشده است.")

    from app.email_service import load_env_file
    load_env_file()

    client_id = os.getenv("GITHUB_CLIENT_ID", "").strip()
    client_secret = os.getenv("GITHUB_CLIENT_SECRET", "").strip()

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=400,
            detail="شناسه GITHUB_CLIENT_ID یا GITHUB_CLIENT_SECRET در تنظیمات سرور (.env) تنظیم نشده است. لطفاً ابتدا این دو کلید را از بخش OAuth Apps گیت‌هاب دریافت و در backend/.env قرار دهید."
        )

    import urllib.request
    import urllib.parse
    import json

    token_url = "https://github.com/login/oauth/access_token"
    token_data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code
    }).encode("utf-8")

    req = urllib.request.Request(token_url, data=token_data, headers={
        "Accept": "application/json",
        "User-Agent": "PM-System"
    })

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            token_res = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطا در دریافت توکن گیت‌هاب: {str(e)}")

    access_token = token_res.get("access_token")
    if not access_token:
        err_code = token_res.get("error", "")
        err_desc = token_res.get("error_description") or err_code or "خطای احراز هویت با گیت‌هاب"
        if "incorrect_client_credentials" in err_code:
            raise HTTPException(
                status_code=400,
                detail="کلید Client Secret نامعتبر است. توجه: این فیلد رمز عبور شخصی شما نیست! بلکه باید در صفحه گیت‌هاب دکمه 'Generate a new client secret' را بزنید و کدی که گیت‌هاب تولید می‌کند را کپی کنید."
            )
        if "bad_verification_code" in err_code:
            raise HTTPException(
                status_code=400,
                detail="کد اعتبارسنجی منقضی شده است. لطفاً مجدداً روی دکمه «ورود با GitHub» کلیک کنید."
            )
        raise HTTPException(status_code=400, detail=f"دریافت توکن از گیت‌هاب ناموفق بود: {err_desc}")

    # Fetch User Profile
    user_req = urllib.request.Request("https://api.github.com/user", headers={
        "Authorization": f"Bearer {access_token}",
        "User-Agent": "PM-System",
        "Accept": "application/vnd.github.v3+json"
    })
    try:
        with urllib.request.urlopen(user_req, timeout=12) as resp:
            gh_user = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطا در دریافت پروفایل کاربر از گیت‌هاب: {str(e)}")

    # Fetch User Primary Email
    email = (gh_user.get("email") or "").strip().lower()
    if not email:
        try:
            email_req = urllib.request.Request("https://api.github.com/user/emails", headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "PM-System",
                "Accept": "application/vnd.github.v3+json"
            })
            with urllib.request.urlopen(email_req, timeout=12) as resp:
                emails_data = json.loads(resp.read().decode("utf-8"))
                for em in emails_data:
                    if em.get("primary") and em.get("verified"):
                        email = em.get("email", "").strip().lower()
                        break
                if not email and emails_data:
                    email = emails_data[0].get("email", "").strip().lower()
        except Exception:
            pass

    username = gh_user.get("login") or ""
    if not email:
        email = f"{username.lower()}@github.com"

    full_name = gh_user.get("name") or username
    avatar_url = gh_user.get("avatar_url") or f"https://api.dicebear.com/7.x/initials/svg?seed={full_name}"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, global_role, preferred_lang, theme, created_at FROM users WHERE email = ? OR github_username = ?", (email, username))
    row = cursor.fetchone()

    # 1. Existing user -> log in immediately
    if row:
        user_dict = dict(row)
        cursor.execute("UPDATE users SET github_token = ?, github_username = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?", (access_token, username, avatar_url, user_dict["id"]))
        conn.commit()
        conn.close()
        tok = create_access_token({"sub": user_dict["id"], "email": user_dict["email"], "role": user_dict["global_role"]})
        return {
            "access_token": tok,
            "token_type": "bearer",
            "user": UserResponse(**user_dict),
            "is_new_user": False
        }

    # 2. New user -> create user and workspace
    now_str = datetime.utcnow().isoformat()
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    random_pass = hash_password(str(uuid.uuid4()))

    cursor.execute("""
        INSERT INTO users (id, email, full_name, avatar_url, global_role, hashed_password, preferred_lang, github_username, github_token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, email, full_name, avatar_url, "member", random_pass, "fa", username, access_token, now_str))

    ws_id = f"ws-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO workspaces (id, name, description, icon, color, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (ws_id, f"فضای کاری {full_name}", "فضای کاری اختصاصی شما", "Briefcase", "#24292E", user_id, now_str))

    cursor.execute("""
        INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), ws_id, user_id, "owner", now_str))

    proj_id = f"proj-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO projects (id, workspace_id, name, description, icon, color, status, owner_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (proj_id, ws_id, "پروژه اصلی", "مدیریت تسک‌ها و فعالیت‌های روزمره", "FolderKanban", "#2563EB", "active", user_id, now_str))

    task_id = f"task-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO tasks (id, project_id, title, description, status, section, priority, assignee_id, reporter_id, start_date, due_date, position, estimated_hours, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (task_id, proj_id, f"خوش آمدید، {full_name} عزیز", "حساب کاربری شما از طریق احراز هویت رسمی گیت‌هاب فعال شد.", "todo", "در صف انجام", "medium", user_id, user_id, now_str[:10], now_str[:10], 0, 0, "[]", now_str, now_str))

    conn.commit()
    conn.close()

    tok = create_access_token({"sub": user_id, "email": email, "role": "member"})
    user_resp = UserResponse(
        id=user_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
        global_role="member",
        preferred_lang="fa",
        theme="light",
        created_at=now_str
    )
    return {
        "access_token": tok,
        "token_type": "bearer",
        "user": user_resp,
        "is_new_user": True
    }

@router.post("/demo-login/{role}")
def demo_login(role: str):
    role_email_map = {
        "super_admin": "abalfazl@example.com",
        "admin": "abalfazl@example.com",
        "project_manager": "maryam@example.com",
        "member": "ali@example.com",
        "viewer": "sara@example.com"
    }
    email = role_email_map.get(role, "abalfazl@example.com")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, global_role, preferred_lang, theme, created_at FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Demo user not found. Please run seed first.")

    user_dict = dict(row)
    token = create_access_token({"sub": user_dict["id"], "email": user_dict["email"], "role": user_dict["global_role"]})
    return TokenResponse(access_token=token, user=UserResponse(**user_dict))

@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

@router.get("/users")
def get_all_users(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, global_role FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

email_change_codes: dict = {}

@router.post("/send-email-change-code")
def send_email_change_code(data: dict, current_user: dict = Depends(get_current_user)):
    new_email = data.get("email", "").strip().lower()
    if not new_email or "@" not in new_email:
        raise HTTPException(status_code=400, detail="آدرس ایمیل معتبر نیست.")
    if new_email == current_user["email"]:
        raise HTTPException(status_code=400, detail="این آدرس همان ایمیل فعلی شما است.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", (new_email, current_user["id"]))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="این ایمیل قبلاً توسط کاربر دیگری ثبت شده است.")
    conn.close()

    now = datetime.utcnow().timestamp()
    stored = email_change_codes.get(new_email)
    if stored and now < stored["expires_at"]:
        remaining = int(stored["expires_at"] - now)
        raise HTTPException(status_code=429, detail=f"کد تأیید به تازگی ارسال شده است. لطفاً {remaining} ثانیه دیگر شکیبا باشید.")

    import random
    code = f"{random.randint(100000, 999999)}"
    email_change_codes[new_email] = {
        "code": code,
        "user_id": current_user["id"],
        "expires_at": now + 120 # 2 minutes
    }

    sent = send_real_email(new_email, "کد تأیید تغییر ایمیل حساب کاربری", code, purpose="تأیید ایمیل جدید")
    print(f"[EMAIL CHANGE] Code for {new_email}: {code} (sent: {sent})")
    if sent:
        return {"message": f"کد تأیید به آدرس {new_email} ارسال شد.", "cooldown": 120}
    else:
        return {
            "message": f"کد تأیید شما: {code}",
            "code": code,
            "cooldown": 120
        }

@router.put("/profile")
def update_profile(data: dict, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    new_email = data.get("email", "").strip().lower() if "email" in data else None
    email_code = data.get("email_code", "").strip() if "email_code" in data else ""

    if new_email is not None and new_email != current_user["email"]:
        if not new_email or "@" not in new_email:
            conn.close()
            raise HTTPException(status_code=400, detail="فرمت ایمیل نامعتبر است.")

        # Require verification code
        stored = email_change_codes.get(new_email)
        if not stored or stored.get("user_id") != current_user["id"] or stored.get("code") != email_code:
            conn.close()
            raise HTTPException(status_code=400, detail="کد تأیید ایمیل جدید نامعتبر است یا هنوز ارسال نشده است.")

        if datetime.utcnow().timestamp() > stored["expires_at"]:
            del email_change_codes[new_email]
            conn.close()
            raise HTTPException(status_code=400, detail="کد تأیید منقضی شده است (اعتبار: ۲ دقیقه). لطفاً مجدداً کد درخواست نمایید.")

        del email_change_codes[new_email]

        cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", (new_email, current_user["id"]))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="این ایمیل قبلاً توسط کاربر دیگری ثبت شده است.")

    updates = []
    params = []
    for field in ["full_name", "preferred_lang", "theme", "avatar_url"]:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])

    if new_email is not None and new_email != current_user["email"]:
        updates.append("email = ?")
        params.append(new_email)

    if updates:
        params.append(current_user["id"])
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    cursor.execute("SELECT id, email, full_name, avatar_url, global_role, preferred_lang, theme, created_at FROM users WHERE id = ?", (current_user["id"],))
    updated = cursor.fetchone()
    conn.close()
    return dict(updated)

# In-memory storage for verification codes and password reset codes
verification_codes: dict = {}
reset_codes: dict = {}

@router.post("/send-verification-code")
def send_verification_code(data: dict):
    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="ایمیل الزامی است.")
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="کاربری با این ایمیل قبلاً ثبت نام کرده است.")
    conn.close()

    now = datetime.utcnow().timestamp()
    stored = verification_codes.get(email)
    if stored and now < stored["expires_at"]:
        remaining = int(stored["expires_at"] - now)
        raise HTTPException(status_code=429, detail=f"کد تأیید به تازگی ارسال شده است. لطفاً {remaining} ثانیه دیگر جهت درخواست مجدد شکیبا باشید.")

    # Generate 6-digit code
    import random
    code = f"{random.randint(100000, 999999)}"
    verification_codes[email] = {
        "code": code,
        "expires_at": now + 120 # 2 minutes
    }
    
    # Send actual email to user
    sent = send_real_email(email, "کد تأیید عضویت در سامانه مدیریت پروژه", code, purpose="تأیید آدرس ایمیل و ساخت حساب کاربری")
    print(f"==================================================")
    print(f"[EMAIL DISPATCH] Verification code for {email}: {code} (SMTP sent: {sent})")
    print(f"==================================================")
    if sent:
        return {"message": f"کد تأیید ۶ رقمی به آدرس {email} ارسال شد.", "cooldown": 120}
    else:
        return {
            "message": f"کد تأیید ۶ رقمی شما: {code} (برای ارسال مستقیم به ایمیل، مشخصات SMTP را در backend/.env تنظیم نمایید)",
            "code": code,
            "cooldown": 120
        }

@router.post("/verify-and-register", response_model=TokenResponse)
def verify_and_register(data: dict):
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    full_name = data.get("full_name", "").strip()
    password = data.get("password", "").strip()

    if not email or not code or not full_name or not password:
        raise HTTPException(status_code=400, detail="تمام فیلدها الزامی هستند.")

    stored = verification_codes.get(email)
    if not stored or stored["code"] != code:
        raise HTTPException(status_code=400, detail="کد تأیید وارد شده نامعتبر است.")

    if datetime.utcnow().timestamp() > stored["expires_at"]:
        del verification_codes[email]
        raise HTTPException(status_code=400, detail="کد تأیید منقضی شده است (اعتبار: ۲ دقیقه). لطفاً مجدداً درخواست دهید.")

    del verification_codes[email]

    user_data = UserCreate(email=email, full_name=full_name, password=password, global_role="admin")
    return register(user_data)

@router.post("/forgot-password")
def forgot_password(data: dict):
    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="ایمیل الزامی است.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row:
        raise HTTPException(status_code=404, detail="حساب کاربری با این ایمیل یافت نشد.")

    now = datetime.utcnow().timestamp()
    stored = reset_codes.get(email)
    if stored and now < stored["expires_at"]:
        remaining = int(stored["expires_at"] - now)
        raise HTTPException(status_code=429, detail=f"کد بازیابی به تازگی ارسال شده است. لطفاً {remaining} ثانیه دیگر جهت درخواست مجدد شکیبا باشید.")

    import random
    code = f"{random.randint(100000, 999999)}"
    reset_codes[email] = {
        "code": code,
        "expires_at": now + 120 # 2 minutes
    }
    
    # Send actual reset password email
    sent = send_real_email(email, "بازیابی رمز عبور در سامانه مدیریت پروژه", code, purpose="بازیابی رمز عبور")
    print(f"==================================================")
    print(f"[EMAIL DISPATCH] Password reset code for {email}: {code} (SMTP sent: {sent})")
    print(f"==================================================")
    if sent:
        return {"message": f"کد بازیابی رمز عبور به آدرس {email} ارسال شد."}
    else:
        return {
            "message": f"کد بازیابی رمز عبور شما: {code} (برای ارسال مستقیم به ایمیل، مشخصات SMTP را در backend/.env تنظیم نمایید)",
            "code": code
        }

@router.post("/reset-password")
def reset_password(data: dict):
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    new_password = data.get("new_password", "").strip()

    if not email or not code or not new_password:
        raise HTTPException(status_code=400, detail="تمام فیلدها الزامی هستند.")

    stored = reset_codes.get(email)
    if not stored or stored["code"] != code:
        raise HTTPException(status_code=400, detail="کد بازیابی نامعتبر است.")

    if datetime.utcnow().timestamp() > stored["expires_at"]:
        del reset_codes[email]
        raise HTTPException(status_code=400, detail="کد بازیابی منقضی شده است.")

    del reset_codes[email]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (hash_password(new_password), email))
    conn.commit()
    conn.close()

    return {"message": "رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید."}

