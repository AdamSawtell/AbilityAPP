-- Demo data for AB-0033 / AB-0032 / AB-0031.
-- Monday fortnightly pay period anchored at the current fortnight, employee
-- contracted hours + SCHADS levels, and live Glenelg shifts so contracted-hours
-- shortfall and shift profitability show realistic numbers.

-- 1. Pay period definition — Monday start, fortnightly, anchored 2026-06-22.
update public.pay_period_definition
set name = 'Fortnightly pay period (Mon start)',
    frequency = 'fortnightly',
    period_length_days = 14,
    start_day = 0,
    anchor_date = '2026-06-22',
    label_pattern = 'PP {start}–{end}',
    edit_grace_days = 3,
    is_active = true,
    updated_by = 'System'
where id = 'ppd-default';

-- 2. Generated pay period instances (ids match app generator: ppi-<def>-<index>).
insert into public.pay_period_instance (id, definition_id, period_number, period_index, start_date, end_date, status, closed_by, close_notes)
values
  ('ppi-ppd-default--4', 'ppd-default', 'PP-4', -4, '2026-04-27', '2026-05-10', 'closed', 'System', 'Period closed for payroll'),
  ('ppi-ppd-default--3', 'ppd-default', 'PP-3', -3, '2026-05-11', '2026-05-24', 'closed', 'System', 'Period closed for payroll'),
  ('ppi-ppd-default--2', 'ppd-default', 'PP-2', -2, '2026-05-25', '2026-06-07', 'closed', 'System', 'Period closed for payroll'),
  ('ppi-ppd-default--1', 'ppd-default', 'PP-1', -1, '2026-06-08', '2026-06-21', 'open', '', ''),
  ('ppi-ppd-default-0', 'ppd-default', 'PP-1', 0, '2026-06-22', '2026-07-05', 'open', '', ''),
  ('ppi-ppd-default-1', 'ppd-default', 'PP-2', 1, '2026-07-06', '2026-07-19', 'open', '', ''),
  ('ppi-ppd-default-2', 'ppd-default', 'PP-3', 2, '2026-07-20', '2026-08-02', 'open', '', ''),
  ('ppi-ppd-default-3', 'ppd-default', 'PP-4', 3, '2026-08-03', '2026-08-16', 'open', '', ''),
  ('ppi-ppd-default-4', 'ppd-default', 'PP-5', 4, '2026-08-17', '2026-08-30', 'open', '', '')
on conflict (id) do update set
  definition_id = excluded.definition_id,
  period_number = excluded.period_number,
  period_index = excluded.period_index,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  closed_by = excluded.closed_by,
  close_notes = excluded.close_notes;

-- Remove the stale Wednesday-anchored instances if a prior run created them.
delete from public.pay_period_instance
where definition_id = 'ppd-default'
  and id not in (
    'ppi-ppd-default--4','ppi-ppd-default--3','ppi-ppd-default--2','ppi-ppd-default--1',
    'ppi-ppd-default-0','ppi-ppd-default-1','ppi-ppd-default-2','ppi-ppd-default-3','ppi-ppd-default-4'
  );

-- 3. Employee contracted hours + SCHADS classification (per fortnight = pay period).
update public.employee set contracted_hours_per_period = 60, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.1', schads_pay_point = 'PP1', super_rate = 12 where id = 'emp-jason-brown';
update public.employee set contracted_hours_per_period = 76, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.2', schads_pay_point = 'PP2', super_rate = 12 where id = 'emp-sw-002';
update public.employee set contracted_hours_per_period = 76, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.1', schads_pay_point = 'PP1', super_rate = 12 where id = 'emp-sw-017';
update public.employee set contracted_hours_per_period = 76, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.2', schads_pay_point = 'PP3', super_rate = 12 where id = 'emp-sw-032';
update public.employee set contracted_hours_per_period = 76, contracted_hours_period = 'fortnight', schads_classification_level = 'level-3.1', schads_pay_point = 'PP1', super_rate = 12 where id = 'emp-staff-137';
update public.employee set contracted_hours_per_period = 40, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.1', schads_pay_point = 'PP1', super_rate = 12 where id = 'emp-sw-012';
update public.employee set contracted_hours_per_period = 48, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.1', schads_pay_point = 'PP2', super_rate = 12 where id = 'emp-sw-027';
update public.employee set contracted_hours_per_period = 0, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.1', schads_pay_point = 'PP1', super_rate = 12 where id = 'emp-sw-007';
update public.employee set contracted_hours_per_period = 0, contracted_hours_period = 'fortnight', schads_classification_level = 'level-2.1', schads_pay_point = 'PP1', super_rate = 12 where id = 'emp-sw-022';

-- 4. Live shifts across the current fortnight (2026-06-22 .. 2026-07-05) at Glenelg.
-- Weekday daytime = positive margin; weekend/casual = lower or negative margin.
insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes, created_by, updated_by
) values
  ('rs-pp-0622-am', 'PP-0622-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-06-22', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0622-pm', 'PP-0622-PM', 'bp-bern', 'emp-sw-002',      'loc-glenelg-sil', null, '2026-06-22', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0623-am', 'PP-0623-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-06-23', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0623-pm', 'PP-0623-PM', 'bp-bern', 'emp-sw-017',      'loc-glenelg-sil', null, '2026-06-23', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0624-am', 'PP-0624-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-06-24', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0624-pm', 'PP-0624-PM', 'bp-bern', 'emp-sw-002',      'loc-glenelg-sil', null, '2026-06-24', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0625-am', 'PP-0625-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-06-25', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0625-pm', 'PP-0625-PM', 'bp-bern', 'emp-sw-017',      'loc-glenelg-sil', null, '2026-06-25', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0626-am', 'PP-0626-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-06-26', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0626-pm', 'PP-0626-PM', 'bp-bern', 'emp-sw-002',      'loc-glenelg-sil', null, '2026-06-26', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0627-am', 'PP-0627-AM', 'bp-bern', 'emp-sw-007',      'loc-glenelg-sil', null, '2026-06-27', '07:00', '15:00', 'Standard', 'Published', 'Saturday morning (casual)', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0628-am', 'PP-0628-AM', 'bp-bern', 'emp-sw-022',      'loc-glenelg-sil', null, '2026-06-28', '07:00', '15:00', 'Standard', 'Published', 'Sunday morning (casual)', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0629-am', 'PP-0629-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-06-29', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0629-pm', 'PP-0629-PM', 'bp-bern', 'emp-sw-002',      'loc-glenelg-sil', null, '2026-06-29', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0630-am', 'PP-0630-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-06-30', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0630-pm', 'PP-0630-PM', 'bp-bern', 'emp-sw-032',      'loc-glenelg-sil', null, '2026-06-30', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0701-am', 'PP-0701-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-07-01', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0701-pm', 'PP-0701-PM', 'bp-bern', 'emp-sw-002',      'loc-glenelg-sil', null, '2026-07-01', '15:00', '22:00', 'Standard', 'Published', 'Evening support', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0702-am', 'PP-0702-AM', 'bp-bern', 'emp-jason-brown', 'loc-glenelg-sil', null, '2026-07-02', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0703-am', 'PP-0703-AM', 'bp-bern', 'emp-sw-017',      'loc-glenelg-sil', null, '2026-07-03', '07:00', '15:00', 'Standard', 'Published', 'Morning personal care', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0704-am', 'PP-0704-AM', 'bp-bern', 'emp-sw-007',      'loc-glenelg-sil', null, '2026-07-04', '07:00', '15:00', 'Standard', 'Published', 'Saturday morning (casual)', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0705-am', 'PP-0705-AM', 'bp-bern', 'emp-sw-022',      'loc-glenelg-sil', null, '2026-07-05', '07:00', '15:00', 'Standard', 'Published', 'Sunday morning (casual)', 'Isla Robinson', 'Isla Robinson'),
  ('rs-pp-0703-pm-open', 'PP-0703-PM', 'bp-bern', null,         'loc-glenelg-sil', null, '2026-07-03', '15:00', '22:00', 'Standard', 'Published', 'Vacant — needs cover (find and fill demo)', 'Isla Robinson', 'Isla Robinson')
on conflict (id) do update set
  client_id = excluded.client_id,
  employee_id = excluded.employee_id,
  location_id = excluded.location_id,
  shift_date = excluded.shift_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  status = excluded.status,
  notes = excluded.notes,
  updated_by = excluded.updated_by;
