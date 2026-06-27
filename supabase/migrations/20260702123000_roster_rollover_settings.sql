-- Roster rollover defaults — manual publish controls and future automation.

alter table public.app_organization
  add column if not exists roster_rollover_enabled boolean not null default true,
  add column if not exists roster_rollover_lookahead_weeks integer not null default 6,
  add column if not exists roster_rollover_default_status text not null default 'Draft',
  add column if not exists roster_rollover_skip_existing boolean not null default true;

comment on column public.app_organization.roster_rollover_enabled is
  'When true, RoC publish uses organisation defaults to maintain a forward live roster.';
comment on column public.app_organization.roster_rollover_lookahead_weeks is
  'Default number of future weeks to create from active RoC templates.';
comment on column public.app_organization.roster_rollover_default_status is
  'Default shift status created by RoC rollover: Draft or Published.';
comment on column public.app_organization.roster_rollover_skip_existing is
  'When true, rollover skips already-created live shifts to avoid duplicates.';

update public.app_organization
set
  roster_rollover_enabled = coalesce(roster_rollover_enabled, true),
  roster_rollover_lookahead_weeks = greatest(1, least(12, coalesce(roster_rollover_lookahead_weeks, 6))),
  roster_rollover_default_status = case
    when roster_rollover_default_status = 'Published' then 'Published'
    else 'Draft'
  end,
  roster_rollover_skip_existing = coalesce(roster_rollover_skip_existing, true);
