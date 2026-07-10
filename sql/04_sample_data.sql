-- =========================================================================
-- 04_sample_data.sql
-- OPTIONAL — run this to try the system out before importing real data.
-- Safe to skip, edit, or delete rows afterward from Table Editor.
-- =========================================================================

insert into public.positions (position_name, max_votes, display_order) values
  ('President', 1, 1),
  ('Vice President', 1, 2),
  ('Secretary', 1, 3),
  ('Treasurer', 1, 4),
  ('Auditor', 1, 5),
  ('Business Manager', 1, 6),
  ('P.R.O.', 1, 7),
  ('1st Year Representative', 1, 8),
  ('2nd Year Representative', 1, 9),
  ('3rd Year Representative', 1, 10),
  ('4th Year Representative', 1, 11)
on conflict do nothing;

-- Candidates reference positions by name lookup so the IDs don't need
-- to be guessed.
insert into public.candidates (full_name, position_id, party_list, course, year_level, display_order, active)
select v.full_name, p.id, v.party_list, v.course, v.year_level, v.display_order, true
from (values
  ('Maria Santos',   'President',       'Unity Party',   'BS Education',        '4th Year', 1),
  ('John Reyes',     'President',       'Vanguard Party','BS Information Tech', '4th Year', 2),
  ('Angela Cruz',    'Vice President',  'Unity Party',   'BS Accountancy',      '3rd Year', 1),
  ('Miguel Torres',  'Vice President',  'Vanguard Party','BS Criminology',      '3rd Year', 2),
  ('Bea Ramos',      'Secretary',       'Unity Party',   'BS Nursing',          '2nd Year', 1),
  ('Carlo Villar',   'Treasurer',       'Unity Party',   'BS Accountancy',      '3rd Year', 1),
  ('Nikki Bautista', 'Auditor',         'Vanguard Party','BS Business Admin',   '2nd Year', 1)
) as v(full_name, position_name, party_list, course, year_level, display_order)
join public.positions p on p.position_name = v.position_name
on conflict do nothing;

insert into public.students (student_number) values
  ('2023-00101'),
  ('2023-00102'),
  ('2023-00103'),
  ('2023-00104'),
  ('2023-00105')
on conflict do nothing;
