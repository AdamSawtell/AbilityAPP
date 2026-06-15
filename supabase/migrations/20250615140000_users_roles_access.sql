-- Users, roles, and access control (windows + processes)
-- Mirrors AbilityERP: user → many roles → windows/functions + processes

create table if not exists public.app_user (
  id text primary key,
  username text not null unique,
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  active boolean not null default true,
  employee_bp_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_role (
  id text primary key,
  role_key text not null unique,
  name text not null default '',
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_user_role (
  user_id text not null references public.app_user (id) on delete cascade,
  role_id text not null references public.app_role (id) on delete cascade,
  primary key (user_id, role_id)
);

-- Window/function keys match web/src/lib/access/catalog.ts
create table if not exists public.app_role_window (
  role_id text not null references public.app_role (id) on delete cascade,
  window_key text not null,
  primary key (role_id, window_key)
);

-- Process ids match docs/processes/processes.json
create table if not exists public.app_role_process (
  role_id text not null references public.app_role (id) on delete cascade,
  process_id text not null,
  primary key (role_id, process_id)
);

create index if not exists app_user_role_role_id_idx on public.app_user_role (role_id);
create index if not exists app_role_window_key_idx on public.app_role_window (window_key);
create index if not exists app_role_process_id_idx on public.app_role_process (process_id);

drop trigger if exists app_user_updated_at on public.app_user;
create trigger app_user_updated_at
  before update on public.app_user
  for each row execute function public.set_updated_at();

drop trigger if exists app_role_updated_at on public.app_role;
create trigger app_role_updated_at
  before update on public.app_role
  for each row execute function public.set_updated_at();

alter table public.app_user enable row level security;
alter table public.app_role enable row level security;
alter table public.app_user_role enable row level security;
alter table public.app_role_window enable row level security;
alter table public.app_role_process enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['app_user', 'app_role', 'app_user_role', 'app_role_window', 'app_role_process']
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
