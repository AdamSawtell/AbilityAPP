-- E2E Amplify smoke — Bern agency claims + plan-managed invoice path + publish shift
-- Run: npm run supabase:seed-e2e-amplify
-- Safe to re-run (fixed ids).

-- Bern stays agency-managed so June claim cl-jun26-bern remains valid (TEST-085)
update public.client
set
  plan_management_type = 'Agency managed',
  plan_manager_partner_id = null,
  invoice_delivery_method = '',
  updated_at = now(),
  updated_by = 'E2E smoke seed'
where id = 'bp-bern';

-- Plan-managed invoice smoke: ZOTH04 (bp-bulk-04) — eligible June lines, no invoice yet
update public.client
set
  plan_management_type = 'Plan managed',
  plan_manager_partner_id = 'bp-myplan-manager',
  invoice_delivery_method = 'Email',
  updated_at = now(),
  updated_by = 'E2E smoke seed'
where id = 'bp-bulk-04';

insert into public.service_booking (
  id, document_no, organization, description, target_document_type, is_template, ready_to_claim_rule,
  program_of_supports, date_ordered, date_promised, start_date, end_date, client_id, invoice_partner,
  service_agreement_id, booking_generator_ref, total_lines, grand_total, document_status, created_by, updated_by
)
values (
  'sb-jun26-bulk04', '60104', 'AbilityERP', 'June respite — ZOTH04', 'Service Booking - Standard',
  false, 'Manual Tick', false, '2026-06-01', '2026-06-30', '2026-06-01', '2026-06-30', 'bp-bulk-04',
  'NDIS - National Disability Insurance Scheme', 'sa-bulk-04', '', 591, 591, 'In progress',
  'E2E smoke', 'E2E smoke'
)
on conflict (id) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  document_status = excluded.document_status,
  updated_by = excluded.updated_by;

insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  checked_in_at, checked_out_at, created_by, updated_by
)
values (
  'rs-e2e-pm-invoice', 'E2E-PM-INVOICE', 'bp-bulk-04', 'emp-oliver', 'loc-adelaide-hub', 'sb-jun26-bulk04',
  '2026-06-17', '09:00', '15:00', 'Standard', 'Published', 'E2E plan-managed invoice smoke',
  '2026-06-17 09:02:00+09:30', '2026-06-17 15:01:00+09:30', 'E2E smoke', 'E2E smoke'
)
on conflict (id) do update set
  shift_date = excluded.shift_date,
  status = excluded.status,
  checked_in_at = excluded.checked_in_at,
  checked_out_at = excluded.checked_out_at,
  updated_by = excluded.updated_by;

insert into public.timesheet (
  id, document_no, employee_id, period_start, period_end, status, total_hours, notes,
  payroll_export_status, created_by, updated_by
)
values (
  'ts-e2e-pm-jun', 'TS-E2E-PM-JUN', 'emp-oliver', '2026-06-01', '2026-06-30', 'Approved', 6,
  'E2E plan-managed invoice generation — ZOTH04 June',
  'Not exported', 'E2E smoke', 'E2E smoke'
)
on conflict (id) do update set
  status = excluded.status,
  total_hours = excluded.total_hours,
  updated_by = excluded.updated_by;

insert into public.timesheet_line (
  id, timesheet_id, line_no, roster_shift_id, client_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, hours, notes
)
values (
  'tsl-e2e-pm-jun-1', 'ts-e2e-pm-jun', 1, 'rs-e2e-pm-invoice', 'bp-bulk-04', 'loc-adelaide-hub',
  'sb-jun26-bulk04', '2026-06-17', '09:00', '15:00', 'Standard', 6, ''
)
on conflict (id) do update set
  hours = excluded.hours,
  roster_shift_id = excluded.roster_shift_id;

-- Draft shift for publish-week smoke (Oliver — avoids Gabriela double-book on same day)
insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  created_by, updated_by
)
values (
  'rs-e2e-smoke-today', 'E2E-SMOKE-TODAY', 'bp-bern', 'emp-oliver', 'loc-glenelg-sil', 'sb-jun26-50150',
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

comment on table public.roster_shift is 'rs-e2e-smoke-today + rs-e2e-pm-invoice — Amplify E2E smoke';
