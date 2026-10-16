
# =====================================================
# FIND REGISTERED STUDENT
# =====================================================

def find_user(cursor, register_number, mobile):
    mobile_digits = "".join(
        ch for ch in str(mobile or "") if ch.isdigit()
    )

    # Convert +91XXXXXXXXXX to XXXXXXXXXX
    if mobile_digits.startswith("91") and len(mobile_digits) == 12:
        local_mobile = mobile_digits[2:]
    else:
        local_mobile = mobile_digits

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
            local_mobile,
            "91" + local_mobile
        )
    )

    return cursor.fetchone()


# =====================================================
# VALIDATE REGISTERED STUDENT
# =====================================================

def validate_existing_student(user, name, register_number, mobile):
    if not user or user["role"] != "student":
        return "Registered student account not found"

    db_name = (user["name"] or "").strip()
    entered_name = (name or "").strip()

    if db_name.casefold() != entered_name.casefold():
        return "Student name does not match"

    db_register_number = (
        user["register_number"] or ""
    ).strip()

    if db_register_number.casefold() != register_number.strip().casefold():
        return "Register number does not match"

    db_mobile = "".join(
        ch for ch in str(user["mobile"] or "") if ch.isdigit()
    )
    entered_mobile = "".join(
        ch for ch in str(mobile or "") if ch.isdigit()
    )

    # Compare numbers consistently with or without India's 91 prefix
    if db_mobile.startswith("91") and len(db_mobile) == 12:
        db_mobile = db_mobile[2:]

    if entered_mobile.startswith("91") and len(entered_mobile) == 12:
        entered_mobile = entered_mobile[2:]

    if db_mobile != entered_mobile:
        return "Phone number does not match registered number"

    return None
