-- E2E Amplify smoke — ensures Bern plan-managed billing + draft shift for publish test
-- Run: npm run supabase:seed-e2e-amplify
-- Safe to re-run (fixed ids).

-- Bern: plan-managed path for invoice / TEST-085
update public.client
set
  plan_management_type = 'Plan managed',
  plan_manager_partner_id = 'bp-myplan-manager',
  invoice_delivery_method = 'Email',
  updated_at = now(),
  updated_by = 'E2E smoke seed'
where id = 'bp-bern';

-- Draft shift today for publish-week smoke (worker with current credentials)
insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  created_by, updated_by
)
values (
  'rs-e2e-smoke-today', 'E2E-SMOKE-TODAY', 'bp-bern', 'emp-gabriela', 'loc-glenelg-sil', 'sb-jun26-50150',
  current_date, '09:00', '12:00', 'Standard', 'Draft', 'E2E Amplify publish smoke — safe to delete',
  'E2E smoke', 'E2E smoke'
)
on conflict (id) do update set
  shift_date = excluded.shift_date,
  status = 'Draft',
  employee_id = excluded.employee_id,
  updated_by = excluded.updated_by;

-- E2E browser user (full admin) — password: flamingo (same bcrypt as SuperUser)
insert into public.app_user (
  id, username, email, first_name, last_name, phone, active, employee_bp_id, notes
)
values (
  'user-e2e-amplify', 'E2EAmplify', 'e2e.amplify@abilityapp.local', 'E2E', 'Amplify', '', true, null,
  'Automated Amplify smoke tests'
)
on conflict (id) do update set active = true, username = excluded.username;

insert into public.app_user_role (user_id, role_id)
values ('user-e2e-amplify', 'role-admin')
on conflict do nothing;

update public.app_user
set password = '$2b$10$bmfJikyZcbTbH9VGqCKtEe1eney/c1otTBVCF5o92gu0p7F.Yx9..'
where id = 'user-e2e-amplify';

comment on table public.roster_shift is 'rs-e2e-smoke-today — draft shift for Amplify publish-week smoke';
