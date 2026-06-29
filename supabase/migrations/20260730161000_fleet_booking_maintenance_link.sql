-- Link fleet bookings to maintenance requests (vehicle for a site visit).

alter table public.fleet_booking
  add column if not exists maintenance_request_id text references public.maintenance_request (id) on delete set null;

create index if not exists fleet_booking_maintenance_request_id_idx
  on public.fleet_booking (maintenance_request_id);
