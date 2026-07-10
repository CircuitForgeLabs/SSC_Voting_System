-- =========================================================================
-- 01_schema.sql
-- Run this FIRST in the Supabase SQL Editor.
-- Creates all core tables, indexes, and enables Realtime.
-- =========================================================================

-- ---------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------
create table if not exists public.positions (
  id             bigint generated always as identity primary key,
  position_name  text not null,
  max_votes      int  not null default 1 check (max_votes > 0),
  display_order  int  not null default 0,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- candidates
-- ---------------------------------------------------------------------
create table if not exists public.candidates (
  id             bigint generated always as identity primary key,
  full_name      text not null,
  position_id    bigint not null references public.positions(id) on delete cascade,
  party_list     text,
  course         text,
  year_level     text,
  photo_url      text,
  display_order  int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists idx_candidates_position_id on public.candidates(position_id);
create index if not exists idx_candidates_active on public.candidates(active);

-- ---------------------------------------------------------------------
-- students  (the voter roll — one row per eligible student number)
-- ---------------------------------------------------------------------
create table if not exists public.students (
  student_number text primary key,
  has_voted      boolean not null default false,
  voted_at       timestamptz
);

create index if not exists idx_students_has_voted on public.students(has_voted);

-- ---------------------------------------------------------------------
-- votes  (one row per candidate selected — a student voting for 5 board
-- members produces 5 rows, all sharing the same student_number)
-- ---------------------------------------------------------------------
create table if not exists public.votes (
  id             bigint generated always as identity primary key,
  student_number text not null references public.students(student_number),
  candidate_id   bigint not null references public.candidates(id),
  position_id    bigint not null references public.positions(id),
  created_at     timestamptz not null default now()
);

create index if not exists idx_votes_candidate_id on public.votes(candidate_id);
create index if not exists idx_votes_position_id on public.votes(position_id);
create index if not exists idx_votes_student_number on public.votes(student_number);

-- ---------------------------------------------------------------------
-- Public-safe views
-- The site's anon key never reads the raw students/votes tables — only
-- these narrow views, so a browser can never dump the full voter roll
-- with names, nor tie a vote back to a student number.
-- ---------------------------------------------------------------------
create or replace view public.students_lookup as
  select student_number, has_voted from public.students;

create or replace view public.votes_public as
  select candidate_id, position_id from public.votes;

-- ---------------------------------------------------------------------
-- Enable Realtime so the dashboard and ballot update live
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.candidates;
