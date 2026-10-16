from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt

from db import get_db_connection

admin_bp = Blueprint("admin", __name__)


def check_admin():

    claims = get_jwt()

    return claims.get("role") == "admin"


@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():

    if not check_admin():
        return jsonify({
            "message": "Admin access required"
        }), 403

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            "SELECT COUNT(*) AS total_students FROM users WHERE role='student'"
        )

        students = cursor.fetchone()["total_students"]

        cursor.execute(
            "SELECT COUNT(*) AS total_candidates FROM candidates"
        )

        candidates = cursor.fetchone()["total_candidates"]

        cursor.execute(
            "SELECT COUNT(*) AS total_votes FROM votes"
        )

        votes = cursor.fetchone()["total_votes"]

        cursor.execute(
            "SELECT * FROM elections ORDER BY id DESC LIMIT 1"
        )

        election = cursor.fetchone()

        return jsonify({
            "total_students": students,
            "total_candidates": candidates,
            "total_votes": votes,
            "election": election
        })

    finally:

        cursor.close()
        connection.close()


@admin_bp.route("/candidates", methods=["GET"])
@jwt_required()
def get_candidates():

    if not check_admin():
        return jsonify({
            "message": "Admin access required"
        }), 403

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.name,
                c.department,
                c.position,
                c.manifesto,
                c.election_id
            FROM candidates c
            ORDER BY c.id DESC
            """
        )

        candidates = cursor.fetchall()

        return jsonify(candidates)

    finally:

        cursor.close()
        connection.close()


@admin_bp.route("/candidates", methods=["POST"])
@jwt_required()
def add_candidate():

    if not check_admin():
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json()

    name = data.get("name")
    department = data.get("department")
    position = data.get("position")
    manifesto = data.get("manifesto")
    election_id = data.get("election_id")

    if not name or not position or not election_id:
        return jsonify({
            "message": "Name, position and election are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO candidates
            (name, department, position, manifesto, election_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                name,
                department,
                position,
                manifesto,
                election_id
            )
        )

        connection.commit()

        return jsonify({
            "message": "Candidate added successfully"
        }), 201

    finally:

        cursor.close()
        connection.close()


@admin_bp.route("/candidates/<int:candidate_id>", methods=["DELETE"])
@jwt_required()
def delete_candidate(candidate_id):

    if not check_admin():
        return jsonify({
            "message": "Admin access required"
        }), 403

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM candidates
            WHERE id = %s
            """,
            (candidate_id,)
        )

        connection.commit()

        return jsonify({
            "message": "Candidate deleted"
        })

    finally:

        cursor.close()
        connection.close()


@admin_bp.route("/election/toggle", methods=["PUT"])
@jwt_required()
def toggle_election():

    if not check_admin():
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json()

    election_id = data.get("election_id")
    is_active = data.get("is_active")

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            UPDATE elections
            SET is_active = %s
            WHERE id = %s
            """,
            (is_active, election_id)
        )

        connection.commit()

        return jsonify({
            "message": "Election status updated"
        })

    finally:

        cursor.close()
        connection.close()


@admin_bp.route("/results", methods=["GET"])
@jwt_required()
def results():

    if not check_admin():
        return jsonify({
            "message": "Admin access required"
        }), 403

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                c.id,
                c.name,
                c.department,
                c.position,
                COUNT(v.id) AS vote_count
            FROM candidates c
            LEFT JOIN votes v
                ON c.id = v.candidate_id
            GROUP BY
                c.id,
                c.name,
                c.department,
                c.position
            ORDER BY vote_count DESC
            """
        )

        results = cursor.fetchall()

        return jsonify(results)

    finally:

        cursor.close()
        connection.close()
