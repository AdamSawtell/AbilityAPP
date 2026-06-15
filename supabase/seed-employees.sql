-- Employee seed
-- Re-run: npm run supabase:seed-employees

insert into public.employee (
  id, search_key, business_partner_group, name, first_name, last_name,
  preferred_name, middle_name, email, phone, mobile, job_title, department,
  employment_status, start_date, end_date, created_by, updated_by
)
values
  ('emp-isla', 'IslaR', 'Employee', 'Isla Robinson', 'Isla', 'Robinson', 'Isla', '', 'isla.robinson@abilityerp.local', '08 8294 1100', '0412 111 222', 'Support Coordinator', 'Client services', 'Active', '2019-03-01', null, 'SuperUser', 'SuperUser'),
  ('emp-gabriela', 'GabW', 'Employee', 'Gabriela Wilson', 'Gabriela', 'Wilson', 'Gabriela', '', 'gabriela.wilson@abilityerp.local', '', '0413 222 333', 'Intake Officer', 'Intake', 'Active', '2020-06-15', null, 'SuperUser', 'SuperUser'),
  ('emp-michael', 'MichS', 'Employee', 'Michael Smith', 'Michael', 'Smith', 'Michael', '', 'michael.smith@abilityerp.local', '', '', 'Team Leader', 'Support coordination', 'Active', '2018-01-10', null, 'SuperUser', 'SuperUser'),
  ('emp-oliver', 'OlvW', 'Employee', 'Oliver Williams', 'Oliver', 'Williams', 'Oliver', '', 'oliver.williams@abilityerp.local', '', '', 'Support Worker', 'Operations', 'Active', '2021-09-01', null, 'SuperUser', 'SuperUser'),
  ('emp-rose', 'RoseD', 'Employee', 'Rose Dash', 'Rose', 'Dash', 'Rose', '', 'rose.dash@abilityerp.local', '', '', 'Plan Developer', 'Client services', 'Active', '2017-11-20', null, 'SuperUser', 'SuperUser'),
  ('emp-jessica', 'JessH', 'Employee', 'Jessica Hancock', 'Jessica', 'Hancock', 'Jessica', '', 'jessica.hancock@abilityerp.local', '', '', 'Contract Administrator', 'Finance', 'Active', '2022-02-01', null, 'SuperUser', 'SuperUser')
on conflict (id) do update set
  search_key = excluded.search_key, name = excluded.name, first_name = excluded.first_name, last_name = excluded.last_name, email = excluded.email, job_title = excluded.job_title, department = excluded.department, employment_status = excluded.employment_status, updated_by = excluded.updated_by;

insert into public.employee_credential (
  id, employee_id, line_no, credential_type, credential_number, issuing_body, issue_date, expiry_date, status, document_ref, notes, created_by, updated_by
)
values
  ('cred-isla-wwcc', 'emp-isla', 1, 'Working with Children Check', 'WWCC-88421', 'SA Department for Education', '2023-04-01', '2028-04-01', 'Current', 'DOC-WWCC-88421', '', 'SuperUser', 'SuperUser'),
  ('cred-isla-ndis', 'emp-isla', 2, 'NDIS Worker Screening', 'NDIS-WS-442901', 'NDIS Worker Screening Unit', '2022-11-15', '2027-11-15', 'Current', 'DOC-NDIS-442901', '', 'SuperUser', 'SuperUser'),
  ('cred-gab-wwcc', 'emp-gabriela', 1, 'Working with Children Check', 'WWCC-91002', 'SA Department for Education', '2024-01-10', '2029-01-10', 'Current', '', '', 'SuperUser', 'SuperUser')
on conflict (id) do update set
  credential_type = excluded.credential_type, credential_number = excluded.credential_number, expiry_date = excluded.expiry_date, status = excluded.status, updated_by = excluded.updated_by;