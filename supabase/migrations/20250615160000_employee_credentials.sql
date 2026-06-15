-- Employee credentials assigned (AbilityERP BP Employee > Credentials Assigned tab)

create table if not exists public.employee_credential (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  credential_type text not null default '',
  credential_number text not null default '',
  issuing_body text not null default '',
  issue_date date,
  expiry_date date,
  status text not null default 'Current',
  document_ref text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_credential_employee_id_idx on public.employee_credential (employee_id);
create index if not exists employee_credential_expiry_idx on public.employee_credential (expiry_date);
create index if not exists employee_credential_status_idx on public.employee_credential (status);

drop trigger if exists employee_credential_updated_at on public.employee_credential;
create trigger employee_credential_updated_at
  before update on public.employee_credential
  for each row execute function public.set_updated_at();

alter table public.employee_credential enable row level security;

drop policy if exists employee_credential_select on public.employee_credential;
drop policy if exists employee_credential_write on public.employee_credential;
create policy employee_credential_select on public.employee_credential for select to anon, authenticated using (true);
create policy employee_credential_write on public.employee_credential for all to anon, authenticated using (true) with check (true);
