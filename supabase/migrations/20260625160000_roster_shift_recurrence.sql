-- WP-D.2 — recurrence group for weekly shift patterns

alter table public.roster_shift
  add column if not exists recurrence_group_id text not null default '';

create index if not exists roster_shift_recurrence_group_idx on public.roster_shift (recurrence_group_id);

comment on column public.roster_shift.recurrence_group_id is 'Shared id for shifts created from one weekly recurrence pattern.';

alter table public.roster_shift enable row level security;

drop policy if exists roster_shift_select on public.roster_shift;
drop policy if exists roster_shift_write on public.roster_shift;
create policy roster_shift_select on public.roster_shift for select to anon, authenticated using (true);
create policy roster_shift_write on public.roster_shift for all to anon, authenticated using (true) with check (true);
