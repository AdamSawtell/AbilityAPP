-- Timesheets (WP-D.7) — worker pay period headers with lines from roster shifts

create table if not exists public.timesheet (
  id text primary key,
  document_no text not null default '',
  employee_id text references public.employee (id) on delete set null,
  period_start date not null,
  period_end date not null,
  status text not null default 'Draft',
  total_hours numeric(8, 2) not null default 0,
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create table if not exists public.timesheet_line (
  id text primary key,
  timesheet_id text not null references public.timesheet (id) on delete cascade,
  line_no integer not null default 1,
  roster_shift_id text references public.roster_shift (id) on delete set null,
  client_id text references public.client (id) on delete set null,
  location_id text references public.support_location (id) on delete set null,
  service_booking_id text references public.service_booking (id) on delete set null,
  shift_date date,
  start_time time,
  end_time time,
  shift_type text not null default 'Standard',
  hours numeric(8, 2) not null default 0,
  notes text not null default ''
);

create index if not exists timesheet_employee_id_idx on public.timesheet (employee_id);
create index if not exists timesheet_period_idx on public.timesheet (period_start, period_end);
create index if not exists timesheet_line_timesheet_id_idx on public.timesheet_line (timesheet_id);
create unique index if not exists timesheet_line_roster_shift_uidx
  on public.timesheet_line (roster_shift_id)
  where roster_shift_id is not null and roster_shift_id <> '';

comment on table public.timesheet is 'Worker timesheet for a pay period — lines generated from roster shifts.';
comment on table public.timesheet_line is 'Timesheet line linked to a roster shift for payroll export.';
