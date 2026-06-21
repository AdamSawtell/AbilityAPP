-- Document platform — System windows and process access

insert into public.app_role_window (role_id, window_key, access_level)
select r.role_id, w.window_key, 'write'
from (values ('role-admin')) as r(role_id)
cross join (values
  ('admin-document-templates'),
  ('admin-document-registry')
) as w(window_key)
on conflict (role_id, window_key) do update set access_level = excluded.access_level;

insert into public.app_role_process (role_id, process_id)
select r.role_id, p.process_id
from (values ('role-admin'), ('role-coordinator'), ('role-finance-officer'), ('role-finance-manager')) as r(role_id)
cross join (values
  ('print-invoice'),
  ('batch-print-invoices')
) as p(process_id)
on conflict (role_id, process_id) do nothing;
