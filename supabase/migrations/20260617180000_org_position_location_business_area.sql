-- Org position: optional business area and support location link.

alter table public.org_position
  add column if not exists business_area text not null default '',
  add column if not exists location_id text references public.support_location (id) on delete set null;

create index if not exists org_position_location_idx on public.org_position (location_id)
  where location_id is not null;
