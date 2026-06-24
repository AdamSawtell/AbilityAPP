-- WP-AG.5–7 — Agency vendor portal + vendor invoices

alter table public.agency_shift_request
  add column if not exists vendor_confirmed_at timestamptz;

comment on column public.agency_shift_request.vendor_confirmed_at is 'When the agency vendor confirmed coverage and proposed a worker in the agency portal.';

create table if not exists public.vendor_invoice (
  id text primary key,
  document_no text not null default '',
  vendor_bp_id text not null references public.business_partner (id) on delete restrict,
  agency_timesheet_id text not null references public.agency_timesheet (id) on delete restrict,
  invoice_no text not null default '',
  invoice_date date not null,
  amount numeric(12, 2) not null default 0,
  status text not null default 'Submitted',
  notes text not null default '',
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists vendor_invoice_vendor_idx on public.vendor_invoice (vendor_bp_id);
create unique index if not exists vendor_invoice_timesheet_uidx on public.vendor_invoice (agency_timesheet_id);

comment on table public.vendor_invoice is 'Agency vendor invoice submitted against an approved agency timesheet (AP-lite).';

-- Demo sent shift request for agency portal (rs-bern-tue-vac)
insert into public.agency_shift_request (
  id, document_no, roster_shift_id, vendor_bp_id, agency_worker_id, status,
  skills_required, sent_at, continuity_notes, created_by, updated_by
) values (
  'asr-bern-tue-vac',
  'ASR-DEMO-02',
  'rs-bern-tue-vac',
  'bp-staffplus',
  null,
  'Sent',
  'SIL, manual handling',
  '2025-10-06T08:00:00+00',
  '',
  'Riley Shaw',
  'Riley Shaw'
) on conflict (id) do update set
  status = excluded.status,
  sent_at = excluded.sent_at,
  updated_by = excluded.updated_by;

update public.agency_shift_request
set vendor_confirmed_at = '2025-10-05T09:30:00+00'
where id = 'asr-demo-jane-oct' and vendor_confirmed_at is null;

-- Demo approved agency timesheet for portal invoice submit
insert into public.agency_timesheet (
  id, document_no, vendor_bp_id, period_start, period_end, status,
  total_hours, total_vendor_cost, notes, created_by, updated_by
) values (
  'at-demo-staffplus-week',
  'ATS-DEMO-01',
  'bp-staffplus',
  '2025-10-06',
  '2025-10-12',
  'Approved',
  6.00,
  435.00,
  'Demo approved timesheet for agency portal invoice',
  'Riley Shaw',
  'Riley Shaw'
) on conflict (id) do update set
  status = excluded.status,
  total_hours = excluded.total_hours,
  total_vendor_cost = excluded.total_vendor_cost,
  updated_by = excluded.updated_by;

insert into public.agency_timesheet_line (
  id, agency_timesheet_id, line_no, roster_shift_id, agency_shift_request_id,
  agency_worker_id, client_id, location_id, shift_date, start_time, end_time,
  hours, vendor_hourly_rate, vendor_cost, notes
) values (
  'atl-demo-jane-oct',
  'at-demo-staffplus-week',
  1,
  'rs-bern-agency-done',
  'asr-demo-jane-oct',
  'aw-sp-jane',
  'bp-bern',
  'loc-glenelg-sil',
  '2025-10-08',
  '09:00',
  '15:00',
  6.00,
  72.50,
  435.00,
  ''
) on conflict (id) do update set
  hours = excluded.hours,
  vendor_cost = excluded.vendor_cost;
