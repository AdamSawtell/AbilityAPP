-- Reference data seed (generated from web/src/lib/reference-data.ts)
-- Re-run: node scripts/generate-reference-seed.mjs

insert into public.reference_list (key, label, "group", description, sort_order)
values
  ('yesNo', 'Yes / No', 'Shared', 'Used across clients, employees, locations, and plans', 0),
  ('showAsAlert', 'Show as alert', 'Shared', 'Yes / No on alert lines', 1),
  ('gender', 'Gender', 'Shared', 'Clients, enquiries, and employees', 2),
  ('fundingBody', 'Funding body', 'Shared', 'Clients and enquiries', 3),
  ('disability', 'Disability', 'Shared', 'Clients and enquiries', 4),
  ('addressType', 'Address type', 'Shared', 'Client, employee, and location addresses', 5),
  ('australianState', 'State / territory', 'Shared', null, 6),
  ('country', 'Country', 'Shared', null, 7),
  ('primaryLanguage', 'Primary language', 'Shared', 'Support plans and profiles', 8),
  ('contactRelationship', 'Contact relationship', 'Shared', 'Client contacts and employee emergency contacts', 9),
  ('clientStatus', 'Client status', 'Client', null, 10),
  ('decisionMaking', 'Decision making', 'Client', null, 11),
  ('livingArrangement', 'Living arrangement', 'Client', null, 12),
  ('salesRepresentative', 'Sales representative', 'Client', null, 13),
  ('aboriginalTorresStraitIslander', 'Aboriginal / Torres Strait Islander', 'Client', null, 14),
  ('culturalAffiliation', 'Cultural affiliation', 'Client', null, 15),
  ('businessPartnerGroup', 'Business partner group', 'Client', null, 16),
  ('lgbtiqa', 'LGBTIQA+', 'Client', null, 17),
  ('alertType', 'Alert type', 'Client', null, 18),
  ('restrictivePracticeType', 'Restrictive practice type', 'Client', null, 19),
  ('consentType', 'Consent type', 'Client', null, 20),
  ('riskType', 'Risk type', 'Client', null, 21),
  ('bpAssociationType', 'BP association type', 'Client', null, 22),
  ('contactActivityType', 'Contact activity type', 'Client', null, 23),
  ('needRuleCategory', 'Need / rule category', 'Client', null, 24),
  ('activityType', 'Activity type', 'Client', null, 25),
  ('enquiryStatus', 'Enquiry status', 'Enquiry', null, 26),
  ('enquirySource', 'Enquiry source', 'Enquiry', null, 27),
  ('isEnquiryForSelf', 'Is enquiry for self', 'Enquiry', null, 28),
  ('thirdPartyConsent', '3rd party consent', 'Enquiry', null, 29),
  ('relationshipType', 'Relationship type', 'Enquiry', null, 30),
  ('preferredCommunicationMethod', 'Preferred communication method', 'Enquiry', null, 31),
  ('enquiryQuery', 'Enquiry saved queries', 'Enquiry', 'List filters', 32),
  ('financialArrangement', 'Financial arrangement', 'Support plan', null, 33),
  ('goalNumber', 'Goal number', 'Support plan', null, 34),
  ('goalTerm', 'Goal term', 'Support plan', null, 35),
  ('goalType', 'Goal type', 'Support plan', null, 36),
  ('documentType', 'Plan document type', 'Support plan', null, 37),
  ('planType', 'Plan type', 'Support plan', null, 38),
  ('documentStatus', 'Document status', 'Support plan', null, 39),
  ('assessmentType', 'Assessment type', 'Support plan', null, 40),
  ('progressReviewType', 'Progress review type', 'Support plan', null, 41),
  ('goalProgress', 'Goal progress', 'Support plan', null, 42),
  ('employeeAlertType', 'Employee alert type', 'People', null, 43),
  ('employeeSkillType', 'Employee skill type', 'People', null, 44),
  ('skillProficiency', 'Skill proficiency', 'People', null, 45),
  ('employeeDocumentType', 'Employee document type', 'People', null, 46),
  ('employeeActivityType', 'Employee activity type', 'People', null, 47),
  ('employeeDocumentStatus', 'Employee document status', 'People', null, 48),
  ('emergencyContactType', 'Emergency contact type', 'People', null, 49),
  ('employmentType', 'Employment type', 'People', null, 50),
  ('payMethod', 'Pay method', 'People', null, 51),
  ('credentialType', 'Credential type', 'People', null, 52),
  ('credentialStatus', 'Credential status', 'People', null, 53),
  ('department', 'Department', 'People', null, 54),
  ('employmentStatus', 'Employment status', 'People', null, 55),
  ('taskPriority', 'Task priority', 'Tasks', 'Low, Normal, High — used on tasks and automations', 56),
  ('leaveType', 'Leave type', 'Workforce', null, 57),
  ('employeeLeaveStatus', 'Leave request status', 'Workforce', null, 58),
  ('locationType', 'Location type', 'Locations', null, 59),
  ('locationStatus', 'Location status', 'Locations', null, 60),
  ('locationClientRole', 'Client assignment role', 'Locations', null, 61),
  ('locationEmployeeRole', 'Employee assignment role', 'Locations', null, 62),
  ('locationAlertType', 'Location alert type', 'Locations', null, 63),
  ('locationActivityType', 'Location activity type', 'Locations', null, 64),
  ('productCategory', 'Product category', 'Products & services', null, 65),
  ('uom', 'Unit of measure', 'Products & services', null, 66),
  ('productType', 'Product type', 'Products & services', null, 67),
  ('serviceAgreementTerm', 'Service agreement term', 'Products & services', null, 68),
  ('serviceAgreementStatus', 'Service agreement status', 'Products & services', null, 69),
  ('fundingType', 'Funding type', 'Products & services', null, 70),
  ('fundingManagementType', 'Funding management type', 'Products & services', null, 71),
  ('budgetRules', 'Budget rules', 'Products & services', null, 72),
  ('registrationGroup', 'NDIS registration group', 'Products & services', null, 73),
  ('claimType', 'Claim type', 'Products & services', null, 74),
  ('contractType', 'Contract type', 'Contracts', null, 75),
  ('contractTerm', 'Contract term', 'Contracts', null, 76),
  ('auditAction', 'Audit action', 'Contracts', null, 77),
  ('partyType', 'Party type', 'Incident reports', null, 78),
  ('partyRole', 'Party role', 'Incident reports', null, 79),
  ('incidentActionType', 'Incident action type', 'Incident reports', null, 80),
  ('notificationTarget', 'Notification target', 'Incident reports', null, 81),
  ('notificationMethod', 'Notification method', 'Incident reports', null, 82),
  ('incidentStatus', 'Incident status', 'Incident reports', null, 83),
  ('incidentSeverity', 'Incident severity', 'Incident reports', null, 84),
  ('ndisReportableType', 'NDIS reportable type', 'Incident reports', null, 85),
  ('incidentCategory', 'Incident category', 'Incident reports', null, 86),
  ('incidentServiceType', 'Incident service type', 'Incident reports', null, 87)
on conflict (key) do update set
  label = excluded.label,
  "group" = excluded."group",
  description = excluded.description,
  sort_order = excluded.sort_order;

-- clientStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('1_Prospect', '1_Prospect', 0),
  ('2_Active receiving support', '2_Active receiving support', 1),
  ('3_Active with additional service request', '3_Active with additional service request', 2),
  ('4_Actively exiting', '4_Actively exiting', 3),
  ('5_Inactive', '5_Inactive', 4),
  ('6_Deceased', '6_Deceased', 5)
) as v(value, label, sort_order)
where l.key = 'clientStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- gender
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Female', 'Female', 0),
  ('Male', 'Male', 1),
  ('Non-binary', 'Non-binary', 2),
  ('Prefer not to say', 'Prefer not to say', 3),
  ('Other', 'Other', 4)
) as v(value, label, sort_order)
where l.key = 'gender'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- decisionMaking
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Legal order in place appointing guardian/decision maker', 'Legal order in place appointing guardian/decision maker', 0),
  ('Makes all decisions', 'Makes all decisions', 1),
  ('Supported to make decisions', 'Supported to make decisions', 2)
) as v(value, label, sort_order)
where l.key = 'decisionMaking'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- livingArrangement
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Lives Alone', 'Lives Alone', 0),
  ('Lives with Family', 'Lives with Family', 1),
  ('Lives with Friends/Housemates', 'Lives with Friends/Housemates', 2)
) as v(value, label, sort_order)
where l.key = 'livingArrangement'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- salesRepresentative
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('AbilityAPP', 'AbilityAPP', 0),
  ('Gabriela Wilson', 'Gabriela Wilson', 1),
  ('Isla Robinson', 'Isla Robinson', 2),
  ('Michael Smith', 'Michael Smith', 3),
  ('Oliver Williams', 'Oliver Williams', 4),
  ('Rose Dash', 'Rose Dash', 5)
) as v(value, label, sort_order)
where l.key = 'salesRepresentative'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- fundingBody
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Commonwealth Home Support Programme (CHSP)', 'Commonwealth Home Support Programme (CHSP)', 0),
  ('DSOA - Disability Support for Older Australians', 'DSOA - Disability Support for Older Australians', 1),
  ('NDIS - National Disability Insurance Scheme', 'NDIS - National Disability Insurance Scheme', 2),
  ('RTWSA - Return to Work SA', 'RTWSA - Return to Work SA', 3),
  ('Self-funded', 'Self-funded', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'fundingBody'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- aboriginalTorresStraitIslander
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Aboriginal', 'Aboriginal', 0),
  ('Aboriginal and Torres Straight Islander', 'Aboriginal and Torres Straight Islander', 1),
  ('Neither', 'Neither', 2),
  ('Torres Straight Islander', 'Torres Straight Islander', 3)
) as v(value, label, sort_order)
where l.key = 'aboriginalTorresStraitIslander'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- culturalAffiliation
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Australian', 'Australian', 0),
  ('Australian Aboriginal', 'Australian Aboriginal', 1),
  ('Australian South Sea Islander', 'Australian South Sea Islander', 2),
  ('Cook Islander', 'Cook Islander', 3),
  ('Fijian', 'Fijian', 4),
  ('Hawaiian', 'Hawaiian', 5),
  ('I-Kiribati', 'I-Kiribati', 6),
  ('Maori', 'Maori', 7),
  ('Melanesian and Papuan, nec', 'Melanesian and Papuan, nec', 8),
  ('Micronesian, nec', 'Micronesian, nec', 9),
  ('Nauruan', 'Nauruan', 10),
  ('New Caledonian', 'New Caledonian', 11),
  ('New Zealander', 'New Zealander', 12),
  ('Ni-Vanuatu', 'Ni-Vanuatu', 13),
  ('Niuean', 'Niuean', 14),
  ('Norfolk Islander', 'Norfolk Islander', 15),
  ('Papua New Guinean', 'Papua New Guinean', 16),
  ('Pitcairn', 'Pitcairn', 17),
  ('Polynesian, nec', 'Polynesian, nec', 18),
  ('Samoan', 'Samoan', 19),
  ('Solomon Islander', 'Solomon Islander', 20),
  ('Tahitian', 'Tahitian', 21),
  ('Tokelauan', 'Tokelauan', 22),
  ('Tongan', 'Tongan', 23),
  ('Torres Strait Islander', 'Torres Strait Islander', 24),
  ('Tuvaluan', 'Tuvaluan', 25),
  ('Other', 'Other', 26)
) as v(value, label, sort_order)
where l.key = 'culturalAffiliation'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- disability
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('PD - Spinal Cord Injury', 'PD - Spinal Cord Injury', 0),
  ('PD - Acquired Brain Injury', 'PD - Acquired Brain Injury', 1),
  ('PD - Multiple Sclerosis', 'PD - Multiple Sclerosis', 2),
  ('PD - Stroke', 'PD - Stroke', 3),
  ('PD - Absent Limb or Reduced Limb Function', 'PD - Absent Limb or Reduced Limb Function', 4),
  ('PD - Paraplegia', 'PD - Paraplegia', 5),
  ('SD - Hearing Impairment', 'SD - Hearing Impairment', 6),
  ('ID - Autism', 'ID - Autism', 7),
  ('ID - Down Syndrome', 'ID - Down Syndrome', 8),
  ('ID - Developmental Delay', 'ID - Developmental Delay', 9),
  ('PSD - Bipolar Disorder', 'PSD - Bipolar Disorder', 10)
) as v(value, label, sort_order)
where l.key = 'disability'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- businessPartnerGroup
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Support Receiver', 'Support Receiver', 0),
  ('Support Provider', 'Support Provider', 1),
  ('Referrer', 'Referrer', 2),
  ('Other', 'Other', 3)
) as v(value, label, sort_order)
where l.key = 'businessPartnerGroup'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- lgbtiqa
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Yes', 'Yes', 0),
  ('No', 'No', 1),
  ('Prefer not to say', 'Prefer not to say', 2)
) as v(value, label, sort_order)
where l.key = 'lgbtiqa'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- alertType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Allergy', 'Allergy', 0),
  ('Choking Risk', 'Choking Risk', 1),
  ('Incident', 'Incident', 2),
  ('Legal', 'Legal', 3),
  ('Other', 'Other', 4),
  ('Temporary Alert', 'Temporary Alert', 5)
) as v(value, label, sort_order)
where l.key = 'alertType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- restrictivePracticeType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Chemical restraint', 'Chemical restraint', 0),
  ('Environmental restraint', 'Environmental restraint', 1),
  ('Mechanical restraint', 'Mechanical restraint', 2),
  ('Physical restraint', 'Physical restraint', 3),
  ('Seclusion', 'Seclusion', 4)
) as v(value, label, sort_order)
where l.key = 'restrictivePracticeType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- consentType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Photo / video', 'Photo / video', 0),
  ('Information sharing', 'Information sharing', 1),
  ('Medical treatment', 'Medical treatment', 2),
  ('Legal order / guardian', 'Legal order / guardian', 3),
  ('NDIS plan sharing', 'NDIS plan sharing', 4),
  ('Transport', 'Transport', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'consentType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- riskType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Allergy', 'Allergy', 0),
  ('Choking', 'Choking', 1),
  ('Falls', 'Falls', 2),
  ('Behaviour', 'Behaviour', 3),
  ('Medical', 'Medical', 4),
  ('Environmental', 'Environmental', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'riskType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- bpAssociationType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Family / friend', 'Family / friend', 0),
  ('Guardian', 'Guardian', 1),
  ('Support coordinator', 'Support coordinator', 2),
  ('Referrer', 'Referrer', 3),
  ('Health provider', 'Health provider', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'bpAssociationType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- contactActivityType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Phone call', 'Phone call', 0),
  ('Email', 'Email', 1),
  ('Meeting', 'Meeting', 2),
  ('Visit', 'Visit', 3),
  ('Note', 'Note', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'contactActivityType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- needRuleCategory
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Personal care', 'Personal care', 0),
  ('Meals', 'Meals', 1),
  ('Mobility', 'Mobility', 2),
  ('Communication', 'Communication', 3),
  ('Behaviour', 'Behaviour', 4),
  ('Household', 'Household', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'needRuleCategory'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- showAsAlert
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('No', 'No', 0),
  ('Yes', 'Yes', 1)
) as v(value, label, sort_order)
where l.key = 'showAsAlert'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- activityType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Note', 'Note', 0),
  ('Phone call', 'Phone call', 1),
  ('Email', 'Email', 2),
  ('Meeting', 'Meeting', 3),
  ('Visit', 'Visit', 4),
  ('Incident', 'Incident', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'activityType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- addressType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Home', 'Home', 0),
  ('Postal', 'Postal', 1),
  ('SIL residence', 'SIL residence', 2),
  ('Work', 'Work', 3),
  ('Temporary accommodation', 'Temporary accommodation', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'addressType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- australianState
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('SA', 'SA', 0),
  ('NSW', 'NSW', 1),
  ('VIC', 'VIC', 2),
  ('QLD', 'QLD', 3),
  ('WA', 'WA', 4),
  ('TAS', 'TAS', 5),
  ('NT', 'NT', 6),
  ('ACT', 'ACT', 7)
) as v(value, label, sort_order)
where l.key = 'australianState'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- country
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Australia', 'Australia', 0),
  ('New Zealand', 'New Zealand', 1)
) as v(value, label, sort_order)
where l.key = 'country'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- enquiryStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('1_Initial Enquiry', '1_Initial Enquiry', 0),
  ('2_To be processed', '2_To be processed', 1),
  ('3_In progress', '3_In progress', 2),
  ('4_Converted', '4_Converted', 3),
  ('5_Closed', '5_Closed', 4)
) as v(value, label, sort_order)
where l.key = 'enquiryStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- enquirySource
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Phone Call', 'Phone Call', 0),
  ('Email', 'Email', 1),
  ('Website', 'Website', 2),
  ('Referral', 'Referral', 3),
  ('Walk-in', 'Walk-in', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'enquirySource'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- isEnquiryForSelf
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Yes', 'Yes', 0),
  ('No', 'No', 1)
) as v(value, label, sort_order)
where l.key = 'isEnquiryForSelf'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- thirdPartyConsent
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Received', 'Received', 0),
  ('Requested', 'Requested', 1),
  ('ReceivedRequested', 'ReceivedRequested', 2),
  ('Not required', 'Not required', 3)
) as v(value, label, sort_order)
where l.key = 'thirdPartyConsent'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- relationshipType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Parent', 'Parent', 0),
  ('Guardian', 'Guardian', 1),
  ('Carer', 'Carer', 2),
  ('Support coordinator', 'Support coordinator', 3),
  ('Other', 'Other', 4)
) as v(value, label, sort_order)
where l.key = 'relationshipType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- preferredCommunicationMethod
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Email', 'Email', 0),
  ('Phone Call', 'Phone Call', 1),
  ('SMS', 'SMS', 2)
) as v(value, label, sort_order)
where l.key = 'preferredCommunicationMethod'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- enquiryQuery
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Open Enquiries', 'Open Enquiries', 0),
  ('Closed Enquiries', 'Closed Enquiries', 1)
) as v(value, label, sort_order)
where l.key = 'enquiryQuery'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- yesNo
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('No', 'No', 0),
  ('Yes', 'Yes', 1)
) as v(value, label, sort_order)
where l.key = 'yesNo'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- primaryLanguage
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('English', 'English', 0),
  ('Auslan', 'Auslan', 1),
  ('Arabic', 'Arabic', 2),
  ('Cantonese', 'Cantonese', 3),
  ('Mandarin', 'Mandarin', 4),
  ('Vietnamese', 'Vietnamese', 5),
  ('Hindi', 'Hindi', 6),
  ('Greek', 'Greek', 7),
  ('Italian', 'Italian', 8),
  ('Other', 'Other', 9)
) as v(value, label, sort_order)
where l.key = 'primaryLanguage'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- financialArrangement
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Manages own finances', 'Manages own finances', 0),
  ('Plan managed', 'Plan managed', 1),
  ('Nominee manages finances', 'Nominee manages finances', 2),
  ('NDIA manages', 'NDIA manages', 3)
) as v(value, label, sort_order)
where l.key = 'financialArrangement'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- goalNumber
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('1-One', '1-One', 0),
  ('2-Two', '2-Two', 1),
  ('3-Three', '3-Three', 2),
  ('4-Four', '4-Four', 3),
  ('5-Five', '5-Five', 4),
  ('6-Six', '6-Six', 5),
  ('7-Seven', '7-Seven', 6),
  ('8-Eight', '8-Eight', 7),
  ('9-Nine', '9-Nine', 8),
  ('10-Ten', '10-Ten', 9)
) as v(value, label, sort_order)
where l.key = 'goalNumber'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- goalTerm
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Short Term Goal', 'Short Term Goal', 0),
  ('Medium/Long Term Goal', 'Medium/Long Term Goal', 1)
) as v(value, label, sort_order)
where l.key = 'goalTerm'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- goalType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('NDIS Goal', 'NDIS Goal', 0),
  ('Personal Goal', 'Personal Goal', 1)
) as v(value, label, sort_order)
where l.key = 'goalType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- documentType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Plan', 'Plan', 0),
  ('Assessment', 'Assessment', 1)
) as v(value, label, sort_order)
where l.key = 'documentType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- planType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Support Plan', 'Support Plan', 0),
  ('Care Plan', 'Care Plan', 1),
  ('NDIS Plan', 'NDIS Plan', 2)
) as v(value, label, sort_order)
where l.key = 'planType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- documentStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Draft', 'Draft', 0),
  ('In Progress', 'In Progress', 1),
  ('Published', 'Published', 2),
  ('Archived', 'Archived', 3)
) as v(value, label, sort_order)
where l.key = 'documentStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- assessmentType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Comprehensive Aged Care Assessment (ACAT)', 'Comprehensive Aged Care Assessment (ACAT)', 0),
  ('Functional Capacity Assessment', 'Functional Capacity Assessment', 1),
  ('Health Assessments', 'Health Assessments', 2),
  ('Low-level Age Care assessment (RAS)', 'Low-level Age Care assessment (RAS)', 3),
  ('Pedi-CAT Assessment', 'Pedi-CAT Assessment', 4),
  ('Risk Assessment', 'Risk Assessment', 5),
  ('Risk Assessment - Restrictive Practice', 'Risk Assessment - Restrictive Practice', 6),
  ('Social Assessments', 'Social Assessments', 7)
) as v(value, label, sort_order)
where l.key = 'assessmentType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- progressReviewType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Progress Review', 'Progress Review', 0),
  ('Final Goal Review', 'Final Goal Review', 1),
  ('Self-assessment Review', 'Self-assessment Review', 2)
) as v(value, label, sort_order)
where l.key = 'progressReviewType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- goalProgress
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('No Progress', 'No Progress', 0),
  ('Some Progress', 'Some Progress', 1),
  ('Almost Achieved', 'Almost Achieved', 2),
  ('Achieved', 'Achieved', 3)
) as v(value, label, sort_order)
where l.key = 'goalProgress'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- productCategory
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Asistance with Self Care Activities', 'Asistance with Self Care Activities', 0),
  ('Capacity Building Community, Social and Civic Activities', 'Capacity Building Community, Social and Civic Activities', 1),
  ('Group and Centre Based Activities', 'Group and Centre Based Activities', 2),
  ('Short Term Accommodation', 'Short Term Accommodation', 3),
  ('Supported Independent Living', 'Supported Independent Living', 4),
  ('Support Coordination', 'Support Coordination', 5),
  ('Therapy', 'Therapy', 6),
  ('Transport', 'Transport', 7),
  ('Administration', 'Administration', 8)
) as v(value, label, sort_order)
where l.key = 'productCategory'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- uom
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Hour', 'Hour', 0),
  ('Each', 'Each', 1),
  ('Day', 'Day', 2),
  ('Week', 'Week', 3),
  ('Month', 'Month', 4),
  ('Km', 'Km', 5),
  ('Minutes', 'Minutes', 6),
  ('Work Day', 'Work Day', 7),
  ('Working Month', 'Working Month', 8),
  ('Year', 'Year', 9)
) as v(value, label, sort_order)
where l.key = 'uom'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- productType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Service', 'Service', 0),
  ('Item', 'Item', 1),
  ('Resource', 'Resource', 2),
  ('Asset', 'Asset', 3)
) as v(value, label, sort_order)
where l.key = 'productType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- serviceAgreementTerm
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Fixed Term', 'Fixed Term', 0),
  ('Ongoing', 'Ongoing', 1)
) as v(value, label, sort_order)
where l.key = 'serviceAgreementTerm'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- serviceAgreementStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Draft', 'Draft', 0),
  ('Active', 'Active', 1),
  ('Completed', 'Completed', 2),
  ('Cancelled', 'Cancelled', 3)
) as v(value, label, sort_order)
where l.key = 'serviceAgreementStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- fundingType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Funding Body', 'Funding Body', 0),
  ('Self Funded', 'Self Funded', 1)
) as v(value, label, sort_order)
where l.key = 'fundingType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- fundingManagementType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Portal Managed', 'Portal Managed', 0),
  ('Plan Managed', 'Plan Managed', 1),
  ('Self Managed', 'Self Managed', 2)
) as v(value, label, sort_order)
where l.key = 'fundingManagementType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- budgetRules
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Strict Limit', 'Strict Limit', 0),
  ('Warning', 'Warning', 1),
  ('Allow over budget', 'Allow over budget', 2)
) as v(value, label, sort_order)
where l.key = 'budgetRules'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- registrationGroup
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Assistance Animals', 'Assistance Animals', 0),
  ('Assistance In Coordinating Or Managing Life Stages And Trans', 'Assistance In Coordinating Or Managing Life Stages And Trans', 1),
  ('Assistance With Daily Life Tasks In A Group Or Shared Living', 'Assistance With Daily Life Tasks In A Group Or Shared Living', 2),
  ('Assistance With Travel/Transport Arrangements', 'Assistance With Travel/Transport Arrangements', 3),
  ('Assistance to Access and Maintain Employment or higher educa', 'Assistance to Access and Maintain Employment or higher educa', 4),
  ('Assistive Equipment For Recreation', 'Assistive Equipment For Recreation', 5),
  ('Assistive Products For Household Tasks', 'Assistive Products For Household Tasks', 6),
  ('Assistive Products For Personal Care And Safety', 'Assistive Products For Personal Care And Safety', 7),
  ('Communication And Information Equipment', 'Communication And Information Equipment', 8),
  ('Community Nursing Care', 'Community Nursing Care', 9),
  ('Customised Prosthetics (includes Orthotics)', 'Customised Prosthetics (includes Orthotics)', 10),
  ('Daily Personal Activities', 'Daily Personal Activities', 11),
  ('Development Of Daily Living And Life Skills', 'Development Of Daily Living And Life Skills', 12),
  ('Early Intervention Supports For Early Childhood', 'Early Intervention Supports For Early Childhood', 13),
  ('Exercise Physiology & Personal Well-being Activities', 'Exercise Physiology & Personal Well-being Activities', 14),
  ('Group And Centre Based Activities', 'Group And Centre Based Activities', 15),
  ('Hearing Equipment', 'Hearing Equipment', 16),
  ('Hearing Services', 'Hearing Services', 17),
  ('High Intensity Daily Personal Activities', 'High Intensity Daily Personal Activities', 18),
  ('Home Modification Design And Construction', 'Home Modification Design And Construction', 19),
  ('Household Tasks', 'Household Tasks', 20),
  ('Innovative Community Participation', 'Innovative Community Participation', 21),
  ('Interpreting And Translation', 'Interpreting And Translation', 22),
  ('Management of Funding for Supports', 'Management of Funding for Supports', 23),
  ('Participation In Community And Social And Civic Activities', 'Participation In Community And Social And Civic Activities', 24),
  ('Personal Mobility Equipment', 'Personal Mobility Equipment', 25),
  ('Specialised Disability Accommodation', 'Specialised Disability Accommodation', 26),
  ('Specialised Driver Training', 'Specialised Driver Training', 27),
  ('Specialised Hearing Services', 'Specialised Hearing Services', 28),
  ('Specialised Supported Employment', 'Specialised Supported Employment', 29),
  ('Specialist Positive Behaviour Support', 'Specialist Positive Behaviour Support', 30),
  ('Supported Independent Living', 'Supported Independent Living', 31),
  ('Support Coordination', 'Support Coordination', 32),
  ('Therapeutic Supports', 'Therapeutic Supports', 33),
  ('Vehicle Modifications', 'Vehicle Modifications', 34),
  ('Vision Equipment', 'Vision Equipment', 35)
) as v(value, label, sort_order)
where l.key = 'registrationGroup'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- claimType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('NDIS', 'NDIS', 0),
  ('Self Funded', 'Self Funded', 1),
  ('Other', 'Other', 2)
) as v(value, label, sort_order)
where l.key = 'claimType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- contractType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Supplier Contract', 'Supplier Contract', 0),
  ('Tenancy Agreeement', 'Tenancy Agreeement', 1),
  ('NDIS Service Agreement', 'NDIS Service Agreement', 2),
  ('Employee Contract', 'Employee Contract', 3)
) as v(value, label, sort_order)
where l.key = 'contractType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- contractTerm
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Fixed', 'Fixed', 0),
  ('Ongoing', 'Ongoing', 1)
) as v(value, label, sort_order)
where l.key = 'contractTerm'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- auditAction
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Created', 'Created', 0),
  ('Updated', 'Updated', 1),
  ('Reviewed', 'Reviewed', 2),
  ('Renewed', 'Renewed', 3),
  ('Terminated', 'Terminated', 4)
) as v(value, label, sort_order)
where l.key = 'auditAction'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employeeAlertType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Compliance', 'Compliance', 0),
  ('Operational', 'Operational', 1),
  ('HR', 'HR', 2),
  ('Safety', 'Safety', 3),
  ('Other', 'Other', 4)
) as v(value, label, sort_order)
where l.key = 'employeeAlertType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employeeSkillType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Language', 'Language', 0),
  ('Skill', 'Skill', 1),
  ('Specialisation', 'Specialisation', 2)
) as v(value, label, sort_order)
where l.key = 'employeeSkillType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- skillProficiency
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Basic', 'Basic', 0),
  ('Intermediate', 'Intermediate', 1),
  ('Advanced', 'Advanced', 2),
  ('Native', 'Native', 3),
  ('Fluent', 'Fluent', 4)
) as v(value, label, sort_order)
where l.key = 'skillProficiency'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employeeDocumentType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Employment contract', 'Employment contract', 0),
  ('Position description', 'Position description', 1),
  ('Photo ID', 'Photo ID', 2),
  ('Right to work', 'Right to work', 3),
  ('Signed policy', 'Signed policy', 4),
  ('Qualification', 'Qualification', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'employeeDocumentType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employeeActivityType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Note', 'Note', 0),
  ('Onboarding', 'Onboarding', 1),
  ('Training', 'Training', 2),
  ('Performance review', 'Performance review', 3),
  ('Incident', 'Incident', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'employeeActivityType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- leaveType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Annual leave', 'Annual leave', 0),
  ('Personal / carer''s leave', 'Personal / carer''s leave', 1),
  ('Long service leave', 'Long service leave', 2),
  ('Parental leave', 'Parental leave', 3),
  ('Unpaid leave', 'Unpaid leave', 4)
) as v(value, label, sort_order)
where l.key = 'leaveType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- partyType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Client', 'Client', 0),
  ('Employee', 'Employee', 1),
  ('Witness', 'Witness', 2),
  ('Other', 'Other', 3)
) as v(value, label, sort_order)
where l.key = 'partyType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- partyRole
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Affected person', 'Affected person', 0),
  ('Reporter', 'Reporter', 1),
  ('Witness', 'Witness', 2),
  ('Staff involved', 'Staff involved', 3),
  ('Manager notified', 'Manager notified', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'partyRole'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- incidentActionType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Immediate response', 'Immediate response', 0),
  ('Investigation step', 'Investigation step', 1),
  ('Corrective action', 'Corrective action', 2),
  ('Evidence collected', 'Evidence collected', 3),
  ('Risk review', 'Risk review', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'incidentActionType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- notificationTarget
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Internal manager', 'Internal manager', 0),
  ('NDIS Commission', 'NDIS Commission', 1),
  ('Participant / family', 'Participant / family', 2),
  ('Guardian', 'Guardian', 3),
  ('Police', 'Police', 4),
  ('Other regulator', 'Other regulator', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'notificationTarget'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- notificationMethod
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Phone', 'Phone', 0),
  ('Email', 'Email', 1),
  ('NDIS portal', 'NDIS portal', 2),
  ('In person', 'In person', 3),
  ('Written letter', 'Written letter', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'notificationMethod'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- incidentStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Draft', 'Draft', 0),
  ('Submitted', 'Submitted', 1),
  ('Manager reviewed', 'Manager reviewed', 2),
  ('Commission notified', 'Commission notified', 3),
  ('Under investigation', 'Under investigation', 4),
  ('Actions in progress', 'Actions in progress', 5),
  ('Closed', 'Closed', 6)
) as v(value, label, sort_order)
where l.key = 'incidentStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- incidentSeverity
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Low', 'Low', 0),
  ('Medium', 'Medium', 1),
  ('High', 'High', 2),
  ('Critical', 'Critical', 3)
) as v(value, label, sort_order)
where l.key = 'incidentSeverity'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- ndisReportableType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Death', 'Death', 0),
  ('Serious injury', 'Serious injury', 1),
  ('Abuse or neglect', 'Abuse or neglect', 2),
  ('Unlawful sexual or physical contact or assault', 'Unlawful sexual or physical contact or assault', 3),
  ('Sexual misconduct', 'Sexual misconduct', 4),
  ('Unauthorised restrictive practice', 'Unauthorised restrictive practice', 5)
) as v(value, label, sort_order)
where l.key = 'ndisReportableType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employeeDocumentStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Current', 'Current', 0),
  ('Expiring soon', 'Expiring soon', 1),
  ('Expired', 'Expired', 2),
  ('Archived', 'Archived', 3)
) as v(value, label, sort_order)
where l.key = 'employeeDocumentStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- contactRelationship
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Spouse', 'Spouse', 0),
  ('Partner', 'Partner', 1),
  ('Parent', 'Parent', 2),
  ('Sibling', 'Sibling', 3),
  ('Child', 'Child', 4),
  ('Friend', 'Friend', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'contactRelationship'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- emergencyContactType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Emergency', 'Emergency', 0),
  ('Next of kin', 'Next of kin', 1)
) as v(value, label, sort_order)
where l.key = 'emergencyContactType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employmentType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Full-time', 'Full-time', 0),
  ('Part-time', 'Part-time', 1),
  ('Casual', 'Casual', 2),
  ('Contractor', 'Contractor', 3),
  ('Volunteer', 'Volunteer', 4)
) as v(value, label, sort_order)
where l.key = 'employmentType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- payMethod
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Bank', 'Bank', 0),
  ('Cash', 'Cash', 1),
  ('Cheque', 'Cheque', 2)
) as v(value, label, sort_order)
where l.key = 'payMethod'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- credentialType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('NDIS Worker Screening', 'NDIS Worker Screening', 0),
  ('Working with Children Check', 'Working with Children Check', 1),
  ('Police Check', 'Police Check', 2),
  ('First Aid Certificate', 'First Aid Certificate', 3),
  ('CPR Certificate', 'CPR Certificate', 4),
  ('Manual Handling', 'Manual Handling', 5),
  ('Driver Licence', 'Driver Licence', 6),
  ('Visa / work rights', 'Visa / work rights', 7),
  ('Qualification', 'Qualification', 8),
  ('Insurance', 'Insurance', 9),
  ('Other', 'Other', 10)
) as v(value, label, sort_order)
where l.key = 'credentialType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- credentialStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Current', 'Current', 0),
  ('Expiring soon', 'Expiring soon', 1),
  ('Expired', 'Expired', 2),
  ('Pending', 'Pending', 3),
  ('Revoked', 'Revoked', 4)
) as v(value, label, sort_order)
where l.key = 'credentialStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- department
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Executive', 'Executive', 0),
  ('Intake', 'Intake', 1),
  ('Client services', 'Client services', 2),
  ('Support coordination', 'Support coordination', 3),
  ('Finance', 'Finance', 4),
  ('HR', 'HR', 5),
  ('IT', 'IT', 6),
  ('Operations', 'Operations', 7)
) as v(value, label, sort_order)
where l.key = 'department'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employmentStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Active', 'Active', 0),
  ('On leave', 'On leave', 1),
  ('Terminated', 'Terminated', 2)
) as v(value, label, sort_order)
where l.key = 'employmentStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- taskPriority
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Low', 'Low', 0),
  ('Normal', 'Normal', 1),
  ('High', 'High', 2)
) as v(value, label, sort_order)
where l.key = 'taskPriority'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- employeeLeaveStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Draft', 'Draft', 0),
  ('Requested', 'Requested', 1),
  ('Approved', 'Approved', 2),
  ('Declined', 'Declined', 3),
  ('Cancelled', 'Cancelled', 4),
  ('Taken', 'Taken', 5)
) as v(value, label, sort_order)
where l.key = 'employeeLeaveStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- locationType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('SIL house', 'SIL house', 0),
  ('Day program', 'Day program', 1),
  ('Community hub', 'Community hub', 2),
  ('Office', 'Office', 3),
  ('Respite', 'Respite', 4),
  ('Therapy room', 'Therapy room', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'locationType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- locationStatus
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Active', 'Active', 0),
  ('Inactive', 'Inactive', 1),
  ('Planned', 'Planned', 2),
  ('Closed', 'Closed', 3)
) as v(value, label, sort_order)
where l.key = 'locationStatus'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- locationClientRole
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Resident', 'Resident', 0),
  ('Regular attendee', 'Regular attendee', 1),
  ('Occasional', 'Occasional', 2),
  ('Visitor', 'Visitor', 3)
) as v(value, label, sort_order)
where l.key = 'locationClientRole'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- locationEmployeeRole
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Site manager', 'Site manager', 0),
  ('Support worker', 'Support worker', 1),
  ('Team leader', 'Team leader', 2),
  ('Relief staff', 'Relief staff', 3),
  ('Allied health', 'Allied health', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'locationEmployeeRole'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- locationAlertType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Safety', 'Safety', 0),
  ('Access', 'Access', 1),
  ('Operational', 'Operational', 2),
  ('Clinical', 'Clinical', 3),
  ('Maintenance', 'Maintenance', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'locationAlertType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- locationActivityType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Site visit', 'Site visit', 0),
  ('Maintenance', 'Maintenance', 1),
  ('Incident follow-up', 'Incident follow-up', 2),
  ('Phone call', 'Phone call', 3),
  ('Note', 'Note', 4),
  ('Other', 'Other', 5)
) as v(value, label, sort_order)
where l.key = 'locationActivityType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- incidentCategory
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('Operational', 'Operational', 0),
  ('Near miss', 'Near miss', 1),
  ('Injury', 'Injury', 2),
  ('Behaviour', 'Behaviour', 3),
  ('Restrictive practice', 'Restrictive practice', 4),
  ('Property damage', 'Property damage', 5),
  ('Other', 'Other', 6)
) as v(value, label, sort_order)
where l.key = 'incidentCategory'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- incidentServiceType
insert into public.reference_option (list_id, value, label, sort_order, active)
select l.id, v.value, v.label, v.sort_order, true
from public.reference_list l
cross join (values
  ('NDIS Support', 'NDIS Support', 0),
  ('SIL', 'SIL', 1),
  ('Community Participation', 'Community Participation', 2),
  ('Therapy', 'Therapy', 3),
  ('Transport', 'Transport', 4),
  ('Administration', 'Administration', 5),
  ('Unassigned', 'Unassigned', 6)
) as v(value, label, sort_order)
where l.key = 'incidentServiceType'
on conflict (list_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;
