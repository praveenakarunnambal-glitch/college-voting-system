USE college_voting;

SHOW CREATE TABLE votes;
USE college_voting;

SELECT id, title, is_active
FROM elections
ORDER BY id DESC;
USE college_voting;

INSERT INTO candidates
(name, department, position, manifesto, election_id)
VALUES
(
    'Vijay Kumar',
    'Computer Science',
    'Vice President',
    'Improve student communication and support student activities',
    5
),
(
    'Meena Priya',
    'Information Technology',
    'Vice President',
    'Organize technical events and improve student facilities',
    5
),
(
    'Rahul Raj',
    'Commerce',
    'Vice President',
    'Improve student welfare and campus development',
    5
);
SELECT id, name, department, position, election_id
FROM candidates
WHERE election_id = 5
ORDER BY id;