
from getpass import getpass
from werkzeug.security import generate_password_hash
from db import get_db_connection

password = getpass("Enter NEW admin password: ")
confirm = getpass("Confirm NEW admin password: ")

if len(password) < 10:
    print("Password must contain at least 10 characters.")
elif password != confirm:
    print("Passwords do not match.")
else:
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed.")
    else:
        cur = conn.cursor()
        hashed = generate_password_hash(password)

        cur.execute(
            "UPDATE users SET password = %s "
            "WHERE email = %s AND role = %s",
            (hashed, "admin@college.com", "admin")
        )
        conn.commit()

        if cur.rowcount == 1:
            print("Admin password updated successfully.")
        else:
            print("Admin account was not updated. Check the account.")

        cur.close()
        conn.close()
