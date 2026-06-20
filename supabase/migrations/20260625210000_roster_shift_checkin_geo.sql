-- WP-D.10 — GPS coordinates on worker check-in/out

alter table public.roster_shift
  add column if not exists check_in_latitude double precision,
  add column if not exists check_in_longitude double precision,
  add column if not exists check_out_latitude double precision,
  add column if not exists check_out_longitude double precision;

comment on column public.roster_shift.check_in_latitude is 'Worker latitude at check-in (WGS84)';
comment on column public.roster_shift.check_in_longitude is 'Worker longitude at check-in (WGS84)';
comment on column public.roster_shift.check_out_latitude is 'Worker latitude at check-out (WGS84)';
comment on column public.roster_shift.check_out_longitude is 'Worker longitude at check-out (WGS84)';
