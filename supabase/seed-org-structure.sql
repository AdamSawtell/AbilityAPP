-- Organisation structure seed (generated)
-- Re-run: npx supabase db query --linked -f supabase/seed-org-structure.sql

delete from public.position_assignment where position_id like 'pos-%';
delete from public.org_position where id like 'pos-%';

insert into public.org_position (
  id, title, security_role_id, department, business_area, location_id, parent_position_id, sort_order, status, site, cost_centre, primary_employee_id
) values
  ('pos-org-root', 'Organisation', null, '', '', null, null, 0, 'filled', '', '', null),
  ('pos-board', 'Board of Directors', 'role-board', 'Executive', 'Executive', 'loc-adelaide-hub', 'pos-org-root', 5, 'vacant', 'Adelaide HQ', 'CC-EXEC', null),
  ('pos-board-1', 'Board Member — Chair', 'role-board', 'Executive', 'Executive', 'loc-adelaide-hub', 'pos-board', 10, 'filled', 'Adelaide HQ', 'CC-EXEC', 'emp-board-chair'),
  ('pos-board-2', 'Board Member', 'role-board', 'Executive', 'Executive', 'loc-adelaide-hub', 'pos-board', 20, 'filled', 'Adelaide HQ', 'CC-EXEC', 'emp-board-2'),
  ('pos-board-3', 'Board Member', 'role-board', 'Executive', 'Executive', 'loc-adelaide-hub', 'pos-board', 30, 'filled', 'Adelaide HQ', 'CC-EXEC', 'emp-board-3'),
  ('pos-board-4', 'Board Member', 'role-board', 'Executive', 'Executive', 'loc-adelaide-hub', 'pos-board', 40, 'filled', 'Adelaide HQ', 'CC-EXEC', 'emp-board-4'),
  ('pos-ceo', 'Chief Executive Officer', 'role-ceo', 'Executive', 'Executive', 'loc-adelaide-hub', 'pos-board', 50, 'filled', 'Adelaide HQ', 'CC-EXEC', 'emp-ceo'),
  ('pos-exec-ops', 'Operations Executive', 'role-exec-operations', 'Operations', 'Operations', 'loc-adelaide-hub', 'pos-ceo', 10, 'filled', 'Adelaide HQ', 'CC-OPS', 'emp-michael'),
  ('pos-gm-ops', 'Operations Manager', 'role-team-leader', 'Operations', 'Operations', 'loc-adelaide-hub', 'pos-exec-ops', 20, 'filled', 'Adelaide HQ', 'CC-OPS', 'emp-staff-133'),
  ('pos-rostering-manager', 'Rostering Manager', 'role-rostering-manager', 'Operations', 'Operations', 'loc-adelaide-hub', 'pos-exec-ops', 30, 'filled', 'Adelaide HQ', 'CC-OPS', 'emp-rostering-manager'),
  ('pos-rostering-officer', 'Rostering Officer', 'role-rostering-officer', 'Operations', 'Operations', 'loc-adelaide-hub', 'pos-rostering-manager', 10, 'filled', 'Adelaide HQ', 'CC-OPS', 'emp-rostering-officer'),
  ('pos-coordinator', 'Support Coordinator', 'role-coordinator', 'Client services', 'Client services', 'loc-adelaide-hub', 'pos-exec-ops', 40, 'filled', 'Adelaide HQ', 'CC-CLIENT', 'emp-isla'),
  ('pos-intake', 'Intake Officer', 'role-intake', 'Intake', 'Intake', 'loc-adelaide-hub', 'pos-exec-ops', 50, 'filled', 'Adelaide HQ', 'CC-INTAKE', 'emp-gabriela'),
  ('pos-plan-dev', 'Plan Developer', 'role-coordinator', 'Client services', 'Client services', 'loc-adelaide-hub', 'pos-exec-ops', 60, 'filled', 'Adelaide HQ', 'CC-CLIENT', 'emp-rose'),
  ('pos-exec-hr', 'HR Executive', 'role-exec-hr', 'HR', 'HR', 'loc-adelaide-hub', 'pos-ceo', 20, 'filled', 'Adelaide HQ', 'CC-HR', 'emp-exec-hr'),
  ('pos-hr-manager', 'HR Manager', 'role-hr-manager', 'HR', 'HR', 'loc-adelaide-hub', 'pos-exec-hr', 10, 'filled', 'Adelaide HQ', 'CC-HR', 'emp-hr-manager'),
  ('pos-hr-officer', 'HR Officer', 'role-hr-officer', 'HR', 'HR', 'loc-adelaide-hub', 'pos-hr-manager', 10, 'filled', 'Adelaide HQ', 'CC-HR', 'emp-staff-146'),
  ('pos-exec-finance', 'Chief Financial Officer', 'role-exec-finance', 'Finance', 'Finance', 'loc-adelaide-hub', 'pos-ceo', 30, 'filled', 'Adelaide HQ', 'CC-FIN', 'emp-exec-finance'),
  ('pos-finance-manager', 'Finance Manager', 'role-finance-manager', 'Finance', 'Finance', 'loc-adelaide-hub', 'pos-exec-finance', 10, 'filled', 'Adelaide HQ', 'CC-FIN', 'emp-finance-manager'),
  ('pos-contracts', 'Contract Administrator', 'role-finance-officer', 'Finance', 'Finance', 'loc-adelaide-hub', 'pos-finance-manager', 10, 'filled', 'Adelaide HQ', 'CC-FIN', 'emp-jessica'),
  ('pos-finance-officer', 'Finance Officer', 'role-finance-officer', 'Finance', 'Finance', 'loc-adelaide-hub', 'pos-finance-manager', 20, 'filled', 'Adelaide HQ', 'CC-FIN', 'emp-staff-147'),
  ('pos-exec-ict', 'ICT Executive', 'role-exec-ict', 'ICT', 'ICT', 'loc-adelaide-hub', 'pos-ceo', 40, 'filled', 'Adelaide HQ', 'CC-ICT', 'emp-exec-ict'),
  ('pos-ict-manager', 'ICT Manager', 'role-ict-manager', 'ICT', 'ICT', 'loc-adelaide-hub', 'pos-exec-ict', 10, 'filled', 'Adelaide HQ', 'CC-ICT', 'emp-ict-manager'),
  ('pos-ict-officer', 'ICT Officer', 'role-ict-officer', 'ICT', 'ICT', 'loc-adelaide-hub', 'pos-ict-manager', 10, 'filled', 'Adelaide HQ', 'CC-ICT', 'emp-ict-officer'),
  ('pos-exec-quality', 'Quality Executive', 'role-exec-quality', 'Quality', 'Quality', 'loc-adelaide-hub', 'pos-ceo', 50, 'filled', 'Adelaide HQ', 'CC-QUALITY', 'emp-exec-quality'),
  ('pos-quality-manager', 'Quality Manager', 'role-quality-manager', 'Quality', 'Quality', 'loc-adelaide-hub', 'pos-exec-quality', 10, 'filled', 'Adelaide HQ', 'CC-QUALITY', 'emp-quality-manager'),
  ('pos-quality-officer', 'Quality Officer', 'role-quality-officer', 'Quality', 'Quality', 'loc-adelaide-hub', 'pos-quality-manager', 10, 'filled', 'Adelaide HQ', 'CC-QUALITY', 'emp-staff-145'),
  ('pos-support-worker', 'Support Worker', 'role-support-worker', 'Operations', 'Operations', 'loc-northern-sil', 'pos-gm-ops', 40, 'filled', 'Northern SIL', 'CC-OPS', 'emp-oliver')
on conflict (id) do update set
  title = excluded.title,
  security_role_id = excluded.security_role_id,
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
  ('pa-isla-primary', 'pos-coordinator', 'emp-isla', 'primary', '2019-03-01', null, ''),
  ('pa-gabriela-primary', 'pos-intake', 'emp-gabriela', 'primary', '2020-06-15', null, ''),
  ('pa-oliver-primary', 'pos-support-worker', 'emp-oliver', 'primary', '2021-09-01', null, ''),
  ('pa-rose-primary', 'pos-plan-dev', 'emp-rose', 'primary', '2017-11-20', null, ''),
  ('pa-jessica-primary', 'pos-contracts', 'emp-jessica', 'primary', '2022-02-01', null, ''),
  ('pa-finance-off-147', 'pos-finance-officer', 'emp-staff-147', 'primary', '2023-11-20', null, ''),
  ('pa-board-1-primary', 'pos-board-1', 'emp-board-chair', 'primary', '2016-05-01', null, ''),
  ('pa-board-2-primary', 'pos-board-2', 'emp-board-2', 'primary', '2018-02-01', null, ''),
  ('pa-board-3-primary', 'pos-board-3', 'emp-board-3', 'primary', '2019-06-01', null, ''),
  ('pa-board-4-primary', 'pos-board-4', 'emp-board-4', 'primary', '2020-11-01', null, ''),
  ('pa-ceo-primary', 'pos-ceo', 'emp-ceo', 'primary', '2015-03-01', null, ''),
  ('pa-exec-ops-primary', 'pos-exec-ops', 'emp-michael', 'primary', '2018-01-10', null, ''),
  ('pa-gm-ops-primary', 'pos-gm-ops', 'emp-staff-133', 'primary', '2021-09-06', null, ''),
  ('pa-rostering-mgr-primary', 'pos-rostering-manager', 'emp-rostering-manager', 'primary', '2020-03-01', null, ''),
  ('pa-rostering-off-primary', 'pos-rostering-officer', 'emp-rostering-officer', 'primary', '2022-07-01', null, ''),
  ('pa-exec-hr-primary', 'pos-exec-hr', 'emp-exec-hr', 'primary', '2017-06-01', null, ''),
  ('pa-hr-mgr-primary', 'pos-hr-manager', 'emp-hr-manager', 'primary', '2019-04-01', null, ''),
  ('pa-hr-off-primary', 'pos-hr-officer', 'emp-staff-146', 'primary', '2022-10-19', null, ''),
  ('pa-exec-fin-primary', 'pos-exec-finance', 'emp-exec-finance', 'primary', '2016-01-15', null, ''),
  ('pa-fin-mgr-primary', 'pos-finance-manager', 'emp-finance-manager', 'primary', '2018-11-01', null, ''),
  ('pa-exec-ict-primary', 'pos-exec-ict', 'emp-exec-ict', 'primary', '2018-09-01', null, ''),
  ('pa-ict-mgr-primary', 'pos-ict-manager', 'emp-ict-manager', 'primary', '2020-01-10', null, ''),
  ('pa-ict-off-primary', 'pos-ict-officer', 'emp-ict-officer', 'primary', '2021-05-01', null, ''),
  ('pa-exec-quality-primary', 'pos-exec-quality', 'emp-exec-quality', 'primary', '2017-02-01', null, ''),
  ('pa-quality-mgr-primary', 'pos-quality-manager', 'emp-quality-manager', 'primary', '2019-08-01', null, ''),
  ('pa-quality-off-primary', 'pos-quality-officer', 'emp-staff-145', 'primary', '2021-09-18', null, '')
on conflict (id) do update set
  position_id = excluded.position_id,
  employee_id = excluded.employee_id,
  assignment_type = excluded.assignment_type,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  notes = excluded.notes,
  updated_at = now();

-- Bulk support workers: npx supabase db query --linked -f supabase/seed-org-structure-bulk.sql
