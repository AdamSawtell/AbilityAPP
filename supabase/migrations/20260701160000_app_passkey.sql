-- Mobile My Workplace passkeys (WebAuthn / Face ID / Touch ID)

alter table public.app_user
  add column if not exists webauthn_user_id uuid;

create table if not exists public.app_passkey (
  credential_id text primary key,
  user_id text not null references public.app_user (id) on delete cascade,
  public_key bytea not null,
  counter bigint not null default 0,
  device_type text not null default 'singleDevice',
  backed_up boolean not null default false,
  transports text[] not null default array[]::text[],
  label text not null default '',
  last_role_id text not null default '',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists app_passkey_user_id_idx on public.app_passkey (user_id);

alter table public.app_passkey enable row level security;

drop policy if exists app_passkey_select on public.app_passkey;
drop policy if exists app_passkey_write on public.app_passkey;
create policy app_passkey_select on public.app_passkey for select to anon, authenticated using (true);
create policy app_passkey_write on public.app_passkey for all to anon, authenticated using (true) with check (true);
