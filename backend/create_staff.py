from getpass import getpass
from werkzeug.security import generate_password_hash
from db import get_db_connection


def main():
    name = input("Staff name: ").strip()
    email = input("Staff email: ").strip().lower()
    password = getpass("Staff password: ")

    if not name or not email or not password:
        print("Name, email and password are required.")
        return

    connection = get_db_connection()
    if connection is None:
        print("Database connection failed.")
        return
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, 'staff')
            """,
            (name, email, generate_password_hash(password))
        )
        connection.commit()
        print("Staff account created.")
    except Exception as exc:
        connection.rollback()
        print("Could not create staff account:", exc)
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
