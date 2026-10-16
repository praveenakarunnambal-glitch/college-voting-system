COLLEGE VOTING SYSTEM - CAMPUS VOTING ADDITION
==============================================

Included:
- Online OTP files/routes were left unchanged.
- New staff campus login and student verification endpoints.
- Separate student-only campus ballot page.
- Campus authorization expires after 5 minutes and is single-use.
- No phone number or OTP is requested in the campus flow.

IMPORTANT SECURITY / SETUP
--------------------------
1. This package deliberately excludes backend/.env and backend/.env copy because
   they can contain database/API secrets. Keep your original .env locally.
2. Extract this ZIP over a copy of your existing project, not over the only copy.
3. Open backend/database/campus_voting_migration.sql.
   - Run the register_number ALTER only if that column does not already exist.
   - Run the role ENUM ALTER if the existing role column does not include 'staff'.
   - The campus_authorizations CREATE TABLE can be run if that table is absent.
4. Check that the users table contains name, email, password, role, register_number.
   Online OTP code may also need mobile, which remains untouched.
5. Create a staff account from backend:
      python create_staff.py
   This requires the backend virtual environment/dependencies and working DB.
6. Start Flask as usual:
      python app.py
7. In frontend:
      npm install
      npm run dev
8. Open http://localhost:5173/campus for staff login.
   The student voting page is opened only after staff authorization.

API endpoints:
POST /api/campus/staff-login
POST /api/campus/authorize        (JWT role staff/admin)
GET  /api/campus/candidates       (X-Campus-Token header)
POST /api/campus/vote             (X-Campus-Token header)

The existing vote table's one_vote_per_election unique key is retained.
This implementation allows one candidate per election per student, matching
the supplied votes schema. The current online Vote.jsx submits three separate
votes (President, Vice President, Secretary), which conflicts with that schema's
one_vote_per_election constraint. That pre-existing design inconsistency is not
changed automatically by this campus patch; if your election requires one vote
per position, the database and backend must be redesigned together before use.

For real elections, do not treat this sample as a certified election system.
Protect staff credentials, use HTTPS, restrict access to the campus device,
and independently test identity verification, ballot secrecy, and session cleanup.
