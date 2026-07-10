-- =========================================================================
-- 03_rls_policies.sql
-- Run this THIRD.
-- Locks every table down, then opens only the exact access the public
-- site needs:
--   - positions / candidates: anyone can read, nobody can write
--   - students / votes: nobody can read or write directly at all —
--     the site only ever reads students_lookup / votes_public, and only
--     ever writes through the cast_vote() function above
-- =========================================================================

alter table public.positions  enable row level security;
alter table public.candidates enable row level security;
alter table public.students   enable row level security;
alter table public.votes      enable row level security;

-- positions: public read-only
create policy "positions are publicly readable"
  on public.positions for select
  using (true);

-- candidates: public read-only
create policy "candidates are publicly readable"
  on public.candidates for select
  using (true);

-- students: NO direct public policies.
-- Nobody using the anon key can select/insert/update/delete this table
-- directly; it is only reachable through students_lookup (read) and
-- cast_vote() (write), both of which run with elevated privileges.

-- votes: NO direct public policies.
-- Nobody using the anon key can select/insert/update/delete this table
-- directly; it is only reachable through votes_public (read) and
-- cast_vote() (write).

-- Views inherit the querying role's privileges by default, so make the
-- two lookup views explicitly public-readable regardless of the base
-- table locks above.
grant select on public.students_lookup to anon, authenticated;
grant select on public.votes_public   to anon, authenticated;
grant select on public.positions, public.candidates to anon, authenticated;
