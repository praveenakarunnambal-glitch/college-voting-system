
ALTER TABLE elections
ADD CONSTRAINT unique_election_title UNIQUE (title);
INSERT INTO elections (title, description, is_active)
VALUES (
    'College Student Council Election 2026',
    'College Student Council General Election',
    TRUE
)
ON DUPLICATE KEY UPDATE
    description = VALUES(description);
    USE college_voting;

SELECT
    name,
    department,
    position,
    COUNT(*) AS duplicate_count
FROM candidates
WHERE election_id = 5
GROUP BY name, department, position
ORDER BY duplicate_count DESC;
USE college_voting;

DELETE c1
FROM candidates c1
JOIN candidates c2
  ON c1.election_id = c2.election_id
 AND c1.name = c2.name
 AND c1.department = c2.department
 AND c1.position = c2.position
 AND c1.id > c2.id
WHERE c1.election_id = 5;
SELECT COUNT(*) AS total_candidates
FROM candidates
WHERE election_id = 5;
DELETE c1
FROM candidates c1
JOIN candidates c2
  ON c1.election_id = c2.election_id
 AND c1.name = c2.name
 AND c1.department = c2.department
 AND c1.position = c2.position
 AND c1.id > c2.id
WHERE c1.election_id = 5;
SELECT
    id,
    name,
    department,
    position,
    election_id
FROM candidates
WHERE election_id = 5
ORDER BY id;
USE college_voting;

DELETE FROM candidates
WHERE election_id = 5
AND id NOT IN (32,33,34,35,36,37);
SELECT
    id,
    name,
    department,
    position,
    election_id
FROM candidates
WHERE election_id = 5
ORDER BY id;
ALTER TABLE candidates
ADD CONSTRAINT unique_candidate_per_election
UNIQUE (election_id, name, department, position);
USE college_voting;

DESCRIBE users;
USE college_voting;

ALTER TABLE users
ADD COLUMN register_number VARCHAR(50) NULL AFTER name,
ADD COLUMN mobile VARCHAR(15) NULL AFTER email;
DESCRIBE users;
USE college_voting;

SELECT
    id,
    name,
    register_number,
    email,
    mobile,
    role
FROM users
WHERE role = 'student';
USE college_voting;

UPDATE users
SET
    register_number = 'REG001',
    mobile = '+917200934877'
WHERE id = 2;
SELECT
    id,
    name,
    register_number,
    email,
    mobile,
    role
FROM users
WHERE id = 2;