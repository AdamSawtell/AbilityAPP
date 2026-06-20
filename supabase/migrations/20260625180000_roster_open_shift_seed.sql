-- Seed one open marketplace shift (WP-D.6)

insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes, created_by, updated_by
) values
  ('rs-open-thu', 'OPEN-THU', 'bp-bern', null, 'loc-glenelg-sil', 'sb-50145', '2025-10-09', '10:00', '16:00', 'Standard', 'Draft', 'Open shift — posted to marketplace for cover', 'Isla Robinson', 'Isla Robinson')
on conflict (id) do nothing;
