-- Demo care plan data for Bernadette Rose (bp-bern / sp-1000020)

update public.support_plan
set
  my_story = 'Acquired physical disabilities as a result of car accident in 2004. Bernie lost her right leg from the knee down and has a spinal cord injury limiting movement of her left leg. She is in a wheelchair.',
  important_for_me = 'Staying safe at home, maintaining friendships, and building independence with transfers.',
  religious_requirements = 'N/A',
  family_information = 'Close friend Harry — Sunday lunch contact.',
  pets = 'Dog named Kobe',
  strengths = 'Determined, friendly, good sense of humour',
  skills = 'Reading, writing, cooking with support',
  aspirations = 'Independent transfers, catching the bus, new wheelchair',
  verbal_communication_level = 'Fully verbal',
  non_verbal_communication = 'Uses gestures when tired',
  communication_method = 'Clear verbal communication; prefers direct questions',
  communication_aids = '',
  communication_triggers = 'Rushed instructions; being spoken over',
  calming_strategies = 'Quiet space, time to process, familiar routines',
  worker_guidance = 'Allow time to respond. Confirm understanding before starting tasks.',
  behaviour_practitioner = '',
  behaviour_authorisations = '',
  emergency_medical_procedure = 'Call 000 for medical emergency. Asthma puffer in kitchen drawer.',
  emergency_missing_person_procedure = 'Contact Harry (0411 222 333) and management immediately.',
  emergency_behavioural_crisis_procedure = 'N/A — no behaviour support plan',
  emergency_fire_evacuation_procedure = 'Evacuate via rear ramp. Assembly point at front of building.',
  what_works_best = 'Attempt tasks independently first; offer help when asked.',
  worker_approaches = 'Patient, respectful, explain each step before physical support.',
  environmental_considerations = 'Wheelchair access via rear ramp. Level entry to kitchen and bathroom.',
  avoid_list = 'Heights, dairy products by choice',
  unsafe_practices = 'Do not rush transfers; follow manual handling plan.',
  shift_arrival_process = 'Knock, greet Bernie, check dog is secure before transfers.',
  shift_departure_process = 'Confirm evening routine complete; note any changes in progress review.',
  documentation_requirements = 'Record progress on goals and any incident or near miss.'
where id = 'sp-1000020';

update public.support_plan_goal
set ndis_category = 'Daily living', why_it_matters = 'Independence and dignity in personal care', success_measures = 'Safe transfer with minimal assistance; OT sign-off'
where id = 'goal-1';

update public.support_plan_goal
set ndis_category = 'Social and community participation', why_it_matters = 'Community access and independence', success_measures = 'Uses accessible bus route independently once per week'
where id = 'goal-2';

update public.support_plan_goal
set ndis_category = 'Assistive technology', why_it_matters = 'Mobility, posture, and daily function', success_measures = 'New wheelchair prescribed, funded, and delivered'
where id = 'goal-3';

update public.client_risk
set
  likelihood = 'Medium',
  consequence = 'Critical',
  controls = 'No nuts on site. Check food labels. EpiPen accessible in kitchen drawer.',
  emergency_response = 'Administer EpiPen if prescribed and call 000 immediately.',
  escalation_process = 'Notify management and document incident within 24 hours.',
  review_date = '2026-01-05'
where id = 'risk-peanut';

delete from public.support_plan_medication where support_plan_id = 'sp-1000020';
delete from public.support_plan_diagnosis where support_plan_id = 'sp-1000020';
delete from public.support_plan_health_plan where support_plan_id = 'sp-1000020';
delete from public.support_plan_support_requirement where support_plan_id = 'sp-1000020';
delete from public.support_plan_assistive_technology where support_plan_id = 'sp-1000020';

insert into public.support_plan_medication (id, support_plan_id, line_no, medication_name, dosage, purpose, administration_requirements)
values
  ('med-bern-1', 'sp-1000020', 1, 'Salbutamol puffer', '2 puffs as required', 'Asthma / hay allergy', 'Stored in kitchen drawer. Support worker to remind if wheezing.');

insert into public.support_plan_diagnosis (id, support_plan_id, line_no, diagnosis, condition, treating_practitioner, impact_on_daily_living)
values
  ('dx-bern-1', 'sp-1000020', 1, 'Spinal cord injury', 'Limited left leg movement; wheelchair user', 'GP — Dr Adams', 'Requires transfer assistance for shower and toilet.'),
  ('dx-bern-2', 'sp-1000020', 2, 'Hay allergy / mild asthma', 'Seasonal', 'GP — Dr Adams', 'Avoid hay exposure; puffer as required.');

insert into public.support_plan_health_plan (id, support_plan_id, line_no, plan_type, attachment_reference, notes)
values
  ('hp-bern-1', 'sp-1000020', 1, 'Medication plan', 'Manual handling plan on file', 'See OT manual handling plan for transfers.');

insert into public.support_plan_support_requirement (id, support_plan_id, line_no, support_area, support_requirement, level_of_assistance, frequency, special_instructions)
values
  ('req-bern-1', 'sp-1000020', 1, 'Personal care — showering', 'Transfer to shower chair and back', 'Partial assistance', 'Daily', 'Follow manual handling plan. Bernie washes herself.'),
  ('req-bern-2', 'sp-1000020', 2, 'Personal care — dressing', 'Clothes from cupboard and dressing', 'Partial assistance', 'Daily', 'Bernie chooses outfit.'),
  ('req-bern-3', 'sp-1000020', 3, 'Community access — transport', 'Wheelchair-accessible public transport', 'Prompting', 'As needed', 'Build confidence gradually for bus travel goal.');

insert into public.support_plan_assistive_technology (id, support_plan_id, line_no, equipment, serial_number, maintenance_schedule, training_required)
values
  ('at-bern-1', 'sp-1000020', 1, 'Wheelchair', 'WC-2019-4421', 'Annual service with OT', 'Manual handling plan training for all workers');
