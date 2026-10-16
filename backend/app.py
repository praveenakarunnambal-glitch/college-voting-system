from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from config import Config
from db import get_db_connection

from routes.auth import auth_bp
from routes.student import student_bp
from routes.admin import admin_bp
from routes.campus import campus_bp


# ==========================================
# CREATE FLASK APP
# ==========================================

app = Flask(__name__)

app.config.from_object(Config)

CORS(app)

jwt = JWTManager(app)


# ==========================================
# REGISTER BLUEPRINTS
# ==========================================

app.register_blueprint(
    auth_bp,
    url_prefix="/api/auth"
)

app.register_blueprint(
    student_bp,
    url_prefix="/api/student"
)

app.register_blueprint(
    admin_bp,
    url_prefix="/api/admin"
)

app.register_blueprint(
    campus_bp,
    url_prefix="/api/campus"
)


# ==========================================
# DEFAULT ADMIN CREATION
# ==========================================

def create_default_admin():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            print("Database connection failed.")
            return

        cursor = connection.cursor(dictionary=True)

        admin_email = "admin@college.com"
        admin_password = "admin123"

        # Check whether admin already exists
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            """,
            (admin_email,)
        )

        existing_admin = cursor.fetchone()

        if existing_admin:
            print("Default admin already exists.")
            return

        # Hash admin password
        password_hash = generate_password_hash(admin_password)

        # Insert default admin
        cursor.execute(
            """
            INSERT INTO users
            (name, email, password, role)
            VALUES (%s, %s, %s, %s)
            """,
            (
                "College Admin",
                admin_email,
                password_hash,
                "admin"
            )
        )

        connection.commit()

        print("===================================")
        print("Default admin created successfully")
        print("Email    : admin@college.com")
        print("Password : admin123")
        print("===================================")

    except Exception as e:
        print("Admin creation error:", e)

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# HOME / TEST ROUTE
# ==========================================

@app.route("/")
def home():
    return {
        "message": "College Voting System API is running",
        "status": "success"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Backend is running"
    }


# ==========================================
# START APPLICATION
# ==========================================

if __name__ == "__main__":

    create_default_admin()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )