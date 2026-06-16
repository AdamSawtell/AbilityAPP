-- Entity seed (generated from web/src/lib/* seed data)
-- Re-run: npm run supabase:seed-entities

insert into public.enquiry (id, document_no, date_received, date_next_action, status, first_name, last_name, funding_body, disability, services, is_enquiry_for_self, third_party_consent, relationship_type, phone, email, birthday, gender, preferred_communication_method, bp_name, enquiry_source, description, outcome, additional_disability_information, other, created_by, updated_by)
values
  ('1000025', '1000025', '2022-12-05', '2023-05-22', '1_Initial Enquiry', 'Samuel', 'Ryan', 'NDIS - National Disability Insurance Scheme', 'PD - Spinal Cord Injury', 'Assistance with Self Care Activities; Community, Social and Civic Activities', 'Yes', 'ReceivedRequested', 'Parent', '', 'ryans@email.com', '2000-02-14', 'Male', 'Email', '', 'Phone Call', 'Samuel enquired for an In Home Support that takes place 4 hours a day, 5 days a week.', 'Reviewed and discussed the process with Samuel over a phone call.', '', '', 'Gabriela Wilson', 'SuperUser'),
  ('1000011', '1000011', '2023-05-20', '2023-05-22', '4_Converted', 'Jim', 'Bo', 'DSOA - Disability Support for Older Australians', 'SD - Hearing Impairment', 'Short Term Accommodation', 'Yes', 'Received', '', '', '', null, '', 'Phone Call', '', 'Referral', '', '', '', '', 'Gabriela Wilson', 'SuperUser'),
  ('1000012', '1000012', '2023-05-21', '2023-05-23', '4_Converted', 'Bryan', 'Jackson', 'NDIS - National Disability Insurance Scheme', 'PD - Multiple Sclerosis', 'Assistance with Self Care Activities', 'Yes', 'Received', '', '', '', null, 'Male', 'Email', '', 'Website', '', '', '', '', 'Gabriela Wilson', 'SuperUser'),
  ('1000013', '1000013', '2023-05-22', '2023-05-25', '1_Initial Enquiry', 'Janice', 'Williams', 'NDIS - National Disability Insurance Scheme', 'PD - Acquired Brain Injury', 'Assistance with Self Care Activities', 'Yes', 'Requested', 'Carer', '', '', null, 'Female', 'SMS', '', 'Phone Call', '', '', '', '', 'Gabriela Wilson', 'SuperUser'),
  ('1000014', '1000014', '2023-05-24', '2023-05-29', '1_Initial Enquiry', 'Gerald', 'Anderson', 'DSOA - Disability Support for Older Australians', 'PD - Stroke', 'Assistance with Self Care Activities', 'No', 'Received', 'Guardian', '', '', null, 'Male', 'Phone Call', '', 'Referral', '', '', '', '', 'Gabriela Wilson', 'SuperUser'),
  ('1000015', '1000015', '2023-05-25', '2023-05-30', '2_To be processed', 'Jacob', 'Turner', 'NDIS - National Disability Insurance Scheme', 'PD - Absent Limb or Reduced Limb Function', 'Supported Independent Living', 'Yes', 'Received', '', '', '', null, '', 'Email', '', 'Email', '', '', '', '', 'Gabriela Wilson', 'SuperUser'),
  ('1000024', '1000024', '2024-05-20', '2024-05-27', '1_Initial Enquiry', 'Ava', 'Brown', 'NDIS - National Disability Insurance Scheme', 'ID - Autism', 'Group and Centre Based Activities', 'Yes', 'Received', 'Parent', '', '', null, 'Female', 'Email', '', 'Website', '', '', '', '', 'Gabriela Wilson', 'SuperUser')
on conflict (id) do update set
  document_no = excluded.document_no,
  date_received = excluded.date_received,
  date_next_action = excluded.date_next_action,
  status = excluded.status,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  funding_body = excluded.funding_body,
  disability = excluded.disability,
  services = excluded.services,
  is_enquiry_for_self = excluded.is_enquiry_for_self,
  third_party_consent = excluded.third_party_consent,
  relationship_type = excluded.relationship_type,
  phone = excluded.phone,
  email = excluded.email,
  birthday = excluded.birthday,
  gender = excluded.gender,
  preferred_communication_method = excluded.preferred_communication_method,
  bp_name = excluded.bp_name,
  enquiry_source = excluded.enquiry_source,
  description = excluded.description,
  outcome = excluded.outcome,
  additional_disability_information = excluded.additional_disability_information,
  other = excluded.other,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.enquiry_activity (id, enquiry_id, line_no, activity_date, activity_type, subject, description, created_by)
values
  ('ea-1000025-1', '1000025', 1, '2022-12-05', 'Phone call', 'Initial intake call', 'Discussed in-home support requirements with Samuel.', 'Gabriela Wilson')
on conflict (id) do update set
  enquiry_id = excluded.enquiry_id,
  line_no = excluded.line_no,
  activity_date = excluded.activity_date,
  activity_type = excluded.activity_type,
  subject = excluded.subject,
  description = excluded.description,
  created_by = excluded.created_by;

insert into public.price_list (id, name, schema_name, base_price_list_id, valid_from, currency, created_by, updated_by)
values
  ('pl-ndis-2024', 'NDIS Price List 2024-25', 'NDIS', '', '2024-07-01', 'AUD', 'Isla Robinson', 'SuperUser')
on conflict (id) do update set
  name = excluded.name,
  schema_name = excluded.schema_name,
  base_price_list_id = excluded.base_price_list_id,
  valid_from = excluded.valid_from,
  currency = excluded.currency,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.product (id, search_key, name, description, product_category, uom, product_type, active, sold, price_list_id, ndis_support_item, created_by, updated_by)
values
  ('prod-sil-wd', 'SIL_WD', 'SIL Weekday', 'Supported independent living — weekday', 'SIL', 'Hour', 'Service', true, true, 'pl-ndis-2024', '01_011_0107_1_1', 'Isla Robinson', 'SuperUser'),
  ('prod-cp', 'COMM_PART', 'Community Participation', 'Assistance with social and community participation', 'Community Participation', 'Hour', 'Service', true, true, 'pl-ndis-2024', '04_104_0125_6_1', 'Isla Robinson', 'SuperUser'),
  ('prod-transport', 'TRANS_KM', 'Transport per km', 'Provider travel — per kilometre', 'Transport', 'Each', 'Service', true, true, 'pl-ndis-2024', '04_590_0125_6_1', 'Isla Robinson', 'SuperUser')
on conflict (id) do update set
  search_key = excluded.search_key,
  name = excluded.name,
  description = excluded.description,
  product_category = excluded.product_category,
  uom = excluded.uom,
  product_type = excluded.product_type,
  active = excluded.active,
  sold = excluded.sold,
  price_list_id = excluded.price_list_id,
  ndis_support_item = excluded.ndis_support_item,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.price_list_line (id, price_list_id, line_no, product_id, list_price, standard_price, limit_price)
values
  ('pll-1', 'pl-ndis-2024', 1, 'prod-sil-wd', 98.5, 95, 110),
  ('pll-2', 'pl-ndis-2024', 2, 'prod-cp', 68, 65, 75),
  ('pll-3', 'pl-ndis-2024', 3, 'prod-transport', 1, 0.97, 1.1)
on conflict (id) do update set
  price_list_id = excluded.price_list_id,
  line_no = excluded.line_no,
  product_id = excluded.product_id,
  list_price = excluded.list_price,
  standard_price = excluded.standard_price,
  limit_price = excluded.limit_price;

insert into public.client (id, enquiry_id, search_key, business_partner_group, name, risk_alerts, consent_alert_list, first_name, preferred_name, last_name, middle_name, email, phone, status, birthday, is_estimated_age, gender, decision_making, lgbtiqa, living_arrangement, sales_representative, services, funding_body, funding_body_number, transitioned_to_pace, date_support_commencement, date_support_ceased, aboriginal_torres_strait_islander, cultural_affiliation, disability, additional_disability_information, created_by, updated_by)
values
  ('bp-bern', null, 'Bern', 'Support Receiver', 'Bernadette Rose', 'Allergy to peanuts', 'Consent-No photo consent provided', 'Bernadette', 'Bernie', 'Rose', '', 'Bernie@email', '', '2_Active receiving support', '1995-06-26', false, 'Female', 'Makes all decisions', '', 'Lives with Friends/Housemates', 'Isla Robinson', '', 'NDIS - National Disability Insurance Scheme', '', '2024-02-14', '2021-01-05', null, 'Neither', 'Australian', 'PD - Spinal Cord Injury', 'Acquired physical disabilities as a result of car accident in 2004. Bernie lost her right leg from the knee down and has a spinal cord injury limiting movement of her left leg. She is in a wheelchair.', 'Isla Robinson', 'SuperUser')
on conflict (id) do update set
  enquiry_id = excluded.enquiry_id,
  search_key = excluded.search_key,
  business_partner_group = excluded.business_partner_group,
  name = excluded.name,
  risk_alerts = excluded.risk_alerts,
  consent_alert_list = excluded.consent_alert_list,
  first_name = excluded.first_name,
  preferred_name = excluded.preferred_name,
  last_name = excluded.last_name,
  middle_name = excluded.middle_name,
  email = excluded.email,
  phone = excluded.phone,
  status = excluded.status,
  birthday = excluded.birthday,
  is_estimated_age = excluded.is_estimated_age,
  gender = excluded.gender,
  decision_making = excluded.decision_making,
  lgbtiqa = excluded.lgbtiqa,
  living_arrangement = excluded.living_arrangement,
  sales_representative = excluded.sales_representative,
  services = excluded.services,
  funding_body = excluded.funding_body,
  funding_body_number = excluded.funding_body_number,
  transitioned_to_pace = excluded.transitioned_to_pace,
  date_support_commencement = excluded.date_support_commencement,
  date_support_ceased = excluded.date_support_ceased,
  aboriginal_torres_strait_islander = excluded.aboriginal_torres_strait_islander,
  cultural_affiliation = excluded.cultural_affiliation,
  disability = excluded.disability,
  additional_disability_information = excluded.additional_disability_information,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.client_alert (id, client_id, line_no, alert_type, show_as_alert, name, description, valid_from, valid_to)
values
  ('a1', 'bp-bern', 1, 'Incident', 'No', 'Check with Management before contacting', 'Seek approval or guidance from superiors or higher-level management before initiating any communication or interaction.', '2022-05-01', '2024-09-10')
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  alert_type = excluded.alert_type,
  show_as_alert = excluded.show_as_alert,
  name = excluded.name,
  description = excluded.description,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to;

insert into public.client_consent (id, client_id, line_no, consent_type, show_as_alert, name, description, valid_from, valid_to)
values
  ('consent-photo', 'bp-bern', 1, 'Photo / video', 'Yes', 'No photo consent provided', 'Participant has not provided consent for photos or video to be taken or shared.', '2021-01-05', null)
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  consent_type = excluded.consent_type,
  show_as_alert = excluded.show_as_alert,
  name = excluded.name,
  description = excluded.description,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to;

insert into public.client_risk (id, client_id, line_no, risk_type, show_as_alert, name, description, valid_from, valid_to)
values
  ('risk-peanut', 'bp-bern', 1, 'Allergy', 'Yes', 'Allergy to peanuts', 'Anaphylaxis risk. EpiPen in kitchen drawer. Avoid all nut products.', '2021-01-05', null)
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  risk_type = excluded.risk_type,
  show_as_alert = excluded.show_as_alert,
  name = excluded.name,
  description = excluded.description,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to;

insert into public.client_bp_association (id, client_id, line_no, associated_bp_name, association_type, relationship, phone, mobile, email, primary_contact, valid_from, valid_to, notes)
values
  ('bpa-harry', 'bp-bern', 1, 'Harry', 'Family / friend', 'Friend', '', '0411 222 333', '', 'Yes', '2021-01-05', null, 'Best friend. Sunday lunch contact.')
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  associated_bp_name = excluded.associated_bp_name,
  association_type = excluded.association_type,
  relationship = excluded.relationship,
  phone = excluded.phone,
  mobile = excluded.mobile,
  email = excluded.email,
  primary_contact = excluded.primary_contact,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  notes = excluded.notes;

insert into public.client_contact_activity (id, client_id, line_no, activity_date, activity_type, contact_name, subject, description, created_by)
values
  ('cact-harry', 'bp-bern', 1, '2024-02-14', 'Phone call', 'Harry', 'PACE transition update', 'Confirmed Bernie was happy with plan changes discussed at lunch.', 'Isla Robinson')
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  activity_date = excluded.activity_date,
  activity_type = excluded.activity_type,
  contact_name = excluded.contact_name,
  subject = excluded.subject,
  description = excluded.description,
  created_by = excluded.created_by;

insert into public.client_support_receiver_need_rule (id, client_id, line_no, category, name, rule_text, show_as_alert, valid_from, valid_to)
values
  ('need-transfer', 'bp-bern', 1, 'Personal care', 'Shower transfer', 'Assist transfer to shower chair. Bernie washes independently then needs assistance back to wheelchair.', 'Yes', '2022-05-01', null)
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  category = excluded.category,
  name = excluded.name,
  rule_text = excluded.rule_text,
  show_as_alert = excluded.show_as_alert,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to;

insert into public.client_activity (id, client_id, line_no, activity_date, activity_type, subject, description, created_by)
values
  ('act1', 'bp-bern', 1, '2024-02-14', 'Phone call', 'PACE transition check-in', 'Confirmed NDIS plan details and updated funding body number.', 'Isla Robinson')
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  activity_date = excluded.activity_date,
  activity_type = excluded.activity_type,
  subject = excluded.subject,
  description = excluded.description,
  created_by = excluded.created_by;

insert into public.client_location (id, client_id, line_no, name, address_type, address1, address2, address3, city, state, postcode, country, phone, mobile, email, post_to_address, invoice_address, ship_to_address, service_delivery_address, active, valid_from, valid_to, access_notes, description)
values
  ('loc-home', 'bp-bern', 1, 'Home', 'Home', '12 Jetty Road', 'Unit 4', '', 'Glenelg', 'SA', '5045', 'Australia', '08 8294 1100', '0412 345 678', 'Bernie@email', 'No', 'Yes', 'Yes', 'Yes', 'Yes', '2021-01-05', null, 'Wheelchair access via ramp at rear. Level entry to kitchen and bathroom.', 'Primary residence — shared with housemates.'),
  ('loc-postal', 'bp-bern', 2, 'Postal', 'Postal', 'PO Box 842', '', '', 'Adelaide', 'SA', '5000', 'Australia', '', '', '', 'Yes', 'No', 'No', 'No', 'Yes', '2021-01-05', null, '', 'Mail and official correspondence.')
on conflict (id) do update set
  client_id = excluded.client_id,
  line_no = excluded.line_no,
  name = excluded.name,
  address_type = excluded.address_type,
  address1 = excluded.address1,
  address2 = excluded.address2,
  address3 = excluded.address3,
  city = excluded.city,
  state = excluded.state,
  postcode = excluded.postcode,
  country = excluded.country,
  phone = excluded.phone,
  mobile = excluded.mobile,
  email = excluded.email,
  post_to_address = excluded.post_to_address,
  invoice_address = excluded.invoice_address,
  ship_to_address = excluded.ship_to_address,
  service_delivery_address = excluded.service_delivery_address,
  active = excluded.active,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  access_notes = excluded.access_notes,
  description = excluded.description;

insert into public.service_agreement (id, search_key, name, description, client_id, price_list_id, term, status, execution_date, contract_date, finish_date, review_date, total_planned_amount, created_by, updated_by)
values
  ('sa-rose-ni', 'ROSE_Rose Ni', 'NDIS Service Agreement', 'High intensity supports — SIL and community participation', 'bp-bern', 'pl-ndis-2024', 'Fixed Term', 'Active', '2025-06-09', '2025-06-09', '2026-06-30', '2026-03-01', 12057.83, 'Isla Robinson', 'Isla Robinson')
on conflict (id) do update set
  search_key = excluded.search_key,
  name = excluded.name,
  description = excluded.description,
  client_id = excluded.client_id,
  price_list_id = excluded.price_list_id,
  term = excluded.term,
  status = excluded.status,
  execution_date = excluded.execution_date,
  contract_date = excluded.contract_date,
  finish_date = excluded.finish_date,
  review_date = excluded.review_date,
  total_planned_amount = excluded.total_planned_amount,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.service_agreement_line (id, service_agreement_id, line_no, product_id, name, description, planned_price, registration_group, funding_type, funding_body, funding_management_type, budget_rules)
values
  ('sal-1', 'sa-rose-ni', 10, 'prod-sil-wd', 'SIL', 'SIL', 10907.8, 'Supported Independent Living', 'Funding Body', 'NDIS - National Disability Insurance Scheme', 'Portal Managed', 'Strict Limit'),
  ('sal-2', 'sa-rose-ni', 20, 'prod-cp', 'Community Participation', 'Assistance with social and community participation', 450.03, 'Participation In Community And Social And Civic Activities', 'Funding Body', 'NDIS - National Disability Insurance Scheme', 'Portal Managed', 'Warning')
on conflict (id) do update set
  service_agreement_id = excluded.service_agreement_id,
  line_no = excluded.line_no,
  product_id = excluded.product_id,
  name = excluded.name,
  description = excluded.description,
  planned_price = excluded.planned_price,
  registration_group = excluded.registration_group,
  funding_type = excluded.funding_type,
  funding_body = excluded.funding_body,
  funding_management_type = excluded.funding_management_type,
  budget_rules = excluded.budget_rules;

insert into public.contract (id, document_no, client_id, business_partner_name, contract_type, name, description, contract_term, execution_date, start_date, end_date, review_date, reference, project, created_by, updated_by)
values
  ('ctr-1000001', '1000001', null, 'Adelaide Property Managers', 'Tenancy Agreeement', 'Rover Road Residential tenancy Agreement', 'Rover Road Residential tenancy Agreement - Demo File with DMS attachment', 'Fixed', '2022-05-07', '2022-05-08', '2025-05-07', '2024-05-25', 'ROVER-TEN-001', '', 'Isla Robinson', 'Jessica Hancock'),
  ('ctr-1000002', '1000002', 'bp-bern', 'Bernadette Rose', 'NDIS Service Agreement', 'NDIS Support Agreement - Bernadette Rose', 'Primary service agreement covering SIL, community access, and therapy supports.', 'Fixed', '2021-01-05', '2021-01-05', '2026-06-30', '2025-06-26', 'NDIS-PLAN-BERN', '', 'Isla Robinson', 'SuperUser')
on conflict (id) do update set
  document_no = excluded.document_no,
  client_id = excluded.client_id,
  business_partner_name = excluded.business_partner_name,
  contract_type = excluded.contract_type,
  name = excluded.name,
  description = excluded.description,
  contract_term = excluded.contract_term,
  execution_date = excluded.execution_date,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  review_date = excluded.review_date,
  reference = excluded.reference,
  project = excluded.project,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.contract_audit (id, contract_id, line_no, audit_date, changed_by, action, description)
values
  ('aud-1', 'ctr-1000001', 1, '2022-05-07', 'Isla Robinson', 'Created', 'Contract created'),
  ('aud-2', 'ctr-1000001', 2, '2024-05-25', 'Jessica Hancock', 'Reviewed', 'Annual tenancy review completed'),
  ('aud-b1', 'ctr-1000002', 1, '2021-01-05', 'Isla Robinson', 'Created', 'Linked to client Bernadette Rose'),
  ('aud-b2', 'ctr-1000002', 2, '2024-02-14', 'Isla Robinson', 'Updated', 'PACE transition dates updated')
on conflict (id) do update set
  contract_id = excluded.contract_id,
  line_no = excluded.line_no,
  audit_date = excluded.audit_date,
  changed_by = excluded.changed_by,
  action = excluded.action,
  description = excluded.description;

insert into public.support_plan (id, client_id, document_no, description, provided_to_receiver, execution_date, active, important_to_me, how_supported, hobbies, cultural_needs, likes, dislikes, about_other, primary_language, interpreter_required, communication_method, medication_required, medication_details, known_allergies, medical_history, behaviour_support_required, behaviour_description, strategies, relaxation, stress_cause, morning, daytime, afternoon, evening_night, weekly, activity_attendance, activity_details, personal_care, dressing, hair_care, menstrual_management, oral_hygiene, nail_care, shaving, sleeping, toilet_use, showering, personal_care_other, household_support_required, cooking, cleaning, gardening, laundry, make_bed, grocery, mobility_support_required, mobility_detail, eating_drinking_support, dietary_allergies, favourite_foods, disliked_foods, meal_other, transport_arrangements, financial_arrangement, financial_arrangement_details, created_by, updated_by)
values
  ('sp-1000020', 'bp-bern', '1000020', 'Active Support Plan — completed with Bernie, signed and provided copy to her. Most recently reviewed May 2022.', '2022-05-16', '2022-05-16', true, 'My dog Kobe and my best friend Harry.', 'I like to attempt to do things for myself and will request additional support if I need it.', 'Reading and writing', 'N/A', 'Dogs, beach, dog parks', 'Heights', '', 'English', 'No', '', 'No', '', 'Yes', 'Allergic to Hay, only mild and flares up asthma. Uses a puffer as required.', 'No', '', '', '', '', 'Wake up and brush my teeth, shower. Require support. See manual handling plan', 'Attend work', 'relax, play with my dog', 'cook dinner, watch tv', 'Lunch with Harry on Sundays', true, 'Work weekdays 9-5.', true, 'Assistance to get clothes from cupboard and dress me, I will tell you what I would like to wear', 'I manage this myself, sometimes I may request assistance if my arm is tired.', 'no support required', 'no support required', '', 'I can do this myself in the shower', '', 'Yes, transfer assistance required', 'Assistance to transfer to my shower chair from wheelchair, I wash myself then need assistance back to my wheelchair', '', false, '', '', '', '', '', '', 'Yes', 'Bernie is in a wheel chair and requires support to get in and out. Manual handling plan details requirements.', 'No', 'N/A', 'love cappuccino with almond milk and favourite snack is popcorn', 'Avoids Dairy by choice', '', 'Can catch public transport provided its wheelchair accessible.', 'Manages own finances', 'manages all financials directly.', 'Isla Robinson', 'Oliver Williams')
on conflict (id) do update set
  client_id = excluded.client_id,
  document_no = excluded.document_no,
  description = excluded.description,
  provided_to_receiver = excluded.provided_to_receiver,
  execution_date = excluded.execution_date,
  active = excluded.active,
  important_to_me = excluded.important_to_me,
  how_supported = excluded.how_supported,
  hobbies = excluded.hobbies,
  cultural_needs = excluded.cultural_needs,
  likes = excluded.likes,
  dislikes = excluded.dislikes,
  about_other = excluded.about_other,
  primary_language = excluded.primary_language,
  interpreter_required = excluded.interpreter_required,
  communication_method = excluded.communication_method,
  medication_required = excluded.medication_required,
  medication_details = excluded.medication_details,
  known_allergies = excluded.known_allergies,
  medical_history = excluded.medical_history,
  behaviour_support_required = excluded.behaviour_support_required,
  behaviour_description = excluded.behaviour_description,
  strategies = excluded.strategies,
  relaxation = excluded.relaxation,
  stress_cause = excluded.stress_cause,
  morning = excluded.morning,
  daytime = excluded.daytime,
  afternoon = excluded.afternoon,
  evening_night = excluded.evening_night,
  weekly = excluded.weekly,
  activity_attendance = excluded.activity_attendance,
  activity_details = excluded.activity_details,
  personal_care = excluded.personal_care,
  dressing = excluded.dressing,
  hair_care = excluded.hair_care,
  menstrual_management = excluded.menstrual_management,
  oral_hygiene = excluded.oral_hygiene,
  nail_care = excluded.nail_care,
  shaving = excluded.shaving,
  sleeping = excluded.sleeping,
  toilet_use = excluded.toilet_use,
  showering = excluded.showering,
  personal_care_other = excluded.personal_care_other,
  household_support_required = excluded.household_support_required,
  cooking = excluded.cooking,
  cleaning = excluded.cleaning,
  gardening = excluded.gardening,
  laundry = excluded.laundry,
  make_bed = excluded.make_bed,
  grocery = excluded.grocery,
  mobility_support_required = excluded.mobility_support_required,
  mobility_detail = excluded.mobility_detail,
  eating_drinking_support = excluded.eating_drinking_support,
  dietary_allergies = excluded.dietary_allergies,
  favourite_foods = excluded.favourite_foods,
  disliked_foods = excluded.disliked_foods,
  meal_other = excluded.meal_other,
  transport_arrangements = excluded.transport_arrangements,
  financial_arrangement = excluded.financial_arrangement,
  financial_arrangement_details = excluded.financial_arrangement_details,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.support_plan_goal (id, support_plan_id, line_no, name, goal_number, goal_term, goal_type, goal, support_required, start_date, end_date)
values
  ('goal-1', 'sp-1000020', 1, 'Independently transfer from wheelchair to shower chair', '1-One', 'Medium/Long Term Goal', 'NDIS Goal', 'Independently transfer from wheelchair to shower chair', 'Assist Bernie build upper arm strength and get work with her OT on how to safely transition and build strength.', '2022-06-01', '2024-12-31'),
  ('goal-2', 'sp-1000020', 2, 'Catch the bus', '2-Two', 'Medium/Long Term Goal', 'NDIS Goal', 'Build courage to catch the bus', 'Take steps to get familiar with catching a bus and gradually build confidence.', '2022-06-01', '2024-12-31'),
  ('goal-3', 'sp-1000020', 3, 'New wheelchair', '3-Three', 'Short Term Goal', 'NDIS Goal', 'Get a new wheelchair', 'Ensure Bernie can have her OT appointments and review options.', '2022-06-01', '2024-12-31')
on conflict (id) do update set
  support_plan_id = excluded.support_plan_id,
  line_no = excluded.line_no,
  name = excluded.name,
  goal_number = excluded.goal_number,
  goal_term = excluded.goal_term,
  goal_type = excluded.goal_type,
  goal = excluded.goal,
  support_required = excluded.support_required,
  start_date = excluded.start_date,
  end_date = excluded.end_date;

insert into public.support_plan_goal_progress_review (id, goal_id, line_no, progress_review_type, review_date, goal_progress, progress_taken, receiver_feeling, next_steps, created_by, updated_by)
values
  ('pr-goal-1', 'goal-1', 1, 'Progress Review', '2023-04-01', 'Some Progress', 'Bernie is building upper arm strength with OT sessions fortnightly.', 'Feels encouraged and wants to keep working on transfers.', 'Continue OT and review manual handling plan in June.', 'Isla Robinson', 'Isla Robinson')
on conflict (id) do update set
  goal_id = excluded.goal_id,
  line_no = excluded.line_no,
  progress_review_type = excluded.progress_review_type,
  review_date = excluded.review_date,
  goal_progress = excluded.goal_progress,
  progress_taken = excluded.progress_taken,
  receiver_feeling = excluded.receiver_feeling,
  next_steps = excluded.next_steps,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by;

insert into public.plan_assessment_document (id, client_id, document_no, document_type, plan_type, assessment_type, review_date, date_received, document_status, document_developer, support_plan_id)
values
  ('pad-1000058', 'bp-bern', '1000058', 'Plan', 'Support Plan', '', '2023-04-01', null, 'Published', 'Rose Dash', 'sp-1000020')
on conflict (id) do update set
  client_id = excluded.client_id,
  document_no = excluded.document_no,
  document_type = excluded.document_type,
  plan_type = excluded.plan_type,
  assessment_type = excluded.assessment_type,
  review_date = excluded.review_date,
  date_received = excluded.date_received,
  document_status = excluded.document_status,
  document_developer = excluded.document_developer,
  support_plan_id = excluded.support_plan_id;
