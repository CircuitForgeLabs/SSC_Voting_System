-- Wipes ALL votes and resets every student to "not voted".
-- Use this before the real election starts, after you're done testing.
delete from public.votes;

update public.students
set has_voted = false, voted_at = null;