-- AB-0004 Phase B — offline mobile check-in sync audit + void check-in for coordinators

create table if not exists public.mobile_offline_sync (
  id text primary key default gen_random_uuid()::text,
  sync_id uuid not null,
  organization_id text not null default 'org-abilityvua',
  shift_id text not null references public.roster_shift (id) on delete cascade,
  employee_id text not null references public.employee (id) on delete cascade,
  action_type text not null check (action_type in ('checkin', 'checkout')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'accepted' check (status in ('accepted', 'rejected', 'duplicate')),
  retry_count integer not null default 0,
  rejection_reason text not null default '',
  client_created_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (sync_id)
);

create index if not exists mobile_offline_sync_shift_idx
  on public.mobile_offline_sync (shift_id, employee_id, synced_at desc);

create index if not exists mobile_offline_sync_org_synced_idx
  on public.mobile_offline_sync (organization_id, synced_at desc);

comment on table public.mobile_offline_sync is 'Audit log for mobile offline check-in/out sync batches (idempotent by sync_id).';

alter table public.roster_shift
  add column if not exists check_in_voided_at timestamptz,
  add column if not exists check_in_voided_by text not null default '';

alter table public.roster_shift_worker_line
  add column if not exists check_in_voided_at timestamptz,
  add column if not exists check_in_voided_by text not null default '';

comment on column public.roster_shift.check_in_voided_at is 'When a coordinator voided the worker check-in so a new check-in is allowed.';
comment on column public.roster_shift_worker_line.check_in_voided_at is 'Coordinator void timestamp for this worker line check-in.';
