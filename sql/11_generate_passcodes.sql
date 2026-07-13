-- =========================================================================
-- 11_generate_passcodes.sql
-- Auto-generates a random 6-character passcode for every student that
-- doesn't already have one. Safe to re-run — it skips students who
-- already have a passcode set.
-- =========================================================================

update public.students
set passcode = upper(substr(md5(random()::text || student_number), 1, 6))
where passcode is null;

-- View the results so you can export/print them for distribution.
select student_number, passcode
from public.students
order by student_number;
