-- WP-AG.5–7 — second approved StaffPlus timesheet for invoice upload smoke testing

insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  coverage_source, agency_worker_id, vendor_bp_id, agency_request_id,
  created_by, updated_by
) values (
  'rs-bern-agency-upload-smoke',
  'BERN-AGENCY-UPLOAD',
  'bp-bern',
  null,
  'loc-glenelg-sil',
  'sb-50145',
  '2025-10-15',
  '10:00',
  '14:00',
  'Standard',
  'Completed',
  'Completed agency cover — Mike Relief via StaffPlus',
  'agency',
  'aw-sp-mike',
  'bp-staffplus',
  null,
  'Isla Robinson',
  'Isla Robinson'
) on conflict (id) do update set
  status = excluded.status,
  coverage_source = excluded.coverage_source,
  agency_worker_id = excluded.agency_worker_id,
  vendor_bp_id = excluded.vendor_bp_id,
  notes = excluded.notes,
  updated_by = excluded.updated_by;

insert into public.agency_shift_request (
  id, document_no, roster_shift_id, vendor_bp_id, agency_worker_id, status,
  skills_required, sent_at, vendor_confirmed_at, confirmed_at, completed_at, continuity_notes,
  created_by, updated_by
) values (
  'asr-demo-upload-smoke',
  'ASR-DEMO-03',
  'rs-bern-agency-upload-smoke',
  'bp-staffplus',
  'aw-sp-mike',
  'Completed',
  'SIL, medication prompting',
  '2025-10-13T09:00:00+00',
  '2025-10-13T09:30:00+00',
  '2025-10-13T10:00:00+00',
  '2025-10-15T15:00:00+00',
  'Mike confirmed availability for short community access shift.',
  'Riley Shaw',
  'Riley Shaw'
) on conflict (id) do update set
  status = excluded.status,
  agency_worker_id = excluded.agency_worker_id,
  vendor_confirmed_at = excluded.vendor_confirmed_at,
  confirmed_at = excluded.confirmed_at,
  completed_at = excluded.completed_at,
  updated_by = excluded.updated_by;

update public.roster_shift
set agency_request_id = 'asr-demo-upload-smoke'
where id = 'rs-bern-agency-upload-smoke';

insert into public.agency_timesheet (
  id, document_no, vendor_bp_id, period_start, period_end, status,
  total_hours, total_vendor_cost, notes, created_by, updated_by
) values (
  'at-demo-staffplus-upload',
  'ATS-DEMO-02',
  'bp-staffplus',
  '2025-10-13',
  '2025-10-19',
  'Approved',
  4.00,
  290.00,
  'Demo approved timesheet for mandatory invoice document upload smoke test',
  'Riley Shaw',
  'Riley Shaw'
) on conflict (id) do update set
  status = excluded.status,
  total_hours = excluded.total_hours,
  total_vendor_cost = excluded.total_vendor_cost,
  notes = excluded.notes,
  updated_by = excluded.updated_by;

insert into public.agency_timesheet_line (
  id, agency_timesheet_id, line_no, roster_shift_id, agency_shift_request_id,
  agency_worker_id, client_id, location_id, shift_date, start_time, end_time,
  hours, vendor_hourly_rate, vendor_cost, notes
) values (
  'atl-demo-upload-smoke',
  'at-demo-staffplus-upload',
  1,
  'rs-bern-agency-upload-smoke',
  'asr-demo-upload-smoke',
  'aw-sp-mike',
  'bp-bern',
  'loc-glenelg-sil',
  '2025-10-15',
  '10:00',
  '14:00',
  4.00,
  72.50,
  290.00,
  ''
) on conflict (id) do update set
  hours = excluded.hours,
  vendor_cost = excluded.vendor_cost;
