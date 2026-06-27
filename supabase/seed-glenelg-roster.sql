-- Glenelg SIL House — full roster of care master template (generated)
-- Re-run: npm run supabase:seed-glenelg-roster
-- Additive + idempotent (on conflict do update). Run after seed-locations.sql.

-- Indicative weekly worker hours from this master roster:
--   noah (emp-sw-002): 39h (sleepover counted as 2h active)
--   amelia (emp-sw-017): 37h (sleepover counted as 2h active)
--   kai (emp-sw-032): 37h (sleepover counted as 2h active)
--   jason (emp-jason-brown): 31h (sleepover counted as 2h active)
--   ivy (emp-staff-137): 29h (sleepover counted as 2h active)
--   henry (emp-sw-012): 22h (sleepover counted as 2h active)
--   evie (emp-sw-027): 19h (sleepover counted as 2h active)
--   chloe (emp-sw-007): 8h (sleepover counted as 2h active)
--   archie (emp-sw-022): 6h (sleepover counted as 2h active)

insert into public.client (id, enquiry_id, search_key, business_partner_group, name, risk_alerts, consent_alert_list, first_name, preferred_name, last_name, middle_name, email, phone, status, birthday, is_estimated_age, gender, decision_making, lgbtiqa, living_arrangement, sales_representative, services, funding_body, funding_body_number, transitioned_to_pace, date_support_commencement, date_support_ceased, aboriginal_torres_strait_islander, cultural_affiliation, disability, additional_disability_information, created_by, updated_by)
values
  ('cli-glen-marcus', null, 'Webb', 'Support Receiver', 'Marcus Webb', 'Behaviours of concern — follow behaviour support plan', '', 'Marcus', 'Marcus', 'Webb', '', 'marcus.webb@example.com', '08 8294 2210', '2_Active receiving support', '1994-03-12', false, 'Male', 'Supported decision making', '', 'Lives in Supported Independent Living', 'Isla Robinson', '', 'NDIS - National Disability Insurance Scheme', '', null, '2022-08-01', null, 'Neither', 'Australian', 'ID - Intellectual Disability', 'Autism spectrum disorder with co-occurring intellectual disability. Positive behaviour support plan in place; benefits from consistent staff and predictable routine.', 'Isla Robinson', 'SuperUser'),
  ('cli-glen-priya', null, 'Nair', 'Support Receiver', 'Priya Nair', 'Epilepsy — seizure management plan; mealtime/choking risk', '', 'Priya', 'Priya', 'Nair', '', 'priya.nair@example.com', '08 8294 2220', '2_Active receiving support', '1998-11-05', false, 'Female', 'Supported decision making', '', 'Lives in Supported Independent Living', 'Isla Robinson', '', 'NDIS - National Disability Insurance Scheme', '', null, '2023-02-15', null, 'Neither', 'Australian', 'Down syndrome', 'Down syndrome with epilepsy. Seizure management plan and choking/mealtime management plan in place. Requires prompting and supervision for daily living.', 'Isla Robinson', 'SuperUser')
on conflict (id) do update set
  search_key = excluded.search_key, name = excluded.name, risk_alerts = excluded.risk_alerts, first_name = excluded.first_name, last_name = excluded.last_name, status = excluded.status, living_arrangement = excluded.living_arrangement, disability = excluded.disability, additional_disability_information = excluded.additional_disability_information, updated_by = excluded.updated_by;

insert into public.client_location (id, client_id, line_no, name, address_type, address1, address2, address3, city, state, postcode, country, phone, mobile, email, post_to_address, invoice_address, ship_to_address, service_delivery_address, active, valid_from, valid_to, access_notes, description)
values
  ('loc-home-cli-glen-marcus', 'cli-glen-marcus', 1, 'Home', 'Home', '22 Partridge Street', 'Room 2', '', 'Glenelg', 'SA', '5045', 'Australia', '08 8294 2210', '', 'marcus.webb@example.com', 'No', 'Yes', 'Yes', 'Yes', 'Yes', '2026-01-05', null, 'Shared SIL residence — 24/7 support.', 'Primary SIL placement at Glenelg SIL House.'),
  ('loc-home-cli-glen-priya', 'cli-glen-priya', 1, 'Home', 'Home', '22 Partridge Street', 'Room 3', '', 'Glenelg', 'SA', '5045', 'Australia', '08 8294 2220', '', 'priya.nair@example.com', 'No', 'Yes', 'Yes', 'Yes', 'Yes', '2026-01-05', null, 'Shared SIL residence — 24/7 support.', 'Primary SIL placement at Glenelg SIL House.')
on conflict (id) do update set address1 = excluded.address1, description = excluded.description;

insert into public.service_agreement (id, search_key, name, description, client_id, price_list_id, term, status, execution_date, contract_date, finish_date, review_date, total_planned_amount, created_by, updated_by)
values
  ('sa-glen-marcus', 'WEBB_Marcus Webb', 'NDIS Service Agreement', 'High intensity SIL and community participation', 'cli-glen-marcus', 'pl-ndis-2024', 'Fixed Term', 'Active', '2026-01-01', '2026-01-01', '2026-12-31', '2026-09-30', 318450, 'Isla Robinson', 'Isla Robinson'),
  ('sa-glen-priya', 'NAIR_Priya Nair', 'NDIS Service Agreement', 'High intensity SIL and community participation', 'cli-glen-priya', 'pl-ndis-2024', 'Fixed Term', 'Active', '2026-01-01', '2026-01-01', '2026-12-31', '2026-09-30', 305800, 'Isla Robinson', 'Isla Robinson')
on conflict (id) do update set name = excluded.name, description = excluded.description, total_planned_amount = excluded.total_planned_amount, updated_by = excluded.updated_by;

insert into public.service_agreement_line (id, service_agreement_id, line_no, product_id, name, description, planned_price, registration_group, funding_type, funding_body, funding_management_type, budget_rules)
values
  ('sal-marcus-sil', 'sa-glen-marcus', 10, 'prod-sil-wd', 'SIL', 'Supported Independent Living — 24/7 shared support', 301500, 'Supported Independent Living', 'Funding Body', 'NDIS - National Disability Insurance Scheme', 'Portal Managed', 'Strict Limit'),
  ('sal-marcus-cp', 'sa-glen-marcus', 20, 'prod-cp', 'Community Participation', 'Assistance with social and community participation', 16950, 'Participation In Community And Social And Civic Activities', 'Funding Body', 'NDIS - National Disability Insurance Scheme', 'Portal Managed', 'Warning'),
  ('sal-priya-sil', 'sa-glen-priya', 10, 'prod-sil-wd', 'SIL', 'Supported Independent Living — 24/7 shared support', 289000, 'Supported Independent Living', 'Funding Body', 'NDIS - National Disability Insurance Scheme', 'Portal Managed', 'Strict Limit'),
  ('sal-priya-cp', 'sa-glen-priya', 20, 'prod-cp', 'Community Participation', 'Assistance with social and community participation', 16800, 'Participation In Community And Social And Civic Activities', 'Funding Body', 'NDIS - National Disability Insurance Scheme', 'Portal Managed', 'Warning')
on conflict (id) do update set name = excluded.name, planned_price = excluded.planned_price;

insert into public.support_location_client (id, location_id, line_no, client_id, assignment_role, primary_assignment, valid_from, notes)
values
  ('loc-cli-glen-marcus', 'loc-glenelg-sil', 2, 'cli-glen-marcus', 'Resident', 'Yes', '2022-08-01', 'SIL placement — Room 2'),
  ('loc-cli-glen-priya', 'loc-glenelg-sil', 3, 'cli-glen-priya', 'Resident', 'Yes', '2023-02-15', 'SIL placement — Room 3')
on conflict (id) do update set client_id = excluded.client_id, assignment_role = excluded.assignment_role, notes = excluded.notes;

insert into public.employee (id, search_key, business_partner_group, name, first_name, last_name, preferred_name, middle_name, email, phone, mobile, job_title, department, employment_status, employment_type, start_date, end_date, probation_end_date, confirmation_date, notice_days, site_branch, cost_centre, gender, birthday, employee_number, reports_to_id, driver_licence_class, driver_licence_expiry, visa_subclass, visa_expiry, work_rights_notes, bank_name, bank_bsb, bank_account_number, pay_method, tfn, tax_declaration, super_fund, super_member_number, standard_hours_per_week, fte, leave_policy, medical_restrictions_notes, notes, created_by, updated_by)
values
  ('emp-jason-brown', 'JasBr', 'Employee', 'Jason Brown', 'Jason', 'Brown', 'Jason', '', 'jason.brown@abilityerp.local', '', '0412 808 909', 'Support Worker', 'Operations', 'Active', 'Part-time', '2024-09-01', null, '2025-03-01', '2025-03-15', 2, 'Glenelg', 'CC-OPS', 'Male', '1990-09-09', 'EMP-1201', 'emp-staff-137', 'C', '2028-09-01', '', null, 'Australian citizen', 'Commonwealth Bank', '065-000', '12012012', 'Bank', '', 'Tax-free threshold claimed', 'Australian Super', 'AS-12012', 30, 0.79, 'Standard award — pro-rata', '', 'Glenelg SIL House regular support worker — 30 hours', 'SuperUser', 'SuperUser')
on conflict (id) do update set name = excluded.name, job_title = excluded.job_title, employment_type = excluded.employment_type, site_branch = excluded.site_branch, standard_hours_per_week = excluded.standard_hours_per_week, fte = excluded.fte, reports_to_id = excluded.reports_to_id, updated_by = excluded.updated_by;

insert into public.employee_location (id, employee_id, line_no, name, address_type, address1, address2, address3, city, state, postcode, country, phone, mobile, email, primary_address, active, valid_from, valid_to, access_notes, description)
values
  ('loc-emp-jason-brown-home', 'emp-jason-brown', 1, 'Home', 'Home', '9 Augusta Street', '', '', 'Glenelg', 'SA', '5045', 'Australia', '', '0412 808 909', 'jason.brown@abilityerp.local', 'Yes', 'Yes', '2024-09-01', null, '', '')
on conflict (id) do update set name = excluded.name, primary_address = excluded.primary_address;

insert into public.employee_emergency_contact (id, employee_id, line_no, contact_type, name, relationship, phone, mobile, email, call_order, primary_contact, notes)
values
  ('ec-emp-jason-brown-1', 'emp-jason-brown', 1, 'Emergency', 'Karen Brown', 'Spouse', '', '0412 808 910', '', 1, 'Yes', '')
on conflict (id) do update set name = excluded.name, primary_contact = excluded.primary_contact;

insert into public.employee_credential (id, employee_id, line_no, credential_type, credential_number, issuing_body, issue_date, expiry_date, status, document_ref, notes, created_by, updated_by)
values
  ('cred-emp-jason-brown-wwcc', 'emp-jason-brown', 1, 'Working with Children Check', 'WWCC-12012', 'DHS Screening', '2024-08-01', '2029-08-01', 'Current', '', '', 'SuperUser', 'SuperUser'),
  ('cred-emp-jason-brown-ndis', 'emp-jason-brown', 2, 'NDIS Worker Screening', 'NDIS-WS-12012', 'NDIS Worker Screening Unit', '2024-08-01', '2029-08-01', 'Current', '', '', 'SuperUser', 'SuperUser'),
  ('cred-emp-jason-brown-fa', 'emp-jason-brown', 3, 'First Aid Certificate', 'FA-12012', 'St John Ambulance', '2025-01-10', '2027-01-10', 'Current', '', '', 'SuperUser', 'SuperUser')
on conflict (id) do update set credential_type = excluded.credential_type, expiry_date = excluded.expiry_date, status = excluded.status;

insert into public.support_location_employee (id, location_id, line_no, employee_id, assignment_role, primary_assignment, valid_from, notes)
values
  ('loc-emp-glen-emp-staff-137', 'loc-glenelg-sil', 3, 'emp-staff-137', 'Team leader', 'No', '2026-01-05', 'Glenelg SIL team leader'),
  ('loc-emp-glen-emp-jason-brown', 'loc-glenelg-sil', 4, 'emp-jason-brown', 'Support worker', 'No', '2026-01-05', 'Regular roster — 30 hours'),
  ('loc-emp-glen-emp-sw-002', 'loc-glenelg-sil', 5, 'emp-sw-002', 'Support worker', 'No', '2026-01-05', 'Full-time regular'),
  ('loc-emp-glen-emp-sw-017', 'loc-glenelg-sil', 6, 'emp-sw-017', 'Support worker', 'No', '2026-01-05', 'Full-time regular'),
  ('loc-emp-glen-emp-sw-032', 'loc-glenelg-sil', 7, 'emp-sw-032', 'Support worker', 'No', '2026-01-05', 'Full-time regular'),
  ('loc-emp-glen-emp-sw-012', 'loc-glenelg-sil', 8, 'emp-sw-012', 'Support worker', 'No', '2026-01-05', 'Part-time'),
  ('loc-emp-glen-emp-sw-027', 'loc-glenelg-sil', 9, 'emp-sw-027', 'Support worker', 'No', '2026-01-05', 'Part-time'),
  ('loc-emp-glen-emp-sw-007', 'loc-glenelg-sil', 10, 'emp-sw-007', 'Support worker', 'No', '2026-01-05', 'Casual relief / sleepovers'),
  ('loc-emp-glen-emp-sw-022', 'loc-glenelg-sil', 11, 'emp-sw-022', 'Support worker', 'No', '2026-01-05', 'Casual relief / sleepovers')
on conflict (id) do update set employee_id = excluded.employee_id, assignment_role = excluded.assignment_role, notes = excluded.notes;

delete from public.roster_of_care_line where roster_of_care_id in ('roc-glen-bern', 'roc-glen-marcus', 'roc-glen-priya');
insert into public.roster_of_care (id, client_id, service_agreement_id, name, status, source, valid_from, valid_to, created_by, updated_by)
values
  ('roc-glen-bern', 'bp-bern', 'sa-rose-ni', 'Glenelg SIL weekly roster', 'Active', 'Manual', '2026-01-05', null, 'Isla Robinson', 'Isla Robinson'),
  ('roc-glen-marcus', 'cli-glen-marcus', 'sa-glen-marcus', 'Glenelg SIL weekly roster', 'Active', 'Manual', '2026-01-05', null, 'Isla Robinson', 'Isla Robinson'),
  ('roc-glen-priya', 'cli-glen-priya', 'sa-glen-priya', 'Glenelg SIL weekly roster', 'Active', 'Manual', '2026-01-05', null, 'Isla Robinson', 'Isla Robinson')
on conflict (id) do update set service_agreement_id = excluded.service_agreement_id, name = excluded.name, status = excluded.status, valid_from = excluded.valid_from, updated_by = excluded.updated_by;

insert into public.roster_of_care_line (id, roster_of_care_id, line_no, weekday, start_time, end_time, support_type, location_id, service_agreement_line_id, worker_requirement, default_employee_id, support_ratio, session_key, notes)
values
  ('rocl-roc-glen-bern-MON-AM', 'roc-glen-bern', 1, 0, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-002', '1:2', 'GLEN-AM-MON', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-bern-MON-PM', 'roc-glen-bern', 2, 0, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-032', '1:2', 'GLEN-PM-MON', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-bern-MON-NIGHT', 'roc-glen-bern', 3, 0, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-007', '1:3', 'GLEN-NIGHT-MON', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-bern-TUE-AM', 'roc-glen-bern', 4, 1, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-002', '1:2', 'GLEN-AM-TUE', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-bern-TUE-PM', 'roc-glen-bern', 5, 1, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-017', '1:2', 'GLEN-PM-TUE', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-bern-TUE-NIGHT', 'roc-glen-bern', 6, 1, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-022', '1:3', 'GLEN-NIGHT-TUE', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-bern-WED-AM', 'roc-glen-bern', 7, 2, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-staff-137', '1:2', 'GLEN-AM-WED', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-bern-WED-PM', 'roc-glen-bern', 8, 2, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-002', '1:2', 'GLEN-PM-WED', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-bern-WED-NIGHT', 'roc-glen-bern', 9, 2, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-007', '1:3', 'GLEN-NIGHT-WED', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-bern-WED-DAY', 'roc-glen-bern', 10, 2, '10:00', '14:00', 'Standard', 'loc-adelaide-hub', 'sal-2', '', 'emp-sw-027', '1:3', 'GLEN-DAY-WED', 'Group community participation at Adelaide Day Hub'),
  ('rocl-roc-glen-bern-THU-AM', 'roc-glen-bern', 11, 3, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-017', '1:2', 'GLEN-AM-THU', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-bern-THU-PM', 'roc-glen-bern', 12, 3, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-staff-137', '1:2', 'GLEN-PM-THU', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-bern-THU-NIGHT', 'roc-glen-bern', 13, 3, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-022', '1:3', 'GLEN-NIGHT-THU', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-bern-FRI-AM', 'roc-glen-bern', 14, 4, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-002', '1:2', 'GLEN-AM-FRI', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-bern-FRI-PM', 'roc-glen-bern', 15, 4, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-017', '1:2', 'GLEN-PM-FRI', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-bern-FRI-NIGHT', 'roc-glen-bern', 16, 4, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-007', '1:3', 'GLEN-NIGHT-FRI', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-bern-SAT-AM', 'roc-glen-bern', 17, 5, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-032', '1:2', 'GLEN-AM-SAT', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-bern-SAT-PM', 'roc-glen-bern', 18, 5, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-staff-137', '1:2', 'GLEN-PM-SAT', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-bern-SAT-NIGHT', 'roc-glen-bern', 19, 5, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-022', '1:3', 'GLEN-NIGHT-SAT', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-bern-SUN-AM', 'roc-glen-bern', 20, 6, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-002', '1:2', 'GLEN-AM-SUN', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-bern-SUN-PM', 'roc-glen-bern', 21, 6, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-032', '1:2', 'GLEN-PM-SUN', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-bern-SUN-NIGHT', 'roc-glen-bern', 22, 6, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-1', '', 'emp-sw-007', '1:3', 'GLEN-NIGHT-SUN', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-marcus-MON-AM', 'roc-glen-marcus', 1, 0, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-017', '1:2', 'GLEN-AM-MON', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-marcus-MON-PM', 'roc-glen-marcus', 2, 0, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-staff-137', '1:2', 'GLEN-PM-MON', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-marcus-MON-NIGHT', 'roc-glen-marcus', 3, 0, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-marcus-sil', '', null, '1:3', 'GLEN-NIGHT-MON', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-marcus-TUE-AM', 'roc-glen-marcus', 4, 1, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-jason-brown', '1:2', 'GLEN-AM-TUE', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-marcus-TUE-PM', 'roc-glen-marcus', 5, 1, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-032', '1:2', 'GLEN-PM-TUE', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-marcus-TUE-NIGHT', 'roc-glen-marcus', 6, 1, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-marcus-sil', '', null, '1:3', 'GLEN-NIGHT-TUE', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-marcus-WED-AM', 'roc-glen-marcus', 7, 2, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-jason-brown', '1:2', 'GLEN-AM-WED', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-marcus-WED-PM', 'roc-glen-marcus', 8, 2, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-012', '1:2', 'GLEN-PM-WED', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-marcus-WED-NIGHT', 'roc-glen-marcus', 9, 2, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-marcus-sil', '', null, '1:3', 'GLEN-NIGHT-WED', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-marcus-WED-DAY', 'roc-glen-marcus', 10, 2, '10:00', '14:00', 'Standard', 'loc-adelaide-hub', 'sal-marcus-cp', '', null, '1:3', 'GLEN-DAY-WED', 'Group community participation at Adelaide Day Hub'),
  ('rocl-roc-glen-marcus-THU-AM', 'roc-glen-marcus', 11, 3, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-032', '1:2', 'GLEN-AM-THU', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-marcus-THU-PM', 'roc-glen-marcus', 12, 3, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-jason-brown', '1:2', 'GLEN-PM-THU', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-marcus-THU-NIGHT', 'roc-glen-marcus', 13, 3, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-marcus-sil', '', null, '1:3', 'GLEN-NIGHT-THU', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-marcus-FRI-AM', 'roc-glen-marcus', 14, 4, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-012', '1:2', 'GLEN-AM-FRI', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-marcus-FRI-PM', 'roc-glen-marcus', 15, 4, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-027', '1:2', 'GLEN-PM-FRI', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-marcus-FRI-NIGHT', 'roc-glen-marcus', 16, 4, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-marcus-sil', '', null, '1:3', 'GLEN-NIGHT-FRI', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-marcus-SAT-AM', 'roc-glen-marcus', 17, 5, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-027', '1:2', 'GLEN-AM-SAT', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-marcus-SAT-PM', 'roc-glen-marcus', 18, 5, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-012', '1:2', 'GLEN-PM-SAT', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-marcus-SAT-NIGHT', 'roc-glen-marcus', 19, 5, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-marcus-sil', '', null, '1:3', 'GLEN-NIGHT-SAT', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-marcus-SUN-AM', 'roc-glen-marcus', 20, 6, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-jason-brown', '1:2', 'GLEN-AM-SUN', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-marcus-SUN-PM', 'roc-glen-marcus', 21, 6, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-marcus-sil', '', 'emp-sw-017', '1:2', 'GLEN-PM-SUN', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-marcus-SUN-NIGHT', 'roc-glen-marcus', 22, 6, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-marcus-sil', '', null, '1:3', 'GLEN-NIGHT-SUN', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-priya-MON-AM', 'roc-glen-priya', 1, 0, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-AM-MON', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-priya-MON-PM', 'roc-glen-priya', 2, 0, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-PM-MON', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-priya-MON-NIGHT', 'roc-glen-priya', 3, 0, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:3', 'GLEN-NIGHT-MON', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-priya-TUE-AM', 'roc-glen-priya', 4, 1, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-AM-TUE', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-priya-TUE-PM', 'roc-glen-priya', 5, 1, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-PM-TUE', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-priya-TUE-NIGHT', 'roc-glen-priya', 6, 1, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:3', 'GLEN-NIGHT-TUE', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-priya-WED-AM', 'roc-glen-priya', 7, 2, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-AM-WED', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-priya-WED-PM', 'roc-glen-priya', 8, 2, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-PM-WED', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-priya-WED-NIGHT', 'roc-glen-priya', 9, 2, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:3', 'GLEN-NIGHT-WED', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-priya-THU-AM', 'roc-glen-priya', 10, 3, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-AM-THU', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-priya-THU-PM', 'roc-glen-priya', 11, 3, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-PM-THU', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-priya-THU-NIGHT', 'roc-glen-priya', 12, 3, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:3', 'GLEN-NIGHT-THU', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-priya-FRI-AM', 'roc-glen-priya', 13, 4, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-AM-FRI', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-priya-FRI-PM', 'roc-glen-priya', 14, 4, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-PM-FRI', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-priya-FRI-NIGHT', 'roc-glen-priya', 15, 4, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:3', 'GLEN-NIGHT-FRI', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-priya-SAT-AM', 'roc-glen-priya', 16, 5, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-AM-SAT', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-priya-SAT-PM', 'roc-glen-priya', 17, 5, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-PM-SAT', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-priya-SAT-NIGHT', 'roc-glen-priya', 18, 5, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:3', 'GLEN-NIGHT-SAT', 'Sleepover with active assistance as required'),
  ('rocl-roc-glen-priya-SUN-AM', 'roc-glen-priya', 19, 6, '07:00', '15:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-AM-SUN', 'Morning personal care, meals, community access prep'),
  ('rocl-roc-glen-priya-SUN-PM', 'roc-glen-priya', 20, 6, '15:00', '22:00', 'Standard', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:2', 'GLEN-PM-SUN', 'Evening meals, activities, settling'),
  ('rocl-roc-glen-priya-SUN-NIGHT', 'roc-glen-priya', 21, 6, '22:00', '07:00', 'Sleepover', 'loc-glenelg-sil', 'sal-priya-sil', '', null, '1:3', 'GLEN-NIGHT-SUN', 'Sleepover with active assistance as required');
