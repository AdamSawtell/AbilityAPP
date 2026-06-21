-- Delivery test window — June 2026 date-relative demo data
-- Run: npm run supabase:seed-test-window
-- Safe to re-run (upserts on fixed ids). Removes prior agent smoke close row.

delete from public.financial_closed_month where close_month = '2020-01';

-- Replace any existing Bern June monthly plan (unique client_id + plan_month)
delete from public.monthly_service_plan_line
where monthly_service_plan_id in (
  select id from public.monthly_service_plan where client_id = 'bp-bern' and plan_month = '2026-06'
);
delete from public.monthly_service_plan where client_id = 'bp-bern' and plan_month = '2026-06';

-- Active June service booking (Bern)
insert into public.service_booking (
  id, document_no, organization, description, target_document_type, is_template, ready_to_claim_rule,
  program_of_supports, date_ordered, date_promised, start_date, end_date, client_id, invoice_partner,
  service_agreement_id, booking_generator_ref, total_lines, grand_total, document_status, created_by, updated_by
)
values (
  'sb-jun26-50150', '50150', 'AbilityERP', 'June SIL week — test window', 'Service Booking - Standard',
  false, 'Manual Tick', false, '2026-06-02', '2026-06-15', '2026-06-09', '2026-06-15', 'bp-bern',
  'NDIS - National Disability Insurance Scheme', 'sa-rose-ni', 'BERN_SIL', 2940, 2940, 'Completed',
  'Isla Robinson', 'Isla Robinson'
)
on conflict (id) do update set
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  document_status = excluded.document_status,
  updated_by = excluded.updated_by;

insert into public.service_booking_line (
  id, service_booking_id, line_no, manual_hold, ready_to_claim, ordered_quantity, quantity_invoiced,
  date_promised, product_id, claim_type, use_time_based_quantity, start_date, end_date, uom, price, line_amount
)
values (
  'sbl-jun26-50150-10', 'sb-jun26-50150', 10, false, true, 1, 0, '2026-06-15', 'prod-sil-wd', '', true,
  '2026-06-09', '2026-06-15', 'Week', 2940, 2940
)
on conflict (id) do update set start_date = excluded.start_date, end_date = excluded.end_date, line_amount = excluded.line_amount;

-- Short-notice participant cancellation (cancellation claims panel)
insert into public.service_booking (
  id, document_no, organization, description, target_document_type, is_template, ready_to_claim_rule,
  program_of_supports, date_ordered, date_promised, start_date, end_date, client_id, invoice_partner,
  service_agreement_id, booking_generator_ref, total_lines, grand_total, document_status,
  cancellation_notice_days, cancelled_at, cancellation_initiated_by, cancellation_reason, cancellation_notes,
  created_by, updated_by
)
values (
  'sb-jun26-cancel', '50151', 'AbilityERP', 'Saturday community outing — cancelled short notice',
  'Service Booking - Standard', false, 'Manual Tick', false, '2026-06-10', '2026-06-20', '2026-06-20', '2026-06-20',
  'bp-bern', 'NDIS - National Disability Insurance Scheme', 'sa-rose-ni', '', 591, 591, 'Cancelled',
  7, '2026-06-18', 'Participant', 'Participant illness', 'Cancelled 2 days before service — short notice test row.',
  'Isla Robinson', 'Isla Robinson'
)
on conflict (id) do update set
  document_status = excluded.document_status,
  cancelled_at = excluded.cancelled_at,
  cancellation_initiated_by = excluded.cancellation_initiated_by,
  cancellation_reason = excluded.cancellation_reason,
  updated_by = excluded.updated_by;

insert into public.service_booking_line (
  id, service_booking_id, line_no, manual_hold, ready_to_claim, ordered_quantity, quantity_invoiced,
  date_promised, product_id, claim_type, use_time_based_quantity, start_date, end_date, uom, price, line_amount
)
values (
  'sbl-jun26-cancel-10', 'sb-jun26-cancel', 10, false, false, 6, 0, '2026-06-20', 'prod-sil-wd', '', true,
  '2026-06-20', '2026-06-20', 'Hour', 98.5, 591
)
on conflict (id) do update set line_amount = excluded.line_amount;

-- Roster shifts — June 2026 with verified check-in/out (matches rostered hours)
insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  checked_in_at, checked_out_at, check_in_notes,
  created_by, updated_by
)
values
  (
    'rs-jun26-01', 'JUN26-MON-1', 'bp-bern', 'emp-isla', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-09', '09:00', '15:00', 'Standard', 'Completed', 'SIL morning — verified',
    '2026-06-09 09:05:00+09:30', '2026-06-09 15:00:00+09:30', 'Check-out verified',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-jun26-02', 'JUN26-WED-1', 'bp-bern', 'emp-isla', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-11', '09:00', '15:00', 'Standard', 'Completed', 'SIL morning — verified',
    '2026-06-11 09:02:00+09:30', '2026-06-11 15:00:00+09:30', 'Check-out verified',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-jun26-03', 'JUN26-SAT-1', 'bp-bern', 'emp-gabriela', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-14', '14:00', '20:00', 'Standard', 'Completed', 'Community access — verified',
    '2026-06-14 14:08:00+09:30', '2026-06-14 20:00:00+09:30', 'Check-out verified',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-jun26-04', 'JUN26-MON-2', 'bp-bern', 'emp-isla', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-16', '09:00', '15:00', 'Standard', 'Completed', 'SIL morning — verified',
    '2026-06-16 09:00:00+09:30', '2026-06-16 15:00:00+09:30', 'Check-out verified',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-jun26-05', 'JUN26-WED-2', 'bp-bern', 'emp-gabriela', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-18', '14:00', '20:00', 'Standard', 'Completed', 'Community access — verified',
    '2026-06-18 14:05:00+09:30', '2026-06-18 20:00:00+09:30', 'Check-out verified',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-jun26-06', 'JUN26-FRI-1', 'bp-bern', 'emp-gabriela', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-20', '10:00', '14:00', 'Standard', 'Completed', 'Community half-day — verified',
    '2026-06-20 10:03:00+09:30', '2026-06-20 14:00:00+09:30', 'Check-out verified',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-bern-jun-mon', 'BERN-JUN-MON', 'bp-bern', 'emp-isla', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-23', '09:00', '15:00', 'Standard', 'Published', 'Upcoming portal shift',
    null, null, '',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-bern-jun-wed', 'BERN-JUN-WED', 'bp-bern', 'emp-gabriela', 'loc-glenelg-sil', 'sb-jun26-50150',
    '2026-06-25', '14:00', '20:00', 'Standard', 'Published', 'Upcoming community shift',
    null, null, '',
    'Isla Robinson', 'Isla Robinson'
  )
on conflict (id) do update set
  shift_date = excluded.shift_date,
  status = excluded.status,
  checked_in_at = excluded.checked_in_at,
  checked_out_at = excluded.checked_out_at,
  updated_by = excluded.updated_by;

-- Timesheets — fortnight 9–22 Jun (Approved + payroll reconciled for financial close)
insert into public.timesheet (
  id, document_no, employee_id, period_start, period_end, status, total_hours, notes,
  payroll_export_status, payroll_exported_at, payroll_export_batch_ref,
  payroll_paid_hours, payroll_pay_run_ref, payroll_reconcile_status, payroll_reconciled_at,
  created_by, updated_by
)
values
  (
    'ts-jun26-isla', 'TS-JUN26-ISLA', 'emp-isla', '2026-06-09', '2026-06-22', 'Approved', 18,
    'June test window — Isla SIL shifts',
    'Exported', '2026-06-23 10:00:00+09:30', 'KEYPAY-EXP-JUN26-A',
    18, 'KEYPAY-RUN-JUN26-001', 'Matched', '2026-06-24 09:00:00+09:30',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'ts-jun26-gab', 'TS-JUN26-GAB', 'emp-gabriela', '2026-06-09', '2026-06-22', 'Approved', 16,
    'June test window — Gabriela community shifts',
    'Exported', '2026-06-23 10:05:00+09:30', 'KEYPAY-EXP-JUN26-A',
    16, 'KEYPAY-RUN-JUN26-001', 'Matched', '2026-06-24 09:05:00+09:30',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'ts-jun26-oliv-draft', 'TS-MAY26-OLIV', 'emp-oliver', '2026-05-12', '2026-05-25', 'Draft', 12,
    'May draft only — does not block June financial close',
    'Not exported', null, '', null, '', 'Pending', null,
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'ts-jun26-gab-submit', 'TS-JUN26-GAB2', 'emp-gabriela', '2026-06-23', '2026-07-06', 'Submitted', 6,
    'Next fortnight — submitted for supervisor approval test',
    'Not exported', null, '', null, '', 'Pending', null,
    'Gabriela Wilson', 'Gabriela Wilson'
  )
on conflict (id) do update set
  status = excluded.status,
  total_hours = excluded.total_hours,
  payroll_export_status = excluded.payroll_export_status,
  payroll_reconcile_status = excluded.payroll_reconcile_status,
  updated_by = excluded.updated_by;

insert into public.timesheet_line (
  id, timesheet_id, line_no, roster_shift_id, client_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, hours, notes
)
values
  ('tsl-jun26-isla-1', 'ts-jun26-isla', 1, 'rs-jun26-01', 'bp-bern', 'loc-glenelg-sil', 'sb-jun26-50150', '2026-06-09', '09:00', '15:00', 'Standard', 6, ''),
  ('tsl-jun26-isla-2', 'ts-jun26-isla', 2, 'rs-jun26-02', 'bp-bern', 'loc-glenelg-sil', 'sb-jun26-50150', '2026-06-11', '09:00', '15:00', 'Standard', 6, ''),
  ('tsl-jun26-isla-3', 'ts-jun26-isla', 3, 'rs-jun26-04', 'bp-bern', 'loc-glenelg-sil', 'sb-jun26-50150', '2026-06-16', '09:00', '15:00', 'Standard', 6, ''),
  ('tsl-jun26-gab-1', 'ts-jun26-gab', 1, 'rs-jun26-03', 'bp-bern', 'loc-glenelg-sil', 'sb-jun26-50150', '2026-06-14', '14:00', '20:00', 'Standard', 6, ''),
  ('tsl-jun26-gab-2', 'ts-jun26-gab', 2, 'rs-jun26-05', 'bp-bern', 'loc-glenelg-sil', 'sb-jun26-50150', '2026-06-18', '14:00', '20:00', 'Standard', 6, ''),
  ('tsl-jun26-gab-3', 'ts-jun26-gab', 3, 'rs-jun26-06', 'bp-bern', 'loc-glenelg-sil', 'sb-jun26-50150', '2026-06-20', '10:00', '14:00', 'Standard', 4, '')
on conflict (id) do update set hours = excluded.hours, roster_shift_id = excluded.roster_shift_id;

-- Monthly service plan — June 2026 (aligned to delivered hours for plan reconciliation)
insert into public.monthly_service_plan (
  id, client_id, plan_month, status, notes, created_by, updated_by
)
values (
  'msp-bern-2026-06', 'bp-bern', '2026-06', 'Approved',
  'June 2026 plan — aligned to June roster and timesheet test window.',
  'Isla Robinson', 'Isla Robinson'
)
on conflict (id) do update set status = excluded.status, notes = excluded.notes, updated_by = excluded.updated_by;

insert into public.monthly_service_plan_line (
  id, monthly_service_plan_id, line_no, support_budget, support_category, description,
  planned_hours, planned_amount, plan_budget_line_id, notes
)
values
  (
    'mspl-jun26-core', 'msp-bern-2026-06', 1, 'Core', 'Assistance with Daily Life',
    'Personal care and daily living supports', 18, 1773, 'budget-bern-core-daily', 'Matches Isla June shifts'
  ),
  (
    'mspl-jun26-community', 'msp-bern-2026-06', 2, 'Core', 'Social and Community Participation',
    'Community access and social activities', 16, 1576, 'budget-bern-core-community', 'Matches Gabriela June shifts'
  )
on conflict (id) do update set planned_hours = excluded.planned_hours, planned_amount = excluded.planned_amount;

-- NDIS claims — submitted + remittance matched; one rejected for plan recon column
insert into public.claim (
  id, document_no, client_id, period_start, period_end, status, plan_management_type, total_amount,
  gateway_status, gateway_ref, notes,
  remittance_status, remittance_paid_amount, remittance_payment_ref, remittance_imported_at,
  created_by, updated_by
)
values
  (
    'cl-jun26-bern', 'CL-JUN26-BERN', 'bp-bern', '2026-06-09', '2026-06-22', 'Accepted', 'Agency managed', 3349,
    'Paid', 'GW-JUN26-BERN-001', 'June test window claim — remittance matched',
    'Matched', 3349, 'NDIA-PAY-JUN26-001', '2026-06-25 11:00:00+09:30',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'cl-jun26-bern-rej', 'CL-JUN26-REJ', 'bp-bern', '2026-06-09', '2026-06-22', 'Rejected', 'Agency managed', 450,
    'Rejected', 'GW-JUN26-BERN-REJ', 'Rejected line for plan reconciliation Rejected $ column',
    'Not imported', 0, '', null,
    'Isla Robinson', 'Isla Robinson'
  )
on conflict (id) do update set
  status = excluded.status,
  remittance_status = excluded.remittance_status,
  total_amount = excluded.total_amount,
  updated_by = excluded.updated_by;

insert into public.claim_line (
  id, claim_id, line_no, timesheet_id, timesheet_line_id, roster_shift_id, client_id, employee_id,
  service_booking_id, product_id, ndis_support_item, support_category, service_date,
  quantity, unit_price, line_amount, claim_type, validation_status, validation_message
)
values
  (
    'cll-jun26-bern-1', 'cl-jun26-bern', 1, 'ts-jun26-isla', 'tsl-jun26-isla-1', 'rs-jun26-01',
    'bp-bern', 'emp-isla', 'sb-jun26-50150', 'prod-sil-wd', '01_011_0107_1_1', 'Assistance with Daily Life',
    '2026-06-09', 6, 98.5, 591, 'Standard', 'pass', ''
  ),
  (
    'cll-jun26-bern-2', 'cl-jun26-bern', 2, 'ts-jun26-isla', 'tsl-jun26-isla-2', 'rs-jun26-02',
    'bp-bern', 'emp-isla', 'sb-jun26-50150', 'prod-sil-wd', '01_011_0107_1_1', 'Assistance with Daily Life',
    '2026-06-11', 6, 98.5, 591, 'Standard', 'pass', ''
  ),
  (
    'cll-jun26-bern-3', 'cl-jun26-bern', 3, 'ts-jun26-isla', 'tsl-jun26-isla-3', 'rs-jun26-04',
    'bp-bern', 'emp-isla', 'sb-jun26-50150', 'prod-sil-wd', '01_011_0107_1_1', 'Assistance with Daily Life',
    '2026-06-16', 6, 98.5, 591, 'Standard', 'pass', ''
  ),
  (
    'cll-jun26-bern-4', 'cl-jun26-bern', 4, 'ts-jun26-gab', 'tsl-jun26-gab-1', 'rs-jun26-03',
    'bp-bern', 'emp-gabriela', 'sb-jun26-50150', 'prod-sil-wd', '04_104_0125_6_1', 'Social and Community Participation',
    '2026-06-14', 6, 98.5, 591, 'Standard', 'pass', ''
  ),
  (
    'cll-jun26-bern-5', 'cl-jun26-bern', 5, 'ts-jun26-gab', 'tsl-jun26-gab-2', 'rs-jun26-05',
    'bp-bern', 'emp-gabriela', 'sb-jun26-50150', 'prod-sil-wd', '04_104_0125_6_1', 'Social and Community Participation',
    '2026-06-18', 6, 98.5, 591, 'Standard', 'pass', ''
  ),
  (
    'cll-jun26-bern-6', 'cl-jun26-bern', 6, 'ts-jun26-gab', 'tsl-jun26-gab-3', 'rs-jun26-06',
    'bp-bern', 'emp-gabriela', 'sb-jun26-50150', 'prod-sil-wd', '04_104_0125_6_1', 'Social and Community Participation',
    '2026-06-20', 4, 98.5, 394, 'Standard', 'pass', ''
  ),
  (
    'cll-jun26-rej-1', 'cl-jun26-bern-rej', 1, null, null, null,
    'bp-bern', 'emp-isla', 'sb-jun26-cancel', 'prod-sil-wd', '04_104_0125_6_1', 'Social and Community Participation',
    '2026-06-20', 4, 98.5, 450, 'Cancellation', 'pass', ''
  )
on conflict (id) do update set line_amount = excluded.line_amount, support_category = excluded.support_category;

-- Participant invoices — plan-managed bulk clients (invoice reconciliation + billing rollup)
insert into public.invoice (
  id, document_no, client_id, period_start, period_end, status, plan_management_type, total_amount,
  invoice_to, invoice_to_email, due_date, sent_at, payment_status, paid_amount, payment_reference, notes,
  created_by, updated_by
)
values
  (
    'inv-jun26-bulk01', 'INV-JUN26-01', 'bp-bulk-01', '2026-06-01', '2026-06-30', 'Sent', 'Plan managed', 1200,
    'Plan Partners Pty Ltd', 'accounts@planpartners.test', '2026-06-10', '2026-06-05 09:00:00+09:30',
    'Unpaid', 0, '', 'Overdue unpaid — invoice reconciliation test',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'inv-jun26-bulk02', 'INV-JUN26-02', 'bp-bulk-02', '2026-06-01', '2026-06-30', 'Sent', 'Plan managed', 850,
    'Bright Plan Management', 'billing@brightplan.test', '2026-06-20', '2026-06-08 10:00:00+09:30',
    'Paid', 850, 'BP-PMT-88421', 'Paid in full — reconciliation test',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'inv-jun26-bulk03', 'INV-JUN26-03', 'bp-bulk-03', '2026-06-01', '2026-06-30', 'Sent', 'Plan managed', 640,
    'Care Plan Co', 'invoices@careplan.test', '2026-06-25', '2026-06-12 11:00:00+09:30',
    'Partial', 400, 'CPC-PART-001', 'Partial payment — follow-up test',
    'Isla Robinson', 'Isla Robinson'
  )
on conflict (id) do update set
  payment_status = excluded.payment_status,
  paid_amount = excluded.paid_amount,
  sent_at = excluded.sent_at,
  updated_by = excluded.updated_by;

insert into public.invoice_line (
  id, invoice_id, line_no, client_id, ndis_support_item, support_category, service_date,
  quantity, unit_price, line_amount, line_description, validation_status, validation_message
)
values
  ('invl-jun26-01-1', 'inv-jun26-bulk01', 1, 'bp-bulk-01', '01_011_0107_1_1', 'Assistance with Daily Life', '2026-06-15', 12, 100, 1200, 'June SIL supports', 'pass', ''),
  ('invl-jun26-02-1', 'inv-jun26-bulk02', 1, 'bp-bulk-02', '04_104_0125_6_1', 'Social and Community Participation', '2026-06-18', 8, 106.25, 850, 'Community access June', 'pass', ''),
  ('invl-jun26-03-1', 'inv-jun26-bulk03', 1, 'bp-bulk-03', '07_002_0106_8_3', 'Support Coordination', '2026-06-20', 4, 160, 640, 'Support coordination June', 'pass', '')
on conflict (id) do update set line_amount = excluded.line_amount;

-- Payroll period closed (Jun fortnight) — supports payroll close + financial close checklist
insert into public.payroll_closed_period (
  id, period_start, period_end, closed_at, closed_by, pay_run_ref, notes
)
values (
  'pcp-jun26-061522', '2026-06-09', '2026-06-22', '2026-06-24 14:00:00+09:30', 'James Whitford',
  'KEYPAY-RUN-JUN26-001', 'June fortnight 1 closed after reconciliation — test window seed'
)
on conflict (id) do update set closed_at = excluded.closed_at, pay_run_ref = excluded.pay_run_ref;

-- Plan provider on Bern budget lines (multi-provider budget test)
update public.client_plan_budget_line
set plan_provider = 'This organisation', updated_at = now()
where client_id = 'bp-bern' and id = 'budget-bern-core-daily';

update public.client_plan_budget_line
set plan_provider = 'Plan Partners Pty Ltd', updated_at = now()
where client_id = 'bp-bern' and id = 'budget-bern-core-community';

comment on table public.timesheet is 'Includes ts-jun26-* rows from seed-delivery-test-window.sql for June 2026 testing.';
