-- =========================================================================
-- 02_functions.sql
-- Run this SECOND.
-- The cast_vote() function is the ONLY way ballots get written. It runs
-- with elevated (SECURITY DEFINER) privileges so it can update the
-- students table even though the anon key otherwise cannot, and it does
-- all validation + the has_voted flip in one atomic transaction, so two
-- simultaneous requests from the same student can never both succeed.
-- =========================================================================

create or replace function public.cast_vote(
  p_student_number text,
  p_candidate_ids bigint[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
  v_position_counts jsonb;
  v_candidate record;
  v_counts jsonb := '{}'::jsonb;
  v_key text;
begin
  -- Lock the student row so a second simultaneous submit must wait,
  -- then fails the has_voted check below instead of double-voting.
  select * into v_student
  from public.students
  where student_number = p_student_number
  for update;

  if not found then
    raise exception 'Student number not registered';
  end if;

  if v_student.has_voted then
    raise exception 'This student number has already voted';
  end if;

  if p_candidate_ids is null or array_length(p_candidate_ids, 1) is null then
    raise exception 'No candidates were selected';
  end if;

  -- Server-side re-check of the per-position selection limit, so the
  -- rule is enforced even if a request bypasses the browser UI.
  for v_candidate in
    select c.id, c.position_id, p.max_votes, p.position_name
    from public.candidates c
    join public.positions p on p.id = c.position_id
    where c.id = any(p_candidate_ids) and c.active = true
  loop
    v_key := v_candidate.position_id::text;
    v_counts := jsonb_set(
      v_counts,
      array[v_key],
      to_jsonb(coalesce((v_counts->>v_key)::int, 0) + 1)
    );
    if (v_counts->>v_key)::int > v_candidate.max_votes then
      raise exception 'Too many selections for %', v_candidate.position_name;
    end if;
  end loop;

  -- Reject silently-dropped/inactive candidate ids (selection count
  -- must match what was validated above).
  if (
    select count(*) from public.candidates
    where id = any(p_candidate_ids) and active = true
  ) <> array_length(p_candidate_ids, 1) then
    raise exception 'One or more selected candidates are invalid';
  end if;

  insert into public.votes (student_number, candidate_id, position_id)
  select p_student_number, c.id, c.position_id
  from public.candidates c
  where c.id = any(p_candidate_ids);

  update public.students
  set has_voted = true, voted_at = now()
  where student_number = p_student_number;

  return jsonb_build_object('success', true);
end;
$$;

-- Only logged-in-less "anon" visitors of the public site call this —
-- there is no other write path into votes/students.
grant execute on function public.cast_vote(text, bigint[]) to anon, authenticated;
