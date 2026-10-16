USE college_voting;

-- IMPORTANT: run the next ALTER only if register_number is absent.
-- If it already exists, skip these two lines.
-- ALTER TABLE users ADD COLUMN register_number VARCHAR(50) NULL;

-- If role is an ENUM without 'staff', run this ALTER:
ALTER TABLE users
    MODIFY COLUMN role ENUM('student', 'admin', 'staff') NOT NULL DEFAULT 'student';

CREATE TABLE IF NOT EXISTS campus_authorizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    election_id INT NOT NULL,
    staff_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_campus_auth_student
        FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_campus_auth_election
        FOREIGN KEY (election_id) REFERENCES elections(id),
    CONSTRAINT fk_campus_auth_staff
        FOREIGN KEY (staff_id) REFERENCES users(id)
);

-- Before adding a one-vote constraint, inspect existing duplicates:
-- SELECT user_id, election_id, COUNT(*) AS total
-- FROM votes GROUP BY user_id, election_id HAVING COUNT(*) > 1;
-- Your provided schema already defines one_vote_per_election.
