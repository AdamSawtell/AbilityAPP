-- Open shift request workflow — employees request cover; rostering approves or rejects.

alter table public.roster_shift
  add column if not exists critical_fill boolean not null default false,
  add column if not exists critical_fill_marked_at timestamptz,
  add column if not exists critical_fill_marked_by text not null default '',
  add column if not exists open_fill_status text not null default 'Open';

comment on column public.roster_shift.critical_fill is 'Urgent cover needed — prioritised in marketplace and fill board.';
comment on column public.roster_shift.open_fill_status is 'Vacancy workflow: Open, Requested, Filled, Cancelled (Critical Fill is the critical_fill flag).';

create table if not exists public.roster_shift_request (
  id text primary key,
  roster_shift_id text not null references public.roster_shift (id) on delete cascade,
  employee_id text not null references public.employee (id) on delete cascade,
  response_type text not null default 'request',
  status text not null default 'requested',
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text not null default '',
  rejection_reason text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists roster_shift_request_shift_idx on public.roster_shift_request (roster_shift_id);
create index if not exists roster_shift_request_employee_idx on public.roster_shift_request (employee_id);
create index if not exists roster_shift_request_status_idx on public.roster_shift_request (status);

create unique index if not exists roster_shift_request_active_uidx
  on public.roster_shift_request (roster_shift_id, employee_id, response_type)
  where status in ('requested', 'approved');

comment on table public.roster_shift_request is 'Employee interest in an open roster shift — request, available-if-critical, or decline.';
comment on column public.roster_shift_request.response_type is 'request | available_if_critical | decline';
comment on column public.roster_shift_request.status is 'requested | approved | rejected | withdrawn | cancelled | expired';

alter table public.roster_shift_request enable row level security;

drop policy if exists roster_shift_request_all on public.roster_shift_request;
create policy roster_shift_request_all on public.roster_shift_request for all to anon, authenticated using (true) with check (true);
