-- AB-0034 Admin Communications Hub — in-app admin messages with acknowledgment audit trail

create table if not exists public.admin_message (
  id text primary key,
  title text not null,
  body text not null default '',
  sender_user_id text references public.app_user (id) on delete set null,
  sender_name text not null default '',
  audience_type text not null check (audience_type in ('all', 'roles')),
  audience_role_ids text[] not null default '{}',
  requires_acknowledgment boolean not null default true,
  display_method text not null check (display_method in ('modal', 'banner')),
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  recurrence_config jsonb not null default '{"type":"none"}'::jsonb,
  status text not null check (status in ('scheduled', 'active', 'closed', 'expired')),
  closed_at timestamptz,
  closed_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null default '',
  updated_by text not null default ''
);

create table if not exists public.admin_message_acknowledgment (
  id uuid primary key default gen_random_uuid(),
  message_id text not null references public.admin_message (id) on delete cascade,
  user_id text not null references public.app_user (id) on delete cascade,
  recurrence_period text not null default '',
  seen_at timestamptz,
  acknowledged_at timestamptz,
  banner_dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, recurrence_period)
);

create index if not exists admin_message_status_publish_idx
  on public.admin_message (status, publish_at desc);

create index if not exists admin_message_ack_message_idx
  on public.admin_message_acknowledgment (message_id);

create index if not exists admin_message_ack_user_idx
  on public.admin_message_acknowledgment (user_id);

drop trigger if exists admin_message_updated_at on public.admin_message;
create trigger admin_message_updated_at
  before update on public.admin_message
  for each row execute function public.set_updated_at();

alter table public.admin_message enable row level security;
alter table public.admin_message_acknowledgment enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['admin_message', 'admin_message_acknowledgment']
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select to anon, authenticated using (true)',
      t, t
    );
    execute format(
      'create policy %I_write on public.%I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
