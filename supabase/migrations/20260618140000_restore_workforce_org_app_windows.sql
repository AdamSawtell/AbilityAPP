-- Organisation structure is a workspace Workforce planning window again.

insert into public.app_role_window (role_id, window_key)
values
  ('role-admin', 'workforce-organisation'),
  ('role-admin', 'workforce-org-edit'),
  ('role-admin', 'workforce-org-chart-tier'),
  ('role-board', 'workforce-organisation'),
  ('role-ceo', 'workforce-organisation'),
  ('role-ceo', 'workforce-org-edit'),
  ('role-exec-operations', 'workforce-organisation'),
  ('role-exec-operations', 'workforce-org-edit'),
  ('role-exec-hr', 'workforce-organisation'),
  ('role-exec-hr', 'workforce-org-edit'),
  ('role-exec-finance', 'workforce-organisation'),
  ('role-exec-finance', 'workforce-org-edit'),
  ('role-exec-ict', 'workforce-organisation'),
  ('role-exec-ict', 'workforce-org-edit'),
  ('role-exec-quality', 'workforce-organisation'),
  ('role-exec-quality', 'workforce-org-edit'),
  ('role-hr-manager', 'workforce-organisation'),
  ('role-ict-manager', 'workforce-organisation'),
  ('role-finance-manager', 'workforce-organisation'),
  ('role-quality-manager', 'workforce-organisation'),
  ('role-rostering-manager', 'workforce-organisation'),
  ('role-coordinator', 'workforce-organisation'),
  ('role-team-leader', 'workforce-organisation'),
  ('role-team-leader', 'workforce-org-edit')
on conflict do nothing;
