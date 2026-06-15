-- Employee seed
-- Re-run: npm run supabase:seed-employees

insert into public.employee (
  id, search_key, business_partner_group, name, first_name, last_name,
  preferred_name, middle_name, email, phone, mobile, job_title, department,
  employment_status, employment_type, start_date, end_date, probation_end_date, confirmation_date, notice_days,
  site_branch, cost_centre, gender, birthday, employee_number, reports_to_id,
  driver_licence_class, driver_licence_expiry, visa_subclass, visa_expiry, work_rights_notes,
  bank_name, bank_bsb, bank_account_number, pay_method, tfn, tax_declaration, super_fund, super_member_number,
  standard_hours_per_week, fte, leave_policy, medical_restrictions_notes, notes, created_by, updated_by
)
values
  ('emp-isla', 'IslaR', 'Employee', 'Isla Robinson', 'Isla', 'Robinson', 'Isla', '', 'isla.robinson@abilityerp.local', '08 8294 1100', '0412 111 222', 'Support Coordinator', 'Client services', 'Active', 'Full-time', '2019-03-01', null, '2019-09-01', '2019-09-15', 4, 'Adelaide HQ', 'CC-CLIENT', 'Female', '1988-06-12', 'EMP-1001', 'emp-michael', 'C', '2027-08-01', '', null, 'Australian citizen', 'Commonwealth Bank', '065-000', '12345678', 'Bank', '', 'Tax-free threshold claimed', 'Australian Super', 'AS-88421', 38, 1, 'Standard award — 4 weeks annual', '', '', 'SuperUser', 'SuperUser'),
  ('emp-gabriela', 'GabW', 'Employee', 'Gabriela Wilson', 'Gabriela', 'Wilson', 'Gabriela', '', 'gabriela.wilson@abilityerp.local', '', '0413 222 333', 'Intake Officer', 'Intake', 'Active', 'Part-time', '2020-06-15', null, null, '2020-12-01', 2, 'Adelaide HQ', 'CC-INTAKE', 'Female', '1992-02-20', 'EMP-1002', 'emp-michael', '', null, '482', '2026-07-15', 'Sponsored visa — monitor expiry', '', '', '', 'Bank', '', '', '', '', 22, 0.58, 'Part-time pro-rata', '', '', 'SuperUser', 'SuperUser'),
  ('emp-michael', 'MichS', 'Employee', 'Michael Smith', 'Michael', 'Smith', 'Michael', '', 'michael.smith@abilityerp.local', '', '', 'Team Leader', 'Support coordination', 'Active', 'Full-time', '2018-01-10', null, null, null, null, 'Adelaide HQ', 'CC-CLIENT', '', null, 'EMP-1003', null, '', null, '', null, '', '', '', '', '', '', '', '', '', 38, 1, '', '', '', 'SuperUser', 'SuperUser'),
  ('emp-oliver', 'OlvW', 'Employee', 'Oliver Williams', 'Oliver', 'Williams', 'Oliver', '', 'oliver.williams@abilityerp.local', '', '', 'Support Worker', 'Operations', 'Active', 'Casual', '2021-09-01', null, null, null, null, 'Northern', 'CC-OPS', '', null, 'EMP-1004', 'emp-michael', 'C', '2026-07-01', '', null, '', '', '', '', 'Bank', '', '', '', '', null, 0, 'Casual — no paid leave accrual', '', '', 'SuperUser', 'SuperUser'),
  ('emp-rose', 'RoseD', 'Employee', 'Rose Dash', 'Rose', 'Dash', 'Rose', '', 'rose.dash@abilityerp.local', '', '', 'Plan Developer', 'Client services', 'Active', 'Full-time', '2017-11-20', null, null, null, null, '', '', '', null, '', null, '', null, '', null, '', '', '', '', '', '', '', '', '', null, null, '', '', '', 'SuperUser', 'SuperUser'),
  ('emp-jessica', 'JessH', 'Employee', 'Jessica Hancock', 'Jessica', 'Hancock', 'Jessica', '', 'jessica.hancock@abilityerp.local', '', '', 'Contract Administrator', 'Finance', 'Active', 'Full-time', '2022-02-01', null, null, null, null, '', '', '', null, '', null, '', null, '', null, '', '', '', '', '', '', '', '', '', null, null, '', '', '', 'SuperUser', 'SuperUser')
on conflict (id) do update set
  search_key = excluded.search_key, name = excluded.name, employment_type = excluded.employment_type, reports_to_id = excluded.reports_to_id, employment_status = excluded.employment_status, updated_by = excluded.updated_by;

insert into public.employee_location (
  id, employee_id, line_no, name, address_type, address1, address2, address3, city, state, postcode, country, phone, mobile, email, primary_address, active, valid_from, valid_to, access_notes, description
)
values
  ('loc-isla-home', 'emp-isla', 1, 'Home', 'Home', '12 Ward Street', '', '', 'Adelaide', 'SA', '5000', 'Australia', '08 8294 1100', '0412 111 222', 'isla.robinson@abilityerp.local', 'Yes', 'Yes', '2019-03-01', null, '', ''),
  ('loc-isla-postal', 'emp-isla', 2, 'Postal', 'Postal', 'PO Box 442', '', '', 'Adelaide', 'SA', '5001', 'Australia', '', '', '', 'No', 'Yes', '2019-03-01', null, '', ''),
  ('loc-gab-home', 'emp-gabriela', 1, 'Home', 'Home', '8 King William Street', 'Unit 4', '', 'Adelaide', 'SA', '5000', 'Australia', '', '0413 222 333', 'gabriela.wilson@abilityerp.local', 'Yes', 'Yes', '2020-06-15', null, '', '')
on conflict (id) do update set
  name = excluded.name, primary_address = excluded.primary_address;

insert into public.employee_emergency_contact (
  id, employee_id, line_no, contact_type, name, relationship, phone, mobile, email, call_order, primary_contact, notes
)
values
  ('ec-isla-james', 'emp-isla', 1, 'Emergency', 'James Robinson', 'Spouse', '', '0411 999 888', 'james.robinson@example.com', 1, 'Yes', ''),
  ('ec-isla-mary', 'emp-isla', 2, 'Next of kin', 'Mary Robinson', 'Parent', '08 8294 2200', '', '', 2, 'No', ''),
  ('ec-gab-maria', 'emp-gabriela', 1, 'Emergency', 'Maria Wilson', 'Parent', '', '0412 555 444', '', 1, 'Yes', '')
on conflict (id) do update set
  name = excluded.name, primary_contact = excluded.primary_contact;

insert into public.employee_alert (
  id, employee_id, line_no, alert_type, show_as_alert, name, description, valid_from, valid_to, source
)
values
  ('alert-isla-supervision', 'emp-isla', 1, 'Operational', 'Yes', 'New team member supervision', 'Pair with senior coordinator for complex behaviour support cases until Q3 review.', '2025-01-01', '2025-09-30', 'Manual')
on conflict (id) do update set
  name = excluded.name, description = excluded.description;

insert into public.employee_skill (
  id, employee_id, line_no, skill_type, name, proficiency, notes
)
values
  ('skill-isla-en', 'emp-isla', 1, 'Language', 'English', 'Native', ''),
  ('skill-isla-coord', 'emp-isla', 2, 'Specialisation', 'Support coordination', 'Advanced', ''),
  ('skill-isla-autism', 'emp-isla', 3, 'Specialisation', 'Autism support', 'Intermediate', ''),
  ('skill-gab-en', 'emp-gabriela', 1, 'Language', 'English', 'Native', ''),
  ('skill-gab-es', 'emp-gabriela', 2, 'Language', 'Spanish', 'Fluent', '')
on conflict (id) do update set
  name = excluded.name, proficiency = excluded.proficiency;

insert into public.employee_document (
  id, employee_id, line_no, document_type, name, document_ref, issue_date, expiry_date, status, notes
)
values
  ('doc-isla-contract', 'emp-isla', 1, 'Employment contract', 'Permanent employment agreement', 'DOC-EMP-ISLA-2019', '2019-03-01', null, 'Current', '')
on conflict (id) do update set
  name = excluded.name, document_ref = excluded.document_ref;

insert into public.employee_activity (
  id, employee_id, line_no, activity_date, activity_type, subject, description, created_by
)
values
  ('act-isla-onboard', 'emp-isla', 1, '2019-03-01', 'Onboarding', 'Induction completed', 'Policy pack signed, systems access provisioned.', 'SuperUser')
on conflict (id) do update set
  subject = excluded.subject, description = excluded.description;

insert into public.employee_leave_entitlement (
  id, employee_id, line_no, leave_type, entitlement_days, balance_days, accrual_notes
)
values
  ('leave-isla-annual', 'emp-isla', 1, 'Annual leave', 20, 14.5, 'Accrued per award'),
  ('leave-isla-personal', 'emp-isla', 2, 'Personal / carer''s leave', 10, 8, ''),
  ('leave-gab-annual', 'emp-gabriela', 1, 'Annual leave', 11.6, 6, 'Pro-rata part-time')
on conflict (id) do update set
  balance_days = excluded.balance_days;

insert into public.employee_credential (
  id, employee_id, line_no, credential_type, credential_number, issuing_body, issue_date, expiry_date, status, document_ref, notes, created_by, updated_by
)
values
  ('cred-isla-wwcc', 'emp-isla', 1, 'Working with Children Check', 'WWCC-88421', 'SA Department for Education', '2023-04-01', '2028-04-01', 'Current', 'DOC-WWCC-88421', '', 'SuperUser', 'SuperUser'),
  ('cred-isla-ndis', 'emp-isla', 2, 'NDIS Worker Screening', 'NDIS-WS-442901', 'NDIS Worker Screening Unit', '2022-11-15', '2027-11-15', 'Current', 'DOC-NDIS-442901', '', 'SuperUser', 'SuperUser'),
  ('cred-gab-wwcc', 'emp-gabriela', 1, 'Working with Children Check', 'WWCC-91002', 'SA Department for Education', '2024-01-10', '2029-01-10', 'Current', '', '', 'SuperUser', 'SuperUser'),
  ('cred-oliver-fa', 'emp-oliver', 1, 'First Aid Certificate', 'FA-22001', 'St John Ambulance', '2024-07-01', '2026-07-01', 'Expiring soon', '', 'Renew before rostering community shifts', 'SuperUser', 'SuperUser')
on conflict (id) do update set
  credential_type = excluded.credential_type, expiry_date = excluded.expiry_date, status = excluded.status;
