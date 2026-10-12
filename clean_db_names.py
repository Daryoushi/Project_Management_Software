import sqlite3

def run():
    conn = sqlite3.connect('backend/pm_database.sqlite')
    cursor = conn.cursor()

    cursor.execute('UPDATE projects SET name = ? WHERE id = ?', ('پروژه اول اباالفضل', 'proj-first'))
    cursor.execute('UPDATE projects SET name = ? WHERE id = ?', ('توسعه سیستم مالی و اشتراک', 'proj-billing'))
    cursor.execute('UPDATE workspaces SET name = ? WHERE id = ?', ('فضای کاری اصلی', 'ws-main'))
    cursor.execute('UPDATE workspaces SET name = ? WHERE id = ?', ('تیم نرم‌افزار', 'ws-dev'))

    conn.commit()
    conn.close()
    print("DB names updated successfully.")

if __name__ == '__main__':
    run()
