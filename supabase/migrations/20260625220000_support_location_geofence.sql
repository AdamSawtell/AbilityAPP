-- Support location geofence coordinates for shift check-in/out alerts

alter table public.support_location
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geofence_radius_m integer not null default 150;

update public.support_location
set
  latitude = -34.9828,
  longitude = 138.5153,
  geofence_radius_m = 150
where id = 'loc-glenelg-sil';

update public.support_location
set
  latitude = -34.9287,
  longitude = 138.5992,
  geofence_radius_m = 150
where id = 'loc-adelaide-hub';
