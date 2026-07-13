-- =========================================================================
-- 10_add_passcode.sql
-- Adds a per-student passcode as a second factor alongside student
-- number. Run this in the Supabase SQL Editor.
-- =========================================================================

-- 1. Add the column
alter table public.students
  add column if not exists passcode text;

-- 2. Replace the public lookup view so it does NOT expose passcodes —
--    the passcode is only ever checked server-side, never read by the
--    browser directly.
create or replace view public.students_lookup as
  select student_number, has_voted from public.students;

-- 3. A dedicated function that verifies student number + passcode
--    together, without ever exposing the passcode itself to the browser.
--    Returns true/false only.
create or replace function public.verify_passcode(
  p_student_number text,
  p_passcode text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match boolean;
begin
  select (passcode is not null and passcode = p_passcode)
  into v_match
  from public.students
  where student_number = p_student_number;

  return coalesce(v_match, false);
end;
$$;

grant execute on function public.verify_passcode(text, text) to anon, authenticated;

-- 4. Update cast_vote() to also require + re-check the passcode, so the
--    check can't be bypassed even by calling the API directly.
create or replace function public.cast_vote(
  p_student_number text,
  p_passcode text,
  p_candidate_ids bigint[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
  v_candidate record;
  v_counts jsonb := '{}'::jsonb;
  v_key text;
begin
  select * into v_student
  from public.students
  where student_number = p_student_number
  for update;

  if not found then
    raise exception 'Student number not registered';
  end if;

  if v_student.passcode is null or v_student.passcode <> p_passcode then
    raise exception 'Incorrect passcode';
  end if;

  if v_student.has_voted then
    raise exception 'This student number has already voted';
  end if;

  if p_candidate_ids is null or array_length(p_candidate_ids, 1) is null then
    raise exception 'No candidates were selected';
  end if;

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

-- Drop the old signature so only the new (student_number, passcode,
-- candidate_ids) version remains callable.
drop function if exists public.cast_vote(text, bigint[]);

grant execute on function public.cast_vote(text, text, bigint[]) to anon, authenticated;
