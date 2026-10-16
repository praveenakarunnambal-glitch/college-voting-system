
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
        return fail("Please select one candidate for each position")

    selected_ids = {}

    for position in required_positions:
        try:
            selected_ids[position] = int(votes_data[position])
        except (KeyError, TypeError, ValueError):
            return fail(f"Please select one candidate for {position}")

    if len(set(selected_ids.values())) != 3:
        return fail("Please select a valid candidate for each position")

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
                "Authorization expired or already used. Ask staff to verify again.",
                401,
            )

        # Check whether the student has already voted.
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
            return fail(
                "This student has already voted in this election.",
                409,
            )

        # Validate all selected candidates and their positions.
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
            int(row["id"]): row
            for row in cursor.fetchall()
        }

        for position, candidate_id in selected_ids.items():
            candidate = candidates.get(candidate_id)

            if candidate is None:
                connection.rollback()
                return fail(
                    f"Invalid candidate selected for {position}.",
                    400,
                )

            if (
                str(candidate["position"]).strip().casefold()
                != position.casefold()
            ):
                connection.rollback()
                return fail(
                    f"Please select a candidate for {position}.",
                    400,
                )

        # Save all three votes together.
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

        # Prevent reuse of this authorization token.
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
            "message": (
                "Vote submitted successfully for all three positions!"
            )
        }), 201

    except Exception as exc:
        connection.rollback()

        if getattr(exc, "errno", None) == 1062:
            return fail("This student has already voted.", 409)

        print("Campus vote error:", exc)

        return fail(
            "Unable to submit votes. Please contact election staff.",
            500,
        )

    finally:
        cursor.close()
        connection.close()
