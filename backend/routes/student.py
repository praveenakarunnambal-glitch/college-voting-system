
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from db import get_db_connection

student_bp = Blueprint("student", __name__)


def check_student():
    return get_jwt().get("role") == "student"


@student_bp.route("/election", methods=["GET"])
@jwt_required()
def get_election():
    if not check_student():
        return jsonify({"message": "Student access required"}), 403

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, title, description, is_active
            FROM elections
            WHERE is_active = 1
            ORDER BY id DESC
            LIMIT 1
        """)
        election = cursor.fetchone()

        if not election:
            return jsonify({"message": "No active election found"}), 404

        cursor.execute("""
            SELECT id, name, department, position, manifesto
            FROM candidates
            WHERE election_id = %s
            ORDER BY id
        """, (election["id"],))

        return jsonify({
            "election": election,
            "candidates": cursor.fetchall()
        }), 200

    finally:
        cursor.close()
        connection.close()


@student_bp.route("/my-vote", methods=["GET"])
@jwt_required()
def my_vote():
    if not check_student():
        return jsonify({"message": "Student access required"}), 403

    user_id = get_jwt_identity()
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT v.id, v.election_id, v.voted_at,
                   c.name AS candidate_name, v.position
            FROM votes v
            JOIN candidates c ON c.id = v.candidate_id
            WHERE v.user_id = %s
            ORDER BY v.id DESC
        """, (user_id,))

        votes = cursor.fetchall()

        return jsonify({
            "has_voted": len(votes) > 0,
            "votes": votes,
            "vote": votes[0] if votes else None
        }), 200

    finally:
        cursor.close()
        connection.close()


@student_bp.route("/vote", methods=["POST"])
@jwt_required()
def vote():
    if not check_student():
        return jsonify({"message": "Student access required"}), 403

    data = request.get_json() or {}
    user_id = get_jwt_identity()
    election_id = data.get("election_id")
    selections = data.get("votes")

    required_positions = [
        "President",
        "Vice President",
        "Secretary"
    ]

    if not election_id or not isinstance(selections, dict):
        return jsonify({
            "message": "Election and all three selections are required"
        }), 400

    if any(not selections.get(position) for position in required_positions):
        return jsonify({
            "message": "Select one candidate for each position"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        connection.start_transaction()

        cursor.execute("""
            SELECT id, is_active
            FROM elections
            WHERE id = %s
            FOR UPDATE
        """, (election_id,))
        election = cursor.fetchone()

        if not election or not election["is_active"]:
            connection.rollback()
            return jsonify({"message": "Election is not active"}), 400

        # Do not allow duplicate submissions for the same election.
        cursor.execute("""
            SELECT id
            FROM votes
            WHERE user_id = %s AND election_id = %s
            LIMIT 1
            FOR UPDATE
        """, (user_id, election_id))

        if cursor.fetchone():
            connection.rollback()
            return jsonify({
                "message": "You have already submitted a vote for this election"
            }), 409

        # Validate every candidate and its position before inserting any vote.
        validated_votes = []

        for position in required_positions:
            candidate_id = selections[position]

            cursor.execute("""
                SELECT id, position
                FROM candidates
                WHERE id = %s AND election_id = %s
            """, (candidate_id, election_id))

            candidate = cursor.fetchone()

            if not candidate:
                connection.rollback()
                return jsonify({
                    "message": "Invalid candidate selected"
                }), 400

            if (candidate["position"] or "").strip().casefold() != position.casefold():
                connection.rollback()
                return jsonify({
                    "message": "Candidate does not match the selected position"
                }), 400

            validated_votes.append((user_id, candidate["id"], election_id, position))

        for vote_data in validated_votes:
            cursor.execute("""
                INSERT INTO votes
                    (user_id, candidate_id, election_id, position)
                VALUES (%s, %s, %s, %s)
            """, vote_data)

        connection.commit()

        return jsonify({
            "message": "All three votes submitted successfully"
        }), 201

    except Exception:
        connection.rollback()
        print("Vote submission failed")

        return jsonify({
            "message": "Vote submission failed. Please try again."
        }), 500

    finally:
        cursor.close()
        connection.close()
