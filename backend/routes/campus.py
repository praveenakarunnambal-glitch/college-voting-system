
import hashlib
import secrets
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import check_password_hash

from db import get_db_connection


campus_bp = Blueprint("campus", __name__)


def fail(message, status=400):
    return jsonify({"message": message}), status


def get_authorization(cursor, raw_token, lock=False):
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    sql = """
        SELECT id, student_id, election_id, staff_id
        FROM campus_authorizations
        WHERE token_hash = %s
          AND used_at IS NULL
          AND expires_at > UTC_TIMESTAMP()
        LIMIT 1
    """

    if lock:
        sql += " FOR UPDATE"

    cursor.execute(sql, (token_hash,))
    return cursor.fetchone()


@campus_bp.route("/staff-login", methods=["POST"])
def campus_staff_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return fail("Enter admin email and password", 400)

    connection = get_db_connection()
    if connection is None:
        return fail("Database connection failed", 503)

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, name, email, password, role
            FROM users
            WHERE email = %s AND role = 'admin'
            LIMIT 1
            """,
            (email,),
        )
        user = cursor.fetchone()

        if not user or not check_password_hash(
            user["password"], password
        ):
            return fail("Invalid admin email or password", 401)

        token = create_access_token(
            identity=str(user["id"]),
            additional_claims={"role": "admin"},
        )

        return jsonify({
            "message": "Campus login successful",
            "access_token": token,
            "name": user["name"],
        }), 200

    except Exception as exc:
        print("Campus login error:", exc)
        return fail("Campus login failed", 500)

    finally:
        cursor.close()
        connection.close()


@campus_bp.route("/authorize", methods=["POST"])
@jwt_required()
def campus_authorize_student():
    claims = get_jwt()

    if claims.get("role") != "admin":
        return fail("Admin authorization required", 403)

    data = request.get_json(silent=True) or {}
    register_number = (
        data.get("register_number")
        or data.get("registerNumber")
        or ""
    ).strip()

    if not register_number:
        return fail("Enter student register number", 400)

    connection = get_db_connection()
    if connection is None:
        return fail("Database connection failed", 503)

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, name, register_number
            FROM users
            WHERE register_number = %s AND role = 'student'
            LIMIT 1
            """,
            (register_number,),
        )
        student = cursor.fetchone()

        if not student:
            return fail("Student register number not found", 404)

        cursor.execute(
            """
            SELECT id, title
            FROM elections
            WHERE status = 'OPEN' AND is_active = 1
            ORDER BY id DESC
            LIMIT 1
            """
        )
        election = cursor.fetchone()

        if not election:
            return fail("No active election is available", 400)

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=5)

        cursor.execute(
            """
            INSERT INTO campus_authorizations
                (token_hash, student_id, election_id, staff_id, expires_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                token_hash,
                student["id"],
                election["id"],
                int(get_jwt_identity()),
                expires_at,
            ),
        )
        connection.commit()

        return jsonify({
            "message": "Student verified successfully",
            "student_name": student["name"],
            "register_number": student["register_number"],
            "campus_token": raw_token,
            "election_title": election["title"],
        }), 200

    except Exception as exc:
        connection.rollback()
        print("Campus authorization error:", exc)
        return fail("Unable to verify student", 500)

    finally:
        cursor.close()
        connection.close()


@campus_bp.route("/candidates", methods=["GET"])
def campus_candidates():
    raw_token = request.headers.get("X-Campus-Token", "").strip()

    if not raw_token:
        return fail("Campus authorization required", 401)

    connection = get_db_connection()
    if connection is None:
        return fail("Database connection failed", 503)

    cursor = connection.cursor(dictionary=True)

    try:
        auth = get_authorization(cursor, raw_token)

        if not auth:
            return fail(
                "Authorization expired or already used. Verify again.",
                401,
            )

        cursor.execute(
            """
            SELECT id, title
            FROM elections
            WHERE id = %s
            """,
            (auth["election_id"],),
        )
        election = cursor.fetchone()

        if not election:
            return fail("Election not found", 404)

        cursor.execute(
            """
            SELECT id, name, department, position, manifesto
            FROM candidates
            WHERE election_id = %s
            ORDER BY position, name
            """,
            (auth["election_id"],),
        )
        candidates = cursor.fetchall()

        return jsonify({
            "election_title": election["title"],
            "candidates": candidates,
        }), 200

    except Exception as exc:
        print("Campus candidates error:", exc)
        return fail("Unable to load candidates", 500)

    finally:
        cursor.close()
        connection.close()


@campus_bp.route("/vote", methods=["POST"])
def campus_vote():
    raw_token = request.headers.get("X-Campus-Token", "").strip()
    data = request.get_json(silent=True) or {}
    votes_data = data.get("votes")

    required_positions = [
        "President",
        "Vice President",
        "Secretary",
    ]

    if not raw_token:
        return fail("Campus authorization required", 401)

    if not isinstance(votes_data, dict):
        return fail("Select one candidate for each position", 400)

    selected_ids = {}

    for position in required_positions:
        try:
            selected_ids[position] = int(votes_data[position])
        except (KeyError, TypeError, ValueError):
            return fail(f"Select one candidate for {position}", 400)

    if len(set(selected_ids.values())) != 3:
        return fail("Select a valid candidate for each position", 400)

    connection = get_db_connection()
    if connection is None:
        return fail("Database connection failed", 503)

    cursor = connection.cursor(dictionary=True)

    try:
        connection.start_transaction()

        auth = get_authorization(cursor, raw_token, lock=True)

        if not auth:
            connection.rollback()
            return fail(
                "Authorization expired or already used. Verify again.",
                401,
            )

        cursor.execute(
            """
            SELECT id
            FROM votes
            WHERE user_id = %s AND election_id = %s
            LIMIT 1
            FOR UPDATE
            """,
            (auth["student_id"], auth["election_id"]),
        )

        if cursor.fetchone():
            connection.rollback()
            return fail("This student has already voted.", 409)

        candidate_ids = list(selected_ids.values())
        placeholders = ", ".join(["%s"] * len(candidate_ids))

        cursor.execute(
            f"""
            SELECT id, position
            FROM candidates
            WHERE election_id = %s
              AND id IN ({placeholders})
            """,
            (auth["election_id"], *candidate_ids),
        )

        candidates = {
            int(row["id"]): row for row in cursor.fetchall()
        }

        for position, candidate_id in selected_ids.items():
            candidate = candidates.get(candidate_id)

            if candidate is None:
                connection.rollback()
                return fail(f"Invalid candidate for {position}", 400)

            if (
                str(candidate["position"]).strip().casefold()
                != position.casefold()
            ):
                connection.rollback()
                return fail(f"Select a candidate for {position}", 400)

        for position in required_positions:
            cursor.execute(
                """
                INSERT INTO votes
                    (user_id, candidate_id, election_id, position)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    auth["student_id"],
                    selected_ids[position],
                    auth["election_id"],
                    position,
                ),
            )

        cursor.execute(
            """
            UPDATE campus_authorizations
            SET used_at = UTC_TIMESTAMP()
            WHERE id = %s
            """,
            (auth["id"],),
        )

        connection.commit()

        return jsonify({
            "message": "Votes submitted successfully for all positions"
        }), 201

    except Exception as exc:
        connection.rollback()
        print("Campus vote error:", exc)

        if getattr(exc, "errno", None) == 1062:
            return fail("This student has already voted.", 409)

        return fail("Unable to submit votes. Check backend terminal.", 500)

    finally:
        cursor.close()
        connection.close()
