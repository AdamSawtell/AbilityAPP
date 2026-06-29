-- AB-0007 follow-up: link animals to support locations and client addresses

alter table public.client_animal
  add column if not exists location_id text references public.support_location (id) on delete set null,
  add column if not exists client_location_id text references public.client_location (id) on delete set null;

create index if not exists client_animal_location_id_idx on public.client_animal (location_id);

update public.client_animal
set location_id = 'loc-glenelg-sil'
where id = 'animal-bern-guide' and location_id is null;
