-- AB-0030 — My Workplace services advisory: manual high-demand flag + demo orientations

alter table public.support_location
  add column if not exists high_demand_advisory boolean not null default false;

comment on column public.support_location.high_demand_advisory is
  'When true, My Workplace shows a high-demand advisory for qualified staff assigned to this site.';

-- Demo: Glenelg SIL flagged for workplace advisory smoke tests
update public.support_location
set high_demand_advisory = true
where id = 'loc-glenelg-sil';

-- Site orientations so assigned employees qualify for "Services I can work at"
insert into public.site_orientation (
  id, worker_type, worker_id, location_id, oriented_at, expires_at, acknowledged_by, notes, created_by, updated_by
)
values
  (
    'so-isla-glenelg',
    'employee',
    'emp-isla',
    'loc-glenelg-sil',
    '2024-03-01',
    '2027-03-01',
    'Isla Robinson',
    'Initial SIL site orientation',
    'SuperUser',
    'SuperUser'
  ),
  (
    'so-gab-glenelg',
    'employee',
    'emp-gabriela',
    'loc-glenelg-sil',
    '2024-06-01',
    '2027-06-01',
    'Isla Robinson',
    'SIL routines and emergency procedures',
    'SuperUser',
    'SuperUser'
  )
on conflict (id) do update set
  worker_type = excluded.worker_type,
  worker_id = excluded.worker_id,
  location_id = excluded.location_id,
  oriented_at = excluded.oriented_at,
  expires_at = excluded.expires_at,
  acknowledged_by = excluded.acknowledged_by,
  notes = excluded.notes,
  updated_by = excluded.updated_by;
