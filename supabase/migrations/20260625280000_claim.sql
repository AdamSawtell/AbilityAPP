-- NDIS claim batches generated from approved, verified timesheet lines.

create table if not exists public.claim (
  id text primary key,
  document_no text not null,
  client_id text,
  period_start date not null,
  period_end date not null,
  status text not null default 'Draft',
  plan_management_type text not null default 'Agency managed',
  total_amount numeric(12, 2) not null default 0,
  gateway_status text not null default 'Not submitted',
  gateway_ref text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create table if not exists public.claim_line (
  id text primary key,
  claim_id text not null references public.claim (id) on delete cascade,
  line_no integer not null,
  timesheet_id text,
  timesheet_line_id text,
  roster_shift_id text,
  client_id text,
  employee_id text,
  service_booking_id text,
  product_id text,
  ndis_support_item text not null default '',
  support_category text not null default '',
  service_date date,
  quantity numeric(10, 2) not null default 0,
  unit_price numeric(10, 2) not null default 0,
  line_amount numeric(12, 2) not null default 0,
  claim_type text not null default 'Standard',
  validation_status text not null default 'pass',
  validation_message text not null default ''
);

create index if not exists claim_client_id_idx on public.claim (client_id);
create index if not exists claim_period_idx on public.claim (period_start, period_end);
create index if not exists claim_line_claim_id_idx on public.claim_line (claim_id);
create unique index if not exists claim_line_timesheet_line_uidx
  on public.claim_line (timesheet_line_id)
  where timesheet_line_id is not null and timesheet_line_id <> '';

comment on table public.claim is 'NDIS claim batch for a participant and claim period — lines from verified timesheets.';
comment on table public.claim_line is 'Claim line linked to timesheet line and roster shift for PRODA submission.';
