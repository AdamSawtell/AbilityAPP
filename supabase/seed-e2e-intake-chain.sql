-- E2E intake chain — reset enquiry pipeline + exit test participant
-- Run: npm run supabase:seed-e2e-intake
-- Safe to re-run (fixed ids). Does not touch Bern (bp-bern) delivery smoke data.

-- Samuel Ryan — convertible enquiry at Proposal (TEST-010 / TEST-020)
update public.enquiry
set
  status = '3_Proposal',
  date_next_action = '2026-06-30',
  ndis_number = '431099825',
  plan_status = 'Active',
  plan_management_type = 'Plan managed',
  postcode = '5000',
  support_categories = 'Assistance with Daily Life; Assistance with Social, Economic and Community Participation',
  urgency = 'Standard',
  qualification_score = 78,
  qualification_tier = 'Qualified',
  qualification_summary = 'E2E reset — active NDIS plan, in-area, services match SIL intake.',
  updated_at = now(),
  updated_by = 'E2E intake seed'
where id = '1000025';

-- Janice Williams — fresh intake at Enquiry received (full Flow 1 from scratch)
update public.enquiry
set
  status = '1_Enquiry received',
  date_next_action = '2026-06-25',
  ndis_number = '',
  plan_status = '',
  plan_management_type = '',
  postcode = '5035',
  support_categories = 'Assistance with Self Care Activities',
  urgency = 'Standard',
  qualification_score = 0,
  qualification_tier = 'Not qualified',
  qualification_summary = '',
  updated_at = now(),
  updated_by = 'E2E intake seed'
where id = '1000013';

-- Remove client created by prior TEST-020 convert runs (no seeded client uses this enquiry id)
delete from public.client where enquiry_id = '1000025';

-- Disposable participant for Flow 7 exit tests (do not use Bern)
insert into public.client (
  id, enquiry_id, search_key, business_partner_group, name,
  first_name, last_name, email, phone, status,
  funding_body, services, disability,
  lifecycle_status, lifecycle_exit_reason,
  created_by, updated_by
)
values (
  'bp-e2e-exit', null, 'E2EXIT', 'Client', 'E2E Exit Participant',
  'E2E', 'Exit', 'e2e.exit@example.local', '08 8299 0001', 'Active',
  'NDIS - National Disability Insurance Scheme', 'Respite', 'ID - Autism',
  'active', '',
  'E2E intake seed', 'E2E intake seed'
)
on conflict (id) do update set
  lifecycle_status = 'active',
  lifecycle_exit_reason = '',
  status = 'Active',
  date_support_ceased = null,
  updated_by = 'E2E intake seed';
