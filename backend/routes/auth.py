from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from twilio.rest import Client
from dotenv import load_dotenv
from db import get_db_connection
import os

load_dotenv()

auth_bp = Blueprint("auth", __name__)


# =====================================================
# TWILIO CONFIGURATION
# =====================================================

def get_twilio_client():
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")

    if not account_sid or not auth_token or not verify_sid:
        raise RuntimeError(
            "Twilio settings missing in backend/.env"
        )

    return Client(account_sid, auth_token), verify_sid


# =====================================================
# NORMALIZE MOBILE NUMBER
# =====================================================

def digits_only(value):
    return "".join(
        ch for ch in str(value or "") if ch.isdigit()
    )


def normalize_mobile(mobile):
    digits = digits_only(mobile)

    if len(digits) == 10:
        return "+91" + digits

    if len(digits) == 12 and digits.startswith("91"):
        return "+" + digits

    return None


def local_mobile(mobile):
    digits = digits_only(mobile)

    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]

    return digits


# =====================================================
# FIND REGISTERED STUDENT
# =====================================================

def find_user(cursor, register_number, mobile):
    number = normalize_mobile(mobile)

    if not number:
        return None

    local = local_mobile(number)

    cursor.execute(
        """
        SELECT id, name, register_number, email,
               mobile, password, role
        FROM users
        WHERE TRIM(register_number) = %s
          AND REPLACE(
                REPLACE(
                    REPLACE(TRIM(mobile), ' ', ''),
                    '-', ''
                ),
                '+', ''
              ) IN (%s, %s)
        LIMIT 1
        """,
        (
            register_number.strip(),
            local,
            "91" + local
        )
    )

    return cursor.fetchone()


# =====================================================
# VALIDATE REGISTERED STUDENT
# =====================================================

def validate_existing_student(
    user, name, register_number, mobile
):
    if not user or user["role"] != "student":
        return "Registered student account not found"

    db_name = (user["name"] or "").strip()
    entered_name = (name or "").strip()

    if db_name.casefold() != entered_name.casefold():
        return "Student name does not match"

    db_register = (
        user["register_number"] or ""
    ).strip()

    entered_register = (
        register_number or ""
    ).strip()

    if db_register.casefold() != entered_register.casefold():
        return "Register number does not match"

    if local_mobile(user["mobile"]) != local_mobile(mobile):
        return "Phone number does not match registered number"

    return None


# =====================================================
# STUDENT REGISTRATION
# =====================================================

@auth_bp.route("/register", methods=["POST"])
def register():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        name = (data.get("name") or "").strip()
        register_number = (
            data.get("register_number") or ""
        ).strip()
        email = (data.get("email") or "").strip()
        mobile = normalize_mobile(data.get("mobile"))
        password = data.get("password") or ""

        if not all([
            name, register_number, email, mobile, password
        ]):
            return jsonify({
                "message": "Enter all required student details"
            }), 400

        connection = get_db_connection()

        if connection is None:
            return jsonify({
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
               OR register_number = %s
               OR mobile = %s
               OR mobile = %s
            LIMIT 1
            """,
            (
                email,
                register_number,
                local_mobile(mobile),
                "91" + local_mobile(mobile)
            )
        )

        if cursor.fetchone():
            return jsonify({
                "message": (
                    "Email, register number or mobile "
                    "already registered"
                )
            }), 409

        password_hash = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO users
                (name, register_number, email, mobile,
                 password, role)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                name,
                register_number,
                email,
                local_mobile(mobile),
                password_hash,
                "student"
            )
        )

        connection.commit()

        return jsonify({
            "message": "Registration successful"
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        print("Registration error:", error)

        return jsonify({
            "message": "Registration failed"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# SEND OTP
# =====================================================

@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        name = (data.get("name") or "").strip()
        register_number = (
            data.get("register_number") or ""
        ).strip()
        mobile = normalize_mobile(data.get("mobile"))

        if not all([name, register_number, mobile]):
            return jsonify({
                "message": (
                    "Enter name, register number and phone number"
                )
            }), 400

        connection = get_db_connection()

        if connection is None:
            return jsonify({
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor(dictionary=True)

        user = find_user(cursor, register_number, mobile)

        error_message = validate_existing_student(
            user, name, register_number, mobile
        )

        if error_message:
            return jsonify({
                "message": error_message
            }), 401

        client, verify_sid = get_twilio_client()

        verification = (
            client.verify.v2.services(verify_sid)
            .verifications.create(
                to=mobile,
                channel="sms"
            )
        )

        print("Twilio OTP status:", verification.status)

        return jsonify({
            "message": "OTP sent successfully"
        }), 200

    except Exception as error:
        print("Send OTP error:", error)

        return jsonify({
            "message": (
                "Failed to send OTP. Check Twilio settings "
                "and phone number."
            )
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# VERIFY OTP
# =====================================================

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        name = (data.get("name") or "").strip()
        register_number = (
            data.get("register_number") or ""
        ).strip()
        mobile = normalize_mobile(data.get("mobile"))
        otp = str(data.get("otp") or "").strip()

        if not all([
            name, register_number, mobile, otp
        ]):
            return jsonify({
                "message": (
                    "Enter name, register number, "
                    "phone number and OTP"
                )
            }), 400

        connection = get_db_connection()

        if connection is None:
            return jsonify({
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor(dictionary=True)

        user = find_user(cursor, register_number, mobile)

        error_message = validate_existing_student(
            user, name, register_number, mobile
        )

        if error_message:
            return jsonify({
                "message": error_message
            }), 401

        client, verify_sid = get_twilio_client()

        check = (
            client.verify.v2.services(verify_sid)
            .verification_checks.create(
                to=mobile,
                code=otp
            )
        )

        if check.status != "approved":
            return jsonify({
                "message": "Invalid or expired OTP"
            }), 401

        access_token = create_access_token(
            identity=str(user["id"]),
            additional_claims={
                "role": user["role"]
            }
        )

        return jsonify({
            "message": "OTP verified successfully",
            "token": access_token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "register_number": user["register_number"],
                "email": user["email"],
                "mobile": user["mobile"],
                "role": user["role"]
            }
        }), 200

    except Exception as error:
        print("Verify OTP error:", error)

        return jsonify({
            "message": "OTP verification failed"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# ADMIN LOGIN
# =====================================================

@auth_bp.route("/login", methods=["POST"])
def login():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        email = (data.get("email") or "").strip()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({
                "message": "Enter admin email and password"
            }), 400

        connection = get_db_connection()

        if connection is None:
            return jsonify({
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email, password, role
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user or not check_password_hash(
            user["password"], password
        ):
            return jsonify({
                "message": "Invalid email or password"
            }), 401

        if user["role"] != "admin":
            return jsonify({
                "message": "Use student OTP login"
            }), 403

        access_token = create_access_token(
            identity=str(user["id"]),
            additional_claims={
                "role": user["role"]
            }
        )

        return jsonify({
            "message": "Admin login successful",
            "token": access_token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    except Exception as error:
        print("Admin login error:", error)

        return jsonify({
            "message": "Login failed"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()