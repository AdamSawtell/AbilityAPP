-- Support location seed
-- Re-run after migration: npx supabase db query --linked -f supabase/seed-locations.sql

insert into public.support_location (
  id, search_key, name, description, location_type, status,
  address1, address2, city, state, postcode, country,
  phone, email, access_notes, picture_url, capacity, valid_from, created_by, updated_by
)
values
  (
    'loc-glenelg-sil', 'GLEN-SIL', 'Glenelg SIL House',
    'Shared independent living — 3 residents, 24/7 active overnight support.',
    'SIL house', 'Active', '22 Partridge Street', '', 'Glenelg', 'SA', '5045', 'Australia',
    '08 8294 2200', 'glenelg.sil@abilityapp.local',
    'Ramp at rear. Key safe code on file with on-call manager.',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=640&h=400&fit=crop',
    3, '2022-03-01', 'SuperUser', 'SuperUser'
  ),
  (
    'loc-adelaide-hub', 'ADL-HUB', 'Adelaide Day Hub',
    'Community participation and skills development — weekday program.',
    'Day program', 'Active', '100 King William Street', 'Level 2', 'Adelaide', 'SA', '5000', 'Australia',
    '08 8123 4500', 'dayhub@abilityapp.local',
    'Lift access from ground floor. Visitor sign-in at reception.',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=400&fit=crop',
    20, '2021-01-15', 'SuperUser', 'SuperUser'
  )
on conflict (id) do update set
  search_key = excluded.search_key, name = excluded.name, description = excluded.description,
  location_type = excluded.location_type, status = excluded.status,
  address1 = excluded.address1, address2 = excluded.address2, city = excluded.city,
  state = excluded.state, postcode = excluded.postcode, country = excluded.country,
  phone = excluded.phone, email = excluded.email, access_notes = excluded.access_notes,
  picture_url = excluded.picture_url, capacity = excluded.capacity, valid_from = excluded.valid_from,
  updated_by = excluded.updated_by;

delete from public.support_location_alert where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub');
insert into public.support_location_alert (id, location_id, line_no, alert_type, show_as_alert, name, description, valid_from)
values ('loc-alert-glen-fire', 'loc-glenelg-sil', 1, 'Safety', 'Yes', 'Fire drill quarterly', 'Residents require verbal prompting during evacuations.', '2024-01-01');

delete from public.support_location_client where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub');
insert into public.support_location_client (id, location_id, line_no, client_id, assignment_role, primary_assignment, valid_from, notes)
values ('loc-cli-bern', 'loc-glenelg-sil', 1, 'bp-bern', 'Resident', 'Yes', '2022-03-01', 'Primary SIL placement');

delete from public.support_location_employee where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub');
insert into public.support_location_employee (id, location_id, line_no, employee_id, assignment_role, primary_assignment, valid_from, notes)
values
  ('loc-emp-isla', 'loc-glenelg-sil', 1, 'emp-isla', 'Site manager', 'Yes', '2022-03-01', ''),
  ('loc-emp-gab', 'loc-glenelg-sil', 2, 'emp-gabriela', 'Support worker', 'No', '2023-06-01', 'Regular weekday shifts'),
  ('loc-emp-michael', 'loc-adelaide-hub', 1, 'emp-michael', 'Team leader', 'Yes', '2021-01-15', '');

delete from public.support_location_activity where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub');
insert into public.support_location_activity (id, location_id, line_no, activity_date, activity_type, subject, description, created_by)
values ('loc-act-glen-1', 'loc-glenelg-sil', 1, '2025-05-10', 'Site visit', 'Quarterly safety walkthrough', 'Checked exits, fire equipment, and access ramp condition.', 'Isla Robinson');

delete from public.support_location_product where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub');
insert into public.support_location_product (id, location_id, line_no, product_id, active, valid_from, notes)
values
  ('loc-prod-glen-sil', 'loc-glenelg-sil', 1, 'prod-sil-wd', 'Yes', '2022-03-01', 'Primary SIL weekday service'),
  ('loc-prod-glen-trans', 'loc-glenelg-sil', 2, 'prod-transport', 'Yes', '2022-03-01', 'Provider travel for community access'),
  ('loc-prod-hub-cp', 'loc-adelaide-hub', 1, 'prod-cp', 'Yes', '2021-01-15', 'Core day program offering');
