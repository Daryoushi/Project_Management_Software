import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

# Auto load .env if present
def load_env_file():
    for env_path in [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
        ".env"
    ]:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip().strip('"').strip("'")
            except Exception:
                pass

load_env_file()

def send_real_email(to_email: str, subject: str, code: str, purpose: str = "تأیید ایمیل و فعال‌سازی حساب") -> bool:
    """
    Sends a real verification or password reset email using configured SMTP.
    Uses RFC-compliant headers and both plain-text and HTML alternatives to avoid spam filters.
    """
    # Plain text version (Essential for avoiding Gmail spam scoring)
    plain_text = f"""سلام کاربر گرامی؛

کد تأیید یک‌بار مصرف شما جهت {purpose} در سامانه مدیریت پروژه:
{code}

این کد به مدت ۲ دقیقه معتبر است.
در صورتی که شما این درخواست را ارسال نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.

سامانه مدیریت پروژه سازمانی
"""

    html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{ font-family: Tahoma, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; text-align: right; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }}
    .header {{ text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
    .brand-title {{ font-size: 18px; font-weight: bold; color: #0f172a; margin: 0; }}
    .brand-sub {{ font-size: 12px; color: #64748b; margin-top: 4px; }}
    .content {{ font-size: 14px; line-height: 1.8; color: #334155; }}
    .code-container {{ background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }}
    .code-digits {{ font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; font-family: monospace; display: inline-block; direction: ltr; }}
    .time-badge {{ display: inline-block; font-size: 12px; color: #475569; margin-top: 8px; }}
    .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.6; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand-title">سامانه مدیریت پروژه</h1>
      <div class="brand-sub">سرویس احراز هویت و امنیت کاربری</div>
    </div>
    
    <div class="content">
      <p>کاربر گرامی، سلام؛</p>
      <p>کد یک‌بار مصرف شما جهت <strong>{purpose}</strong> به شرح زیر است:</p>
      
      <div class="code-container">
        <div class="code-digits">{code}</div>
        <br>
        <span class="time-badge">⏱ اعتبار این کد: ۲ دقیقه</span>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">در صورتی که شما این درخواست را ارسال نکرده‌اید، لطفاً این پیام را نادیده بگیرید.</p>
    </div>
    
    <div class="footer">
      این پیام به صورت خودکار از سامانه مدیریت پروژه ارسال شده است؛ لطفاً به آن پاسخ ندهید.
    </div>
  </div>
</body>
</html>"""

    load_env_file()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip().replace(" ", "")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@projectmanagement.local").strip()
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    if not smtp_user or not smtp_password:
        print("[SMTP WARNING] SMTP_USER or SMTP_PASSWORD is not set in environment.")
        print(f"[EMAIL DISPATCH] To: {to_email} | Code: {code}")
        return False

    try:
        domain = smtp_from.split("@")[-1] if "@" in smtp_from else "gmail.com"
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"سامانه مدیریت پروژه <{smtp_from}>"
        msg["To"] = to_email
        msg["Reply-To"] = smtp_from
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=domain)
        msg["MIME-Version"] = "1.0"
        msg["X-Priority"] = "1"
        msg["Auto-Submitted"] = "auto-generated"

        # 1. Plain text alternative (MUST be attached first for spam compliance)
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        # 2. HTML alternative
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            if smtp_use_tls:
                server.starttls()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] Real email sent to {to_email} with code: {code}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email via SMTP to {to_email}: {e}")
        return False

def send_invitation_email(to_email: str, inviter_name: str, workspace_name: str, role_title: str) -> bool:
    """
    Sends an email notification when a user is invited to a workspace or project.
    """
    subject = f"دعوت به همکاری در فضای کاری «{workspace_name}»"
    plain_text = f"""سلام کاربر گرامی؛

شما توسط «{inviter_name}» به فضای کاری «{workspace_name}» در سامانه مدیریت پروژه با نقش «{role_title}» دعوت شده‌اید.

جهت بررسی، پذیرش یا رد این دعوت، لطفاً وارد سامانه مدیریت پروژه شده و از بخش اعلان‌ها اقدام فرمایید.

سامانه مدیریت پروژه سازمانی
"""

    html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{ font-family: Tahoma, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; text-align: right; }}
    .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }}
    .header {{ text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
    .brand-title {{ font-size: 18px; font-weight: bold; color: #0f172a; margin: 0; }}
    .brand-sub {{ font-size: 12px; color: #64748b; margin-top: 4px; }}
    .invite-box {{ background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }}
    .role-badge {{ display: inline-block; background: #2563eb; color: #ffffff; padding: 4px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-top: 10px; }}
    .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.6; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand-title">سامانه مدیریت پروژه</h1>
      <div class="brand-sub">دعوت به همکاری و مدیریت تیمی</div>
    </div>
    
    <div style="font-size: 14px; line-height: 1.8; color: #334155;">
      <p>کاربر گرامی، سلام؛</p>
      <p>شما توسط همکار خود <strong>«{inviter_name}»</strong> جهت همکاری به فضای کاری زیر دعوت شده‌اید:</p>
      
      <div class="invite-box">
        <h3 style="margin: 0; color: #1e3a8a; font-size: 16px;">{workspace_name}</h3>
        <span class="role-badge">نقش تعیین‌شده: {role_title}</span>
      </div>
      
      <p>برای پذیرش یا رد دعوت، کافیست وارد سامانه مدیریت پروژه شده و روی آیکون زنگوله (اعلان‌ها) کلیک کنید.</p>
    </div>
    
    <div class="footer">
      این پیام به صورت خودکار از سامانه مدیریت پروژه ارسال شده است؛ لطفاً به آن پاسخ ندهید.
    </div>
  </div>
</body>
</html>"""

    load_env_file()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip().replace(" ", "")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@projectmanagement.local").strip()
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    if not smtp_user or not smtp_password:
        print(f"[SMTP NOTICE] Simulated invitation email sent to {to_email} for workspace {workspace_name}")
        return True

    try:
        domain = smtp_from.split("@")[-1] if "@" in smtp_from else "projectmanagement.local"
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"مدیریت پروژه <{smtp_from}>"
        msg["To"] = to_email
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=domain)
        msg["MIME-Version"] = "1.0"

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            if smtp_use_tls:
                server.starttls()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] Invitation email delivered to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send invitation email to {to_email}: {e}")
        return False

def build_google_calendar_url(title: str, description: str, due_date: str) -> str:
    """
    Builds a direct 1-click Google Calendar Event URL for a task.
    """
    from urllib.parse import quote
    if not due_date:
        return ""
    clean_date = due_date.replace("-", "")
    # Set full-day event or 9AM-10AM on due date
    dates_param = f"{clean_date}T090000Z/{clean_date}T100000Z"
    details_text = f"{description}\n\nارجاع شده از سامانه مدیریت پروژه سازمانی"
    return f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={quote(title)}&dates={dates_param}&details={quote(details_text)}"

def send_task_assigned_email(
    to_email: str,
    assignee_name: str,
    assigner_name: str,
    task_title: str,
    project_name: str,
    due_date: str = "",
    task_link: str = ""
) -> bool:
    """
    Sends an email notification when a task is assigned to a user, with direct link & Google Calendar integration.
    """
    gcal_url = build_google_calendar_url(task_title, f"پروژه: {project_name}", due_date) if due_date else ""
    subject = f"تسک جدید به شما محول شد: «{task_title}»"

    gcal_text = f"\nثبت در تقویم گوگل: {gcal_url}\n" if gcal_url else ""
    plain_text = f"""سلام {assignee_name} گرامی؛

تسک «{task_title}» در پروژه «{project_name}» توسط {assigner_name} به شما محول شد.
تاریخ تحویل / سررسید: {due_date or "تعیین نشده"}
{gcal_text}
مشاهده تسک در سامانه:
{task_link or "https://project-management-software-black-six.vercel.app"}

سامانه مدیریت پروژه سازمانی
"""

    gcal_button_html = f"""
      <div style="margin: 20px 0; text-align: center;">
        <a href="{gcal_url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
          📅 افزودن به تقویم گوگل (Google Calendar)
        </a>
      </div>
    """ if gcal_url else ""

    html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: Tahoma, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; text-align: right; }}
    .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }}
    .header {{ text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
    .brand-title {{ font-size: 18px; font-weight: bold; color: #0f172a; margin: 0; }}
    .task-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; }}
    .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand-title">سامانه مدیریت پروژه</h1>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">ارجاع وظایف تیمی و رصد پروژه</div>
    </div>
    
    <div style="font-size: 14px; line-height: 1.8; color: #334155;">
      <p>همکار گرامی، سلام؛</p>
      <p>تسک زیر توسط <strong>«{assigner_name}»</strong> به شما محول گردید:</p>
      
      <div class="task-box">
        <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">{task_title}</h3>
        <p style="margin: 4px 0; font-size: 12px; color: #15803d;">📁 پروژه: <strong>{project_name}</strong></p>
        <p style="margin: 4px 0; font-size: 12px; color: #15803d;">⏱ تاریخ سررسید: <strong>{due_date or "تعیین نشده"}</strong></p>
      </div>
      
      {gcal_button_html}
      
      <p style="font-size: 12px; color: #64748b;">می‌توانید با کلیک روی دکمه بالا، این تسک را مستقیماً در تقویم گوگل ذخیره کرده تا یادآورها در زمان مقرر برای شما فعال شوند.</p>
    </div>
    
    <div class="footer">
      سامانه مدیریت پروژه سازمانی TaskFlow
    </div>
  </div>
</body>
</html>"""

    load_env_file()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip().replace(" ", "")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@projectmanagement.local").strip()
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    if not smtp_user or not smtp_password:
        print(f"[SMTP NOTICE] Simulated task assignment email sent to {to_email} for task: {task_title}")
        return True

    try:
        domain = smtp_from.split("@")[-1] if "@" in smtp_from else "projectmanagement.local"
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"مدیریت پروژه <{smtp_from}>"
        msg["To"] = to_email
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=domain)
        msg["MIME-Version"] = "1.0"

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            if smtp_use_tls:
                server.starttls()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] Task assignment email delivered to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send task email to {to_email}: {e}")
        return False
