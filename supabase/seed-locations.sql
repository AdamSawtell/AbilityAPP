-- Support location seed (generated)
-- Re-run: npm run supabase:seed-locations

insert into public.support_location (
  id, search_key, name, description, location_type, status,
  address1, address2, city, state, postcode, country,
  phone, email, access_notes, picture_url, capacity, valid_from, created_by, updated_by
)
values
  ('loc-glenelg-sil', 'GLEN-SIL', 'Glenelg SIL House', 'Shared independent living — 3 residents, 24/7 active overnight support.', 'SIL house', 'Active', '22 Partridge Street', '', 'Glenelg', 'SA', '5045', 'Australia', '08 8294 2200', 'glenelg.sil@abilityapp.local', 'Ramp at rear. Key safe code on file with on-call manager.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=640&h=400&fit=crop', 3, '2022-03-01', 'SuperUser', 'SuperUser'),
  ('loc-adelaide-hub', 'ADL-HUB', 'Adelaide Day Hub', 'Community participation and skills development — weekday program.', 'Day program', 'Active', '100 King William Street', 'Level 2', 'Adelaide', 'SA', '5000', 'Australia', '08 8123 4500', 'dayhub@abilityapp.local', 'Lift access from ground floor. Visitor sign-in at reception.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=400&fit=crop', 20, '2021-01-15', 'SuperUser', 'SuperUser'),
  ('loc-northern-sil', 'NTH-SIL', 'Northern SIL House', 'Four-bedroom shared living in Salisbury — active overnight and weekend support.', 'SIL house', 'Active', '45 Commercial Road', '', 'Salisbury', 'SA', '5108', 'Australia', '08 8285 3300', 'northern.sil@abilityapp.local', 'Sensor lighting at entry. Staff parking at rear.', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=640&h=400&fit=crop', 4, '2023-04-01', 'SuperUser', 'SuperUser'),
  ('loc-southern-respite', 'STH-RSP', 'Southern Respite Cottage', 'Short-term respite and STA — two guest rooms, flexible roster.', 'Respite', 'Active', '8 Jetty Road', '', 'Brighton', 'SA', '5048', 'Australia', '08 8298 7700', 'southern.respite@abilityapp.local', 'Ground-floor only. Medication lockbox in kitchen.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&h=400&fit=crop', 2, '2024-01-15', 'SuperUser', 'SuperUser'),
  ('loc-murray-bridge-day', 'MB-DAY', 'Murray Bridge Day Program', 'Regional day hub — life skills, community access, and transport.', 'Day program', 'Active', '120 Bridge Street', '', 'Murray Bridge', 'SA', '5253', 'Australia', '08 8531 4400', 'murraybridge.day@abilityapp.local', 'Bus bay at front. Evacuation assembly point is north carpark.', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=640&h=400&fit=crop', 15, '2022-09-01', 'SuperUser', 'SuperUser')
on conflict (id) do update set
  search_key = excluded.search_key, name = excluded.name, description = excluded.description,
  location_type = excluded.location_type, status = excluded.status,
  address1 = excluded.address1, address2 = excluded.address2, city = excluded.city,
  state = excluded.state, postcode = excluded.postcode, country = excluded.country,
  phone = excluded.phone, email = excluded.email, access_notes = excluded.access_notes,
  picture_url = excluded.picture_url, capacity = excluded.capacity, valid_from = excluded.valid_from,
  updated_by = excluded.updated_by;

delete from public.support_location_alert where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub', 'loc-northern-sil', 'loc-southern-respite', 'loc-murray-bridge-day');
insert into public.support_location_alert (id, location_id, line_no, alert_type, show_as_alert, name, description, valid_from)
values
  ('loc-alert-glen-fire', 'loc-glenelg-sil', 1, 'Safety', 'Yes', 'Fire drill quarterly', 'Residents require verbal prompting during evacuations.', '2024-01-01'),
  ('loc-alert-loc-northern-sil', 'loc-northern-sil', 1, 'Operational', 'Yes', 'Roster coverage check', 'Verify minimum staffing before public holiday weekends.', '2025-01-01'),
  ('loc-alert-loc-southern-respite', 'loc-southern-respite', 1, 'Operational', 'Yes', 'Roster coverage check', 'Verify minimum staffing before public holiday weekends.', '2025-01-01'),
  ('loc-alert-loc-murray-bridge-day', 'loc-murray-bridge-day', 1, 'Operational', 'Yes', 'Roster coverage check', 'Verify minimum staffing before public holiday weekends.', '2025-01-01');

delete from public.support_location_client where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub', 'loc-northern-sil', 'loc-southern-respite', 'loc-murray-bridge-day');
insert into public.support_location_client (id, location_id, line_no, client_id, assignment_role, primary_assignment, valid_from, notes)
values
  ('loc-cli-bern', 'loc-glenelg-sil', 1, 'bp-bern', 'Resident', 'Yes', '2022-03-01', 'Primary SIL placement');

delete from public.support_location_employee where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub', 'loc-northern-sil', 'loc-southern-respite', 'loc-murray-bridge-day');
insert into public.support_location_employee (id, location_id, line_no, employee_id, assignment_role, primary_assignment, valid_from, notes)
values
  ('loc-emp-isla', 'loc-glenelg-sil', 1, 'emp-isla', 'Site manager', 'Yes', '2022-03-01', ''),
  ('loc-emp-gab', 'loc-glenelg-sil', 2, 'emp-gabriela', 'Support worker', 'No', '2023-06-01', 'Regular weekday shifts'),
  ('loc-emp-michael', 'loc-adelaide-hub', 1, 'emp-michael', 'Team leader', 'Yes', '2021-01-15', ''),
  ('loc-emp-loc-northern-sil-mgr', 'loc-northern-sil', 1, 'emp-michael', 'Operations manager', 'Yes', '2023-04-01', ''),
  ('loc-emp-loc-northern-sil-sw-1', 'loc-northern-sil', 2, 'emp-sw-001', 'Support worker', 'Yes', '2023-04-01', 'Regular weekday shifts'),
  ('loc-emp-loc-northern-sil-sw-2', 'loc-northern-sil', 3, 'emp-sw-002', 'Support worker', 'No', '2023-04-01', 'Weekend roster'),
  ('loc-emp-loc-northern-sil-sw-3', 'loc-northern-sil', 4, 'emp-sw-003', 'Support worker', 'No', '2023-04-01', 'Relief pool'),
  ('loc-emp-loc-northern-sil-sw-4', 'loc-northern-sil', 5, 'emp-sw-004', 'Support worker', 'No', '2023-04-01', 'Regular weekday shifts'),
  ('loc-emp-loc-northern-sil-sw-5', 'loc-northern-sil', 6, 'emp-sw-005', 'Support worker', 'No', '2023-04-01', 'Weekend roster'),
  ('loc-emp-loc-northern-sil-sw-6', 'loc-northern-sil', 7, 'emp-sw-006', 'Support worker', 'No', '2023-04-01', 'Relief pool'),
  ('loc-emp-loc-northern-sil-sw-7', 'loc-northern-sil', 8, 'emp-sw-007', 'Support worker', 'No', '2023-04-01', 'Regular weekday shifts'),
  ('loc-emp-loc-northern-sil-sw-8', 'loc-northern-sil', 9, 'emp-sw-008', 'Support worker', 'No', '2023-04-01', 'Weekend roster'),
  ('loc-emp-loc-northern-sil-sw-9', 'loc-northern-sil', 10, 'emp-sw-009', 'Support worker', 'No', '2023-04-01', 'Relief pool'),
  ('loc-emp-loc-northern-sil-sw-10', 'loc-northern-sil', 11, 'emp-sw-010', 'Support worker', 'No', '2023-04-01', 'Regular weekday shifts'),
  ('loc-emp-loc-northern-sil-sw-11', 'loc-northern-sil', 12, 'emp-sw-011', 'Support worker', 'No', '2023-04-01', 'Weekend roster'),
  ('loc-emp-loc-southern-respite-mgr', 'loc-southern-respite', 1, 'emp-isla', 'Site coordinator', 'Yes', '2024-01-15', ''),
  ('loc-emp-loc-southern-respite-sw-12', 'loc-southern-respite', 2, 'emp-sw-012', 'Support worker', 'Yes', '2024-01-15', 'Regular weekday shifts'),
  ('loc-emp-loc-southern-respite-sw-13', 'loc-southern-respite', 3, 'emp-sw-013', 'Support worker', 'No', '2024-01-15', 'Weekend roster'),
  ('loc-emp-loc-southern-respite-sw-14', 'loc-southern-respite', 4, 'emp-sw-014', 'Support worker', 'No', '2024-01-15', 'Relief pool'),
  ('loc-emp-loc-southern-respite-sw-15', 'loc-southern-respite', 5, 'emp-sw-015', 'Support worker', 'No', '2024-01-15', 'Regular weekday shifts'),
  ('loc-emp-loc-southern-respite-sw-16', 'loc-southern-respite', 6, 'emp-sw-016', 'Support worker', 'No', '2024-01-15', 'Weekend roster'),
  ('loc-emp-loc-southern-respite-sw-17', 'loc-southern-respite', 7, 'emp-sw-017', 'Support worker', 'No', '2024-01-15', 'Relief pool'),
  ('loc-emp-loc-southern-respite-sw-18', 'loc-southern-respite', 8, 'emp-sw-018', 'Support worker', 'No', '2024-01-15', 'Regular weekday shifts'),
  ('loc-emp-loc-southern-respite-sw-19', 'loc-southern-respite', 9, 'emp-sw-019', 'Support worker', 'No', '2024-01-15', 'Weekend roster'),
  ('loc-emp-loc-southern-respite-sw-20', 'loc-southern-respite', 10, 'emp-sw-020', 'Support worker', 'No', '2024-01-15', 'Relief pool'),
  ('loc-emp-loc-southern-respite-sw-21', 'loc-southern-respite', 11, 'emp-sw-021', 'Support worker', 'No', '2024-01-15', 'Regular weekday shifts'),
  ('loc-emp-loc-southern-respite-sw-22', 'loc-southern-respite', 12, 'emp-sw-022', 'Support worker', 'No', '2024-01-15', 'Weekend roster'),
  ('loc-emp-loc-murray-bridge-day-mgr', 'loc-murray-bridge-day', 1, 'emp-oliver', 'Team leader', 'Yes', '2022-09-01', ''),
  ('loc-emp-loc-murray-bridge-day-sw-23', 'loc-murray-bridge-day', 2, 'emp-sw-023', 'Support worker', 'Yes', '2022-09-01', 'Regular weekday shifts'),
  ('loc-emp-loc-murray-bridge-day-sw-24', 'loc-murray-bridge-day', 3, 'emp-sw-024', 'Support worker', 'No', '2022-09-01', 'Weekend roster'),
  ('loc-emp-loc-murray-bridge-day-sw-25', 'loc-murray-bridge-day', 4, 'emp-sw-025', 'Support worker', 'No', '2022-09-01', 'Relief pool'),
  ('loc-emp-loc-murray-bridge-day-sw-26', 'loc-murray-bridge-day', 5, 'emp-sw-026', 'Support worker', 'No', '2022-09-01', 'Regular weekday shifts'),
  ('loc-emp-loc-murray-bridge-day-sw-27', 'loc-murray-bridge-day', 6, 'emp-sw-027', 'Support worker', 'No', '2022-09-01', 'Weekend roster'),
  ('loc-emp-loc-murray-bridge-day-sw-28', 'loc-murray-bridge-day', 7, 'emp-sw-028', 'Support worker', 'No', '2022-09-01', 'Relief pool'),
  ('loc-emp-loc-murray-bridge-day-sw-29', 'loc-murray-bridge-day', 8, 'emp-sw-029', 'Support worker', 'No', '2022-09-01', 'Regular weekday shifts'),
  ('loc-emp-loc-murray-bridge-day-sw-30', 'loc-murray-bridge-day', 9, 'emp-sw-030', 'Support worker', 'No', '2022-09-01', 'Weekend roster'),
  ('loc-emp-loc-murray-bridge-day-sw-31', 'loc-murray-bridge-day', 10, 'emp-sw-031', 'Support worker', 'No', '2022-09-01', 'Relief pool'),
  ('loc-emp-loc-murray-bridge-day-sw-32', 'loc-murray-bridge-day', 11, 'emp-sw-032', 'Support worker', 'No', '2022-09-01', 'Regular weekday shifts');

delete from public.support_location_activity where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub', 'loc-northern-sil', 'loc-southern-respite', 'loc-murray-bridge-day');
insert into public.support_location_activity (id, location_id, line_no, activity_date, activity_type, subject, description, created_by)
values
  ('loc-act-glen-1', 'loc-glenelg-sil', 1, '2025-05-10', 'Site visit', 'Quarterly safety walkthrough', 'Checked exits, fire equipment, and access ramp condition.', 'Isla Robinson');

delete from public.support_location_product where location_id in ('loc-glenelg-sil', 'loc-adelaide-hub', 'loc-northern-sil', 'loc-southern-respite', 'loc-murray-bridge-day');
insert into public.support_location_product (id, location_id, line_no, product_id, active, valid_from, notes)
values
  ('loc-prod-glen-sil', 'loc-glenelg-sil', 1, 'prod-sil-wd', 'Yes', '2022-03-01', 'Primary SIL weekday service'),
  ('loc-prod-glen-trans', 'loc-glenelg-sil', 2, 'prod-transport', 'Yes', '2022-03-01', 'Provider travel for community access'),
  ('loc-prod-hub-cp', 'loc-adelaide-hub', 1, 'prod-cp', 'Yes', '2021-01-15', 'Core day program offering'),
  ('loc-prod-loc-northern-sil-1', 'loc-northern-sil', 1, 'prod-sil-wd', 'Yes', '2023-04-01', 'Northern SIL weekday service'),
  ('loc-prod-loc-southern-respite-1', 'loc-southern-respite', 1, 'prod-sil-wd', 'Yes', '2024-01-15', 'Short-term accommodation / respite'),
  ('loc-prod-loc-murray-bridge-day-1', 'loc-murray-bridge-day', 1, 'prod-cp', 'Yes', '2022-09-01', 'Regional community participation');
