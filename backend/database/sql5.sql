USE college_voting;

ALTER TABLE votes
ADD COLUMN position VARCHAR(100) NULL AFTER election_id;
UPDATE votes v
JOIN candidates c
ON v.candidate_id = c.id
SET v.position = c.position;
SET SQL_SAFE_UPDATES = 0;
UPDATE votes v
JOIN candidates c
ON v.candidate_id = c.id
SET v.position = c.position;
ALTER TABLE votes
MODIFY COLUMN position VARCHAR(100) NOT NULL;
USE college_voting;

ALTER TABLE votes
DROP INDEX one_vote_per_election;
USE college_voting;

ALTER TABLE votes
DROP INDEX one_vote_per_election;
ALTER TABLE votes
ADD CONSTRAINT one_vote_per_position
UNIQUE (user_id, election_id, position);
USE college_voting;

ALTER TABLE votes
ADD INDEX idx_votes_election_id (election_id);
ALTER TABLE votes
SHOW CREATE TABLE votes;
DROP INDEX one_vote_per_election;