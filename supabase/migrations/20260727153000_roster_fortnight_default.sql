-- Default roster rollover to one fortnight (2 weeks) — standard NDIS roster cycle.

alter table public.app_organization
  alter column roster_rollover_lookahead_weeks set default 2;

update public.app_organization
set roster_rollover_lookahead_weeks = 2
where roster_rollover_lookahead_weeks = 6;
