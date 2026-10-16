
import mysql.connector
from mysql.connector import Error

from config import Config


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DATABASE,
            connection_timeout=10
        )

        if connection.is_connected():
            return connection

        print("Database connection failed.")
        return None

    except Error as e:
        print("Database connection error:", e)
        return None


if __name__ == "__main__":
    connection = get_db_connection()

    if connection:
        print("MySQL Connected Successfully!")

        try:
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE()")
            result = cursor.fetchone()
            print("Connected Database:", result[0])
            cursor.close()
        finally:
            connection.close()
    else:
        print("MySQL connection failed. Check your .env settings.")
