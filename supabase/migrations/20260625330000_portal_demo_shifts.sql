-- Portal demo: upcoming roster shifts for Bern (participant portal WP-0.3)

insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  recurrence_group_id, checked_in_at, checked_out_at, check_in_notes,
  check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude,
  created_by, updated_by
)
values
  (
    'rs-bern-jun-mon', 'BERN-JUN-MON', 'bp-bern', 'emp-isla', 'loc-glenelg-sil', 'sb-50145',
    '2026-06-23', '09:00', '15:00', 'Standard', 'Published', 'SIL morning support',
    '', null, null, '', null, null, null, null,
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'rs-bern-jun-wed', 'BERN-JUN-WED', 'bp-bern', 'emp-gabriela', 'loc-glenelg-sil', 'sb-50145',
    '2026-06-25', '14:00', '20:00', 'Standard', 'Published', 'Community access',
    '', null, null, '', null, null, null, null,
    'Isla Robinson', 'Isla Robinson'
  )
on conflict (id) do update set
  shift_date = excluded.shift_date,
  status = excluded.status,
  updated_by = excluded.updated_by;
