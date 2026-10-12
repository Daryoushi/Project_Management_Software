import sqlite3

def run():
    conn = sqlite3.connect('backend/pm_database.sqlite')
    cursor = conn.cursor()

    cursor.execute("UPDATE users SET full_name = 'اباالفضل داریوشی' WHERE id = 'user-abalfazl'")
    cursor.execute("UPDATE users SET full_name = 'مریم راد' WHERE id = 'user-maryam'")
    cursor.execute("UPDATE users SET full_name = 'علی رضایی' WHERE id = 'user-ali'")
    cursor.execute("UPDATE users SET full_name = 'سارا تهرانی' WHERE id = 'user-sara'")

    conn.commit()
    conn.close()
    print("User names cleaned successfully.")

if __name__ == '__main__':
    run()
