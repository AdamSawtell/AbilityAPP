-- AI agents, capabilities, role assignments, and chat audit log

create table if not exists public.app_ai_agent (
  id text primary key,
  agent_key text not null unique,
  name text not null default '',
  description text not null default '',
  system_prompt text not null default '',
  model text not null default 'gpt-4o-mini',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_ai_agent_capability (
  agent_id text not null references public.app_ai_agent (id) on delete cascade,
  capability_type text not null,
  capability_key text not null,
  primary key (agent_id, capability_type, capability_key)
);

create table if not exists public.app_role_agent (
  role_id text not null references public.app_role (id) on delete cascade,
  agent_id text not null references public.app_ai_agent (id) on delete cascade,
  primary key (role_id, agent_id)
);

create table if not exists public.app_ai_chat_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role_id text not null,
  agent_id text not null,
  user_message text not null default '',
  assistant_message text not null default '',
  tool_calls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_ai_agent_capability_key_idx on public.app_ai_agent_capability (capability_key);
create index if not exists app_role_agent_role_id_idx on public.app_role_agent (role_id);
create index if not exists app_ai_chat_log_user_id_idx on public.app_ai_chat_log (user_id);
create index if not exists app_ai_chat_log_created_at_idx on public.app_ai_chat_log (created_at desc);

drop trigger if exists app_ai_agent_updated_at on public.app_ai_agent;
create trigger app_ai_agent_updated_at
  before update on public.app_ai_agent
  for each row execute function public.set_updated_at();

alter table public.app_ai_agent enable row level security;
alter table public.app_ai_agent_capability enable row level security;
alter table public.app_role_agent enable row level security;
alter table public.app_ai_chat_log enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['app_ai_agent', 'app_ai_agent_capability', 'app_role_agent', 'app_ai_chat_log']
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
