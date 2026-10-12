import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "backend", "pm_database.sqlite")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update users
cursor.execute("UPDATE users SET full_name = ? WHERE email = ?", ("اباالفضل داریوشی (Abalfazl)", "abalfazl@example.com"))

# Update projects
cursor.execute("SELECT id, name FROM projects")
for row in cursor.fetchall():
    new_name = row[1].replace("ابوالفضل", "اباالفضل")
    cursor.execute("UPDATE projects SET name = ? WHERE id = ?", (new_name, row[0]))

# Update workspaces
cursor.execute("SELECT id, name FROM workspaces")
for row in cursor.fetchall():
    new_name = row[1].replace("ابوالفضل", "اباالفضل")
    cursor.execute("UPDATE workspaces SET name = ? WHERE id = ?", (new_name, row[0]))

# Update tasks
cursor.execute("SELECT id, title, description FROM tasks")
for row in cursor.fetchall():
    new_title = row[1].replace("ابوالفضل", "اباالفضل") if row[1] else ""
    new_desc = row[2].replace("ابوالفضل", "اباالفضل") if row[2] else ""
    cursor.execute("UPDATE tasks SET title = ?, description = ? WHERE id = ?", (new_title, new_desc, row[0]))

conn.commit()
cursor.execute("SELECT full_name FROM users WHERE email = 'abalfazl@example.com'")
user_name = cursor.fetchone()[0]
conn.close()
print(f"Database updated. New user name in DB: {user_name.encode('utf-8')}")
