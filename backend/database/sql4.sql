USE college_voting;

SELECT
    id,
    name,
    register_number,
    email,
    mobile,
    role
FROM users
WHERE email = 'student1@gmail.com';