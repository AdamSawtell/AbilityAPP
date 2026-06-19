-- Short-lived AI prepare drafts (user completes save on the target page).

create table if not exists public.ai_draft (
  id text primary key,
  user_id text not null,
  role_id text not null,
  entity_type text not null,
  target_route text not null default '',
  payload jsonb not null default '{}'::jsonb,
  summary text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists ai_draft_user_id_idx on public.ai_draft (user_id);
create index if not exists ai_draft_expires_at_idx on public.ai_draft (expires_at);

alter table public.ai_draft enable row level security;

drop policy if exists ai_draft_all on public.ai_draft;
create policy ai_draft_all on public.ai_draft for all using (true) with check (true);
