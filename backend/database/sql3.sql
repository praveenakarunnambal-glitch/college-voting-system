USE college_voting;

SELECT id, name, email, role
FROM users
WHERE email = 'admin@college.com';
USE college_voting;

UPDATE users
SET password = 'scrypt:32768:8:1$v6KzUPzxmeoGObja$46e04cdb806c9fb3ff08a37f2e0d68f6c0e3a6f10f9a6e761ffc69b80b5f16b61212bee8228074e24901a019365a9006212ac77276621fbf25e324ad40f209dd'
WHERE email = 'admin@college.com';