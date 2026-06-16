-- Reference data seed (generated from web/src/lib/reference-data.ts)
-- Re-run: node scripts/generate-reference-seed.mjs

insert into public.reference_list (key, label, "group", description, sort_order)
values
  ('clientStatus', 'Client status', 'Client', null, 0),
  ('gender', 'Gender', 'Client', 'Shared with enquiries', 1),
  ('decisionMaking', 'Decision making', 'Client', null, 2),
  ('livingArrangement', 'Living arrangement', 'Client', null, 3),
  ('salesRepresentative', 'Sales representative', 'Client', null, 4),
  ('fundingBody', 'Funding body', 'Client', 'Shared with enquiries', 5),
  ('aboriginalTorresStraitIslander', 'Aboriginal / Torres Strait Islander', 'Client', null, 6),
  ('culturalAffiliation', 'Cultural affiliation', 'Client', null, 7),
  ('disability', 'Disability', 'Client', 'Shared with enquiries', 8),
  ('businessPartnerGroup', 'Business partner group', 'Client', null, 9),
  ('lgbtiqa', 'LGBTIQA+', 'Client', null, 10),
  ('alertType', 'Alert type', 'Client', null, 11),
  ('restrictivePracticeType', 'Restrictive practice type', 'Client', null, 111),
  ('consentType', 'Consent type', 'Client', null, 112),
  ('showAsAlert', 'Show as alert', 'Client', 'Yes / No', 12),
  ('activityType', 'Activity type', 'Client', null, 13),
  ('addressType', 'Address type', 'Client', null, 14),
  ('australianState', 'State / territory', 'Client', null, 15),
  ('country', 'Country', 'Client', null, 16),
  ('enquiryStatus', 'Enquiry status', 'Enquiry', null, 17),
  ('enquirySource', 'Enquiry source', 'Enquiry', null, 18),
  ('isEnquiryForSelf', 'Is enquiry for self', 'Enquiry', null, 19),
  ('thirdPartyConsent', '3rd party consent', 'Enquiry', null, 20),
  ('relationshipType', 'Relationship type', 'Enquiry', null, 21),
  ('preferredCommunicationMethod', 'Preferred communication method', 'Enquiry', null, 22),
  ('enquiryQuery', 'Enquiry saved queries', 'Enquiry', 'List filters', 23),
  ('primaryLanguage', 'Primary language', 'Support plan', null, 24),
  ('financialArrangement', 'Financial arrangement', 'Support plan', null, 25),
  ('goalNumber', 'Goal number', 'Support plan', null, 26),
  ('goalTerm', 'Goal term', 'Support plan', null, 27),
  ('goalType', 'Goal type', 'Support plan', null, 28),
  ('documentType', 'Plan document type', 'Support plan', null, 29),
  ('planType', 'Plan type', 'Support plan', null, 30),
  ('documentStatus', 'Document status', 'Support plan', null, 31),
  ('assessmentType', 'Assessment type', 'Support plan', null, 32),
  ('progressReviewType', 'Progress review type', 'Support plan', null, 33),
  ('goalProgress', 'Goal progress', 'Support plan', null, 34),
  ('productCategory', 'Product category', 'Products & services', null, 35),
  ('uom', 'Unit of measure', 'Products & services', null, 36),
  ('productType', 'Product type', 'Products & services', null, 37),
  ('serviceAgreementTerm', 'Service agreement term', 'Products & services', null, 38),
  ('serviceAgreementStatus', 'Service agreement status', 'Products & services', null, 39),
  ('fundingType', 'Funding type', 'Products & services', null, 40),
  ('fundingManagementType', 'Funding management type', 'Products & services', null, 41),
  ('budgetRules', 'Budget rules', 'Products & services', null, 42),
  ('registrationGroup', 'NDIS registration group', 'Products & services', null, 43),
  ('claimType', 'Claim type', 'Products & services', null, 44),
  ('contractType', 'Contract type', 'Contracts', null, 45),
  ('contractTerm', 'Contract term', 'Contracts', null, 46),
  ('auditAction', 'Audit action', 'Contracts', null, 47),
  ('yesNo', 'Yes / No', 'General', null, 48)
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
