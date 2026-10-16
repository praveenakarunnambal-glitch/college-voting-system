
import secrets
from werkzeug.security import generate_password_hash
from db import get_db_connection

def add_students():
    connection = get_db_connection()

    if connection is None:
        print("Database connection failed")
        return

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT register_no, name, mobile
            FROM students
            ORDER BY register_no
            LIMIT 50
        """)
        students = cursor.fetchall()

        added = 0
        skipped = 0

        for student in students:
            register_number = student["register_no"].strip()
            name = student["name"].strip()
            mobile = (student["mobile"] or "").strip()

            cursor.execute("""
                SELECT id FROM users
                WHERE register_number = %s
                LIMIT 1
            """, (register_number,))

            if cursor.fetchone():
                print(f"Already exists: {register_number}")
                skipped += 1
                continue

            # Random initial password; students should use OTP
            # only if the existing login flow supports OTP-only login.
            temporary_password = secrets.token_urlsafe(24)
            password_hash = generate_password_hash(temporary_password)

            cursor.execute("""
                INSERT INTO users
                    (name, register_number, email, mobile, password, role)
                VALUES (%s, %s, NULL, %s, %s, 'student')
            """, (
                name,
                register_number,
                mobile,
                password_hash
            ))

            added += 1
            print(f"Added: {register_number} - {name}")

        connection.commit()
        print(f"\nFinished. Added: {added}, skipped: {skipped}")

    except Exception as error:
        connection.rollback()
        print("Error:", error)

    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    add_students()
