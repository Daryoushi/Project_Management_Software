import os
import sqlite3

# 1. Update SQLite database
db_path = os.path.join(os.path.dirname(__file__), "backend", "pm_database.sqlite")
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description FROM workspaces")
    for ws_id, name, desc in cursor.fetchall():
        new_name = name.replace("استارکوچ / StarKooch Workspace", "فضای کاری اصلی / Main Workspace").replace("استارکوچ", "فضای کاری اصلی")
        new_desc = (desc or "").replace("استارکوچ", "فضای کاری اصلی")
        cursor.execute("UPDATE workspaces SET name = ?, description = ? WHERE id = ?", (new_name, new_desc, ws_id))
    
    cursor.execute("SELECT id, title, message FROM notifications")
    for n_id, title, msg in cursor.fetchall():
        new_msg = (msg or "").replace("استارکوچ", "فضای کاری اصلی")
        cursor.execute("UPDATE notifications SET message = ? WHERE id = ?", (new_msg, n_id))
    
    conn.commit()
    conn.close()
    print("Database updated: removed استارکوچ")

# 2. Update files in backend, frontend/src, README.md
targets = [
    os.path.join("backend", "app", "seed.py"),
    "README.md"
]

for t in targets:
    if os.path.exists(t):
        with open(t, "r", encoding="utf-8") as f:
            content = f.read()
        new_content = content.replace("استارکوچ / StarKooch Workspace", "فضای کاری اصلی / Main Workspace").replace("استارکوچ", "فضای کاری اصلی")
        with open(t, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"File updated: {t}")
