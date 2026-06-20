-- WP-D.8 — worker check-in/out timestamps on roster shifts

alter table public.roster_shift
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz,
  add column if not exists check_in_notes text not null default '';

comment on column public.roster_shift.checked_in_at is 'Worker check-in timestamp (self-service or mobile)';
comment on column public.roster_shift.checked_out_at is 'Worker check-out timestamp';
comment on column public.roster_shift.check_in_notes is 'Optional worker notes recorded at check-out';
