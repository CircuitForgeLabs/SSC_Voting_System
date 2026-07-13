delete from public.votes
where student_number in ('2023-00101', '2023-00102');

update public.students
set has_voted = false, voted_at = null
where student_number in ('2023-00101', '2023-00102');