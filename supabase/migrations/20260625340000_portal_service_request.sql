-- WP-0.4: participant portal service requests + coordinator task link

create table if not exists public.portal_service_request (
  id text primary key,
  client_id text not null references public.client(id) on delete cascade,
  status text not null default 'Submitted',
  service_category text not null default '',
  support_budget text not null default '',
  description text not null default '',
  preferred_schedule text not null default '',
  task_id text,
  variation_agreement_id text,
  submitted_by_email text not null default '',
  decline_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null default 'Participant portal',
  updated_by text not null default 'Participant portal'
);

create index if not exists portal_service_request_client_idx
  on public.portal_service_request (client_id);

create index if not exists portal_service_request_task_idx
  on public.portal_service_request (task_id);
