-- System-surface windows are not granted via workspace roles.
-- Access is gated by System operator sign-in instead.

delete from public.app_role_window
where window_key in (
  'admin-roles',
  'admin-task-management',
  'admin-task-automations',
  'reports-advance',
  'workforce-organisation',
  'workforce-org-edit',
  'workforce-org-chart-tier'
);
