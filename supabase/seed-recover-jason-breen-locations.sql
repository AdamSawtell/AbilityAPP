-- Restore Jason Breen (emp-1782473053908) site assignments after accidental full reseed.
-- Safe to re-run (fixed ids). Does NOT touch other employees or role grants.
-- Run: node scripts/run-all-remote-seeds.mjs supabase/seed-recover-jason-breen-locations.sql

insert into public.support_location_employee (
  id, location_id, line_no, employee_id, assignment_role, primary_assignment, valid_from, notes
)
values (
  'loc-emp-glen-emp-jason-breen',
  'loc-glenelg-sil',
  (select coalesce(max(line_no), 0) + 1 from public.support_location_employee where location_id = 'loc-glenelg-sil'),
  'emp-1782473053908',
  'Support worker',
  'No',
  current_date,
  'Restored — Glenelg SIL House'
)
on conflict (id) do update set
  location_id = excluded.location_id,
  line_no = excluded.line_no,
  employee_id = excluded.employee_id,
  assignment_role = excluded.assignment_role,
  primary_assignment = excluded.primary_assignment,
  valid_from = excluded.valid_from,
  notes = excluded.notes;

insert into public.support_location_employee (
  id, location_id, line_no, employee_id, assignment_role, primary_assignment, valid_from, notes
)
values (
  'loc-emp-northern-emp-jason-breen',
  'loc-northern-sil',
  (select coalesce(max(line_no), 0) + 1 from public.support_location_employee where location_id = 'loc-northern-sil'),
  'emp-1782473053908',
  'Support worker',
  'No',
  current_date,
  'Restored — Northern SIL'
)
on conflict (id) do update set
  location_id = excluded.location_id,
  line_no = excluded.line_no,
  employee_id = excluded.employee_id,
  assignment_role = excluded.assignment_role,
  primary_assignment = excluded.primary_assignment,
  valid_from = excluded.valid_from,
  notes = excluded.notes;
