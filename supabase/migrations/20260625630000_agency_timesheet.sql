-- WP-AG.4 — agency timesheet lines + vendor cost from completed agency shifts

alter table public.business_partner
  add column if not exists agency_hourly_rate numeric(10, 2) not null default 0;

comment on column public.business_partner.agency_hourly_rate is 'Default hourly buy rate for agency staffing vendor (AUD).';

update public.business_partner
set agency_hourly_rate = 72.50
where id = 'bp-staffplus' and (agency_hourly_rate is null or agency_hourly_rate = 0);

create table if not exists public.agency_timesheet (
  id text primary key,
  document_no text not null default '',
  vendor_bp_id text not null references public.business_partner (id) on delete restrict,
  period_start date not null,
  period_end date not null,
  status text not null default 'Draft',
  total_hours numeric(10, 2) not null default 0,
  total_vendor_cost numeric(12, 2) not null default 0,
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists agency_timesheet_vendor_idx on public.agency_timesheet (vendor_bp_id);
create index if not exists agency_timesheet_period_idx on public.agency_timesheet (period_start, period_end);

comment on table public.agency_timesheet is 'Vendor agency timesheet header — one per staffing vendor per period.';

create table if not exists public.agency_timesheet_line (
  id text primary key,
  agency_timesheet_id text not null references public.agency_timesheet (id) on delete cascade,
  line_no integer not null default 1,
  roster_shift_id text not null references public.roster_shift (id) on delete restrict,
  agency_shift_request_id text references public.agency_shift_request (id) on delete set null,
  agency_worker_id text references public.agency_worker (id) on delete set null,
  client_id text,
  location_id text,
  shift_date date,
  start_time time,
  end_time time,
  hours numeric(10, 2) not null default 0,
  vendor_hourly_rate numeric(10, 2) not null default 0,
  vendor_cost numeric(12, 2) not null default 0,
  notes text not null default ''
);

create index if not exists agency_timesheet_line_header_idx on public.agency_timesheet_line (agency_timesheet_id);
create unique index if not exists agency_timesheet_line_roster_shift_uidx
  on public.agency_timesheet_line (roster_shift_id);

comment on table public.agency_timesheet_line is 'Agency timesheet line from completed agency roster shift with vendor cost.';

-- Demo completed agency shift for timesheet generation (week 2025-10-06)
insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  coverage_source, agency_worker_id, vendor_bp_id, agency_request_id,
  created_by, updated_by
) values (
  'rs-bern-agency-done',
  'BERN-AGENCY-DONE',
  'bp-bern',
  null,
  'loc-glenelg-sil',
  'sb-50145',
  '2025-10-08',
  '09:00',
  '15:00',
  'Standard',
  'Completed',
  'Completed agency cover — Jane Agency via StaffPlus',
  'agency',
  'aw-sp-jane',
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
  skills_required, sent_at, confirmed_at, completed_at, continuity_notes,
  created_by, updated_by
) values (
  'asr-demo-jane-oct',
  'ASR-DEMO-01',
  'rs-bern-agency-done',
  'bp-staffplus',
  'aw-sp-jane',
  'Completed',
  'SIL, personal care',
  '2025-10-05T09:00:00+00',
  '2025-10-05T10:00:00+00',
  '2025-10-08T16:00:00+00',
  'Bernie prefers morning routine before community access.',
  'Riley Shaw',
  'Riley Shaw'
) on conflict (id) do update set
  status = excluded.status,
  agency_worker_id = excluded.agency_worker_id,
  completed_at = excluded.completed_at,
  updated_by = excluded.updated_by;

-- Link roster shift to its agency request after both rows exist (avoids circular FK on insert)
update public.roster_shift
set agency_request_id = 'asr-demo-jane-oct'
where id = 'rs-bern-agency-done';

