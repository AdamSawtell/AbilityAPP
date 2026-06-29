-- AB-0005 Maintenance Request Tool — foundation tables

create table if not exists public.maintenance_request (
  id text primary key,
  document_no text not null default '',
  location_id text not null references public.support_location (id) on delete restrict,
  title text not null default '',
  description text not null default '',
  category text not null default 'general',
  priority text not null default 'medium',
  status text not null default 'reported',
  assigned_employee_id text references public.employee (id) on delete set null,
  contractor_name text not null default '',
  contractor_phone text not null default '',
  contractor_email text not null default '',
  estimated_cost numeric(12, 2),
  actual_cost numeric(12, 2),
  cost_status text not null default 'pending',
  cost_approved_by text not null default '',
  cost_approved_at timestamptz,
  invoice_number text not null default '',
  supplier_name text not null default '',
  xero_bill_reference text not null default '',
  gst_treatment text not null default '',
  reported_by text not null default '',
  reported_at timestamptz not null default now(),
  scheduled_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  requestor_confirmed_at timestamptz,
  incident_id text references public.incident (id) on delete set null,
  sla_breached boolean not null default false,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maintenance_request_location_id_idx on public.maintenance_request (location_id);
create index if not exists maintenance_request_status_idx on public.maintenance_request (status);
create index if not exists maintenance_request_priority_idx on public.maintenance_request (priority);
create index if not exists maintenance_request_scheduled_at_idx on public.maintenance_request (scheduled_at);
create index if not exists maintenance_request_reported_at_idx on public.maintenance_request (reported_at);
create index if not exists maintenance_request_incident_id_idx on public.maintenance_request (incident_id);

create table if not exists public.maintenance_request_photo (
  id text primary key,
  request_id text not null references public.maintenance_request (id) on delete cascade,
  line_no integer not null default 1,
  photo_type text not null default 'issue',
  file_url text not null default '',
  caption text not null default '',
  uploaded_at timestamptz not null default now(),
  uploaded_by text not null default ''
);

create index if not exists maintenance_request_photo_request_id_idx on public.maintenance_request_photo (request_id);

alter table public.maintenance_request enable row level security;
alter table public.maintenance_request_photo enable row level security;

create policy "maintenance_request authenticated all"
  on public.maintenance_request for all to authenticated using (true) with check (true);

create policy "maintenance_request_photo authenticated all"
  on public.maintenance_request_photo for all to authenticated using (true) with check (true);

drop trigger if exists maintenance_request_set_updated_at on public.maintenance_request;
create trigger maintenance_request_set_updated_at
  before update on public.maintenance_request
  for each row execute function public.set_updated_at();
