create table if not exists public.employee_leave_request (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  leave_type text not null default '',
  start_date date,
  end_date date,
  days_requested numeric(8,2) not null default 0,
  status text not null default 'Requested',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_leave_request_employee_id_idx on public.employee_leave_request (employee_id);
create index if not exists employee_leave_request_status_idx on public.employee_leave_request (status);
create index if not exists employee_leave_request_start_date_idx on public.employee_leave_request (start_date);

drop trigger if exists employee_leave_request_updated_at on public.employee_leave_request;
create trigger employee_leave_request_updated_at
  before update on public.employee_leave_request
  for each row execute function public.set_updated_at();

alter table public.employee_leave_request enable row level security;

drop policy if exists employee_leave_request_all on public.employee_leave_request;
create policy employee_leave_request_all on public.employee_leave_request for all to anon, authenticated using (true) with check (true);
