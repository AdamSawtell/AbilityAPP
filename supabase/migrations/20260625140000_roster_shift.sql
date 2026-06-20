-- Roster shifts (WP-D.1) — linked to client, employee, location, and service booking

create table if not exists public.roster_shift (
  id text primary key,
  shift_ref text not null default '',
  client_id text references public.client (id) on delete set null,
  employee_id text references public.employee (id) on delete set null,
  location_id text references public.support_location (id) on delete set null,
  service_booking_id text references public.service_booking (id) on delete set null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  shift_type text not null default 'Standard',
  status text not null default 'Published',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists roster_shift_date_idx on public.roster_shift (shift_date);
create index if not exists roster_shift_client_id_idx on public.roster_shift (client_id);
create index if not exists roster_shift_employee_id_idx on public.roster_shift (employee_id);

comment on table public.roster_shift is 'Individual roster shift — links worker, client, location, and optional service booking.';

insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes, created_by, updated_by
) values
  ('rs-bern-mon-am', 'BERN-MON-AM', 'bp-bern', 'emp-isla', 'loc-glenelg-sil', 'sb-50145', '2025-10-06', '09:00', '15:00', 'Standard', 'Published', 'SIL morning — linked to booking 50145', 'Isla Robinson', 'Isla Robinson'),
  ('rs-bern-wed-pm', 'BERN-WED-PM', 'bp-bern', 'emp-gabriela', 'loc-glenelg-sil', 'sb-50145', '2025-10-08', '14:00', '20:00', 'Standard', 'Published', 'Community access afternoon', 'Isla Robinson', 'Isla Robinson'),
  ('rs-bern-fri-am', 'BERN-FRI-AM', 'bp-bern', 'emp-isla', 'loc-glenelg-sil', 'sb-50145', '2025-10-10', '08:00', '12:00', 'Standard', 'Published', '', 'Isla Robinson', 'Isla Robinson')
on conflict (id) do nothing;
