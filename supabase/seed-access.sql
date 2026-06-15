-- Users, roles, and access seed
-- Re-run: npm run supabase:seed-access

insert into public.app_role (id, role_key, name, description, active)
values
  ('role-admin', 'AbilityERP_Admin', 'AbilityERP Admin', 'Full system access — all windows and processes', true),
  ('role-intake', 'Intake_Coordinator', 'Intake Coordinator', 'Enquiries and convert-to-client process', true),
  ('role-coordinator', 'Support_Coordinator', 'Support Coordinator', 'Client records and service catalog (no admin)', true)
on conflict (id) do update set
  role_key = excluded.role_key, name = excluded.name, description = excluded.description, active = excluded.active;

insert into public.app_user (id, username, email, first_name, last_name, phone, active, employee_bp_id, notes)
values
  ('user-superuser', 'SuperUser', 'superuser@abilityerp.local', 'Super', 'User', '', true, null, 'Full access administrator (AbilityERP SuperUser equivalent)'),
  ('user-isla', 'IslaRobinson', 'isla.robinson@abilityerp.local', 'Isla', 'Robinson', '', true, 'emp-isla', 'Intake and client coordination'),
  ('user-gabriela', 'GabrielaWilson', 'gabriela.wilson@abilityerp.local', 'Gabriela', 'Wilson', '', true, 'emp-gabriela', 'Enquiry processing')
on conflict (id) do update set
  username = excluded.username, email = excluded.email, first_name = excluded.first_name, last_name = excluded.last_name, phone = excluded.phone, active = excluded.active, employee_bp_id = excluded.employee_bp_id, notes = excluded.notes;

insert into public.app_user_role (user_id, role_id)
values
  ('user-superuser', 'role-admin'),
  ('user-isla', 'role-intake'),
  ('user-isla', 'role-coordinator'),
  ('user-gabriela', 'role-intake')
on conflict do nothing;

delete from public.app_role_window where role_id in ('role-admin', 'role-intake', 'role-coordinator');
insert into public.app_role_window (role_id, window_key)
values
  ('role-admin', 'home'),
  ('role-admin', 'enquiries'),
  ('role-admin', 'clients'),
  ('role-admin', 'employees'),
  ('role-admin', 'employee-overview'),
  ('role-admin', 'employee-contact'),
  ('role-admin', 'employee-employment'),
  ('role-admin', 'employee-credentials-assigned'),
  ('role-admin', 'employee-locations'),
  ('role-admin', 'employee-system-access'),
  ('role-admin', 'products'),
  ('role-admin', 'price-lists'),
  ('role-admin', 'service-agreements'),
  ('role-admin', 'contracts'),
  ('role-admin', 'admin-reference-data'),
  ('role-admin', 'admin-users'),
  ('role-admin', 'admin-roles'),
  ('role-intake', 'home'),
  ('role-intake', 'enquiries'),
  ('role-intake', 'clients'),
  ('role-coordinator', 'home'),
  ('role-coordinator', 'clients'),
  ('role-coordinator', 'products'),
  ('role-coordinator', 'price-lists'),
  ('role-coordinator', 'service-agreements')
on conflict do nothing;

delete from public.app_role_process where role_id in ('role-admin', 'role-intake', 'role-coordinator');
insert into public.app_role_process (role_id, process_id)
values
  ('role-admin', 'enquiry-to-client'),
  ('role-admin', 'assign-employee-credential'),
  ('role-intake', 'enquiry-to-client')
on conflict do nothing;