
from db import get_db_connection
from werkzeug.security import check_password_hash
from getpass import getpass

conn = get_db_connection()

if conn is None:
    print("Database connection failed")
else:
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT name, email, password, role FROM users WHERE email = %s",
        ("admin@college.com",)
    )
    user = cur.fetchone()

    if user:
        print("Account:", user["email"])
        print("Role:", user["role"])
        password = getpass("Enter admin password: ")
        print("Password correct:", check_password_hash(user["password"], password))
    else:
        print("Admin account not found")

    cur.close()
    conn.close()
