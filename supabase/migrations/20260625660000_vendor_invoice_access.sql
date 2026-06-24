-- WP-AG.5–7 — vendor invoice access

insert into public.app_role_window (role_id, window_key, access_level) values
  ('role-admin', 'vendor-invoices', 'write'),
  ('role-ceo', 'vendor-invoices', 'write'),
  ('role-exec-operations', 'vendor-invoices', 'write'),
  ('role-finance-manager', 'vendor-invoices', 'write'),
  ('role-finance-officer', 'vendor-invoices', 'write'),
  ('role-rostering-manager', 'vendor-invoices', 'read')
on conflict (role_id, window_key) do update set access_level = excluded.access_level;

insert into public.app_role_process (role_id, process_id) values
  ('role-admin', 'approve-vendor-invoice'),
  ('role-admin', 'mark-vendor-invoice-paid'),
  ('role-ceo', 'approve-vendor-invoice'),
  ('role-ceo', 'mark-vendor-invoice-paid'),
  ('role-finance-manager', 'approve-vendor-invoice'),
  ('role-finance-manager', 'mark-vendor-invoice-paid'),
  ('role-finance-officer', 'approve-vendor-invoice'),
  ('role-finance-officer', 'mark-vendor-invoice-paid')
on conflict (role_id, process_id) do nothing;
