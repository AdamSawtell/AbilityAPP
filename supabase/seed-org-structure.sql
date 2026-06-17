-- Organisation structure seed (from employee job titles and reports_to_id)
-- Re-run: npx supabase db query --linked -f supabase/seed-org-structure.sql

delete from public.position_assignment where position_id like 'pos-%';
delete from public.org_position where id like 'pos-%';

insert into public.org_position (
  id, title, department, business_area, location_id, parent_position_id, sort_order, status, site, cost_centre, primary_employee_id
) values
  ('pos-org-root', 'Organisation', '', '', null, null, 0, 'filled', '', '', null),
  ('pos-gm-ops', 'Team Leader — Support coordination', 'Operations', 'Operations', 'loc-adelaide-hub', 'pos-org-root', 10, 'filled', 'Adelaide HQ', 'CC-CLIENT', 'emp-michael'),
  ('pos-coordinator', 'Support Coordinator', 'Client services', 'Client services', 'loc-adelaide-hub', 'pos-gm-ops', 10, 'filled', 'Adelaide HQ', 'CC-CLIENT', 'emp-isla'),
  ('pos-intake', 'Intake Officer', 'Intake', 'Intake', 'loc-adelaide-hub', 'pos-gm-ops', 20, 'filled', 'Adelaide HQ', 'CC-INTAKE', 'emp-gabriela'),
  ('pos-support-worker', 'Support Worker', 'Operations', 'Operations', 'loc-northern-sil', 'pos-gm-ops', 30, 'filled', 'Northern SIL', 'CC-OPS', 'emp-oliver'),
  ('pos-plan-dev', 'Plan Developer', 'Client services', 'Client services', null, 'pos-org-root', 20, 'filled', '', '', 'emp-rose'),
  ('pos-contracts', 'Contract Administrator', 'Finance', 'Finance', null, 'pos-org-root', 30, 'filled', '', '', 'emp-jessica'),
  ('pos-quality-vacant', 'Quality & Compliance Manager', 'Quality', 'Quality', 'loc-adelaide-hub', 'pos-org-root', 15, 'under_recruitment', 'Adelaide HQ', 'CC-QUALITY', null)
on conflict (id) do update set
  title = excluded.title,
  department = excluded.department,
  business_area = excluded.business_area,
  location_id = excluded.location_id,
  parent_position_id = excluded.parent_position_id,
  sort_order = excluded.sort_order,
  status = excluded.status,
  site = excluded.site,
  cost_centre = excluded.cost_centre,
  primary_employee_id = excluded.primary_employee_id,
  updated_at = now();

insert into public.position_assignment (
  id, position_id, employee_id, assignment_type, effective_from, effective_to, notes
) values
  ('pa-michael-primary', 'pos-gm-ops', 'emp-michael', 'primary', '2018-01-10', null, 'Seed primary assignment'),
  ('pa-isla-primary', 'pos-coordinator', 'emp-isla', 'primary', '2019-03-01', null, 'Seed primary assignment'),
  ('pa-gabriela-primary', 'pos-intake', 'emp-gabriela', 'primary', '2020-06-15', null, 'Seed primary assignment'),
  ('pa-oliver-primary', 'pos-support-worker', 'emp-oliver', 'primary', '2021-09-01', null, 'Seed primary assignment'),
  ('pa-rose-primary', 'pos-plan-dev', 'emp-rose', 'primary', '2017-11-20', null, 'Seed primary assignment'),
  ('pa-jessica-primary', 'pos-contracts', 'emp-jessica', 'primary', '2022-02-01', null, 'Seed primary assignment')
on conflict (id) do update set
  position_id = excluded.position_id,
  employee_id = excluded.employee_id,
  assignment_type = excluded.assignment_type,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  notes = excluded.notes,
  updated_at = now();

-- Bulk support workers: npx supabase db query --linked -f supabase/seed-org-structure-bulk.sql
