create table if not exists public.incident (
  id text primary key,
  document_no text not null default '',
  title text not null default '',
  status text not null default 'Draft',
  severity text not null default 'Low',
  category text not null default 'Operational',
  is_reportable boolean not null default false,
  reportable_type text not null default '',
  restrictive_practice_caused_harm boolean not null default false,
  occurred_at timestamptz,
  aware_at timestamptz,
  reported_at timestamptz,
  report_deadline_at timestamptz,
  ndis_notified_at timestamptz,
  ndis_notification_ref text not null default '',
  primary_client_id text references public.client (id) on delete set null,
  primary_employee_id text references public.employee (id) on delete set null,
  primary_location_id text references public.support_location (id) on delete set null,
  description text not null default '',
  immediate_actions text not null default '',
  investigation_summary text not null default '',
  corrective_actions text not null default '',
  lessons_learned text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incident_document_no_idx on public.incident (document_no);
create index if not exists incident_status_idx on public.incident (status);
create index if not exists incident_is_reportable_idx on public.incident (is_reportable);
create index if not exists incident_report_deadline_at_idx on public.incident (report_deadline_at);
create index if not exists incident_occurred_at_idx on public.incident (occurred_at desc);

create table if not exists public.incident_party (
  id text primary key,
  incident_id text not null references public.incident (id) on delete cascade,
  line_no int not null default 1,
  party_type text not null default 'Client',
  entity_id text not null default '',
  party_name text not null default '',
  role_in_incident text not null default '',
  notes text not null default ''
);

create index if not exists incident_party_incident_id_idx on public.incident_party (incident_id);

create table if not exists public.incident_action (
  id text primary key,
  incident_id text not null references public.incident (id) on delete cascade,
  line_no int not null default 1,
  action_date date,
  action_type text not null default '',
  description text not null default '',
  evidence_ref text not null default '',
  owner text not null default '',
  outcome text not null default ''
);

create index if not exists incident_action_incident_id_idx on public.incident_action (incident_id);

create table if not exists public.incident_notification (
  id text primary key,
  incident_id text not null references public.incident (id) on delete cascade,
  line_no int not null default 1,
  notified_at timestamptz,
  notify_target text not null default '',
  method text not null default '',
  notified_by text not null default '',
  reference text not null default '',
  notes text not null default ''
);

create index if not exists incident_notification_incident_id_idx on public.incident_notification (incident_id);

drop trigger if exists incident_updated_at on public.incident;
create trigger incident_updated_at
  before update on public.incident
  for each row execute function public.set_updated_at();

alter table public.incident enable row level security;
alter table public.incident_party enable row level security;
alter table public.incident_action enable row level security;
alter table public.incident_notification enable row level security;

drop policy if exists incident_all on public.incident;
create policy incident_all on public.incident for all to anon, authenticated using (true) with check (true);

drop policy if exists incident_party_all on public.incident_party;
create policy incident_party_all on public.incident_party for all to anon, authenticated using (true) with check (true);

drop policy if exists incident_action_all on public.incident_action;
create policy incident_action_all on public.incident_action for all to anon, authenticated using (true) with check (true);

drop policy if exists incident_notification_all on public.incident_notification;
create policy incident_notification_all on public.incident_notification for all to anon, authenticated using (true) with check (true);
