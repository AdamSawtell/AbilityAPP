-- Link org positions to Admin → Roles (security roles). Many positions may share one role type.
-- Role catalog and position values are applied via supabase/seed-access.sql and workforce seeds.

alter table public.org_position
  add column if not exists security_role_id text references public.app_role (id) on delete set null;

comment on column public.org_position.security_role_id is
  'Required for non-root positions: maps to Admin → Roles. Title is the site-specific label.';

create index if not exists org_position_security_role_idx on public.org_position (security_role_id)
  where security_role_id is not null;
