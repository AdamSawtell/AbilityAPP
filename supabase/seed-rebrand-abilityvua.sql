-- One-off: rename AbilityAPP → AbilityVua in existing remote demo/production data.
-- Safe to re-run (idempotent). Does not change AbilityERP parity labels on service bookings.

-- Organisation profile
update public.app_organization
set
  trading_name = 'AbilityVua Community Services',
  legal_name = 'AbilityVua Pty Ltd',
  search_key = 'AbilityVua',
  email = replace(email, '@abilityapp.local', '@abilityvua.local'),
  primary_contact_email = replace(primary_contact_email, '@abilityapp.local', '@abilityvua.local'),
  updated_at = now()
where id = 'org-default';

-- Admin role
update public.app_role
set
  role_key = 'AbilityVua_Admin',
  name = 'AbilityVua Admin',
  description = replace(description, 'AbilityAPP', 'AbilityVua')
where id = 'role-admin' or role_key in ('AbilityAPP_Admin', 'AbilityVua_Admin');

-- Users (demo emails + notes)
update public.app_user
set
  email = replace(email, '@abilityapp.local', '@abilityvua.local'),
  notes = replace(replace(notes, 'AbilityAPP', 'AbilityVua'), 'abilityapp', 'abilityvua')
where email ilike '%@abilityapp.local%'
   or notes ilike '%AbilityAPP%'
   or notes ilike '%abilityapp%';

-- AI agent prompts
update public.app_ai_agent
set system_prompt = replace(system_prompt, 'AbilityAPP', 'AbilityVua')
where system_prompt ilike '%AbilityAPP%';

-- Reference data — sales representative dropdown
delete from public.reference_option ro
using public.reference_list rl
where rl.id = ro.list_id
  and rl.key = 'salesRepresentative'
  and ro.value = 'AbilityAPP'
  and exists (
    select 1
    from public.reference_option existing
    where existing.list_id = ro.list_id and existing.value = 'AbilityVua'
  );

update public.reference_option ro
set value = 'AbilityVua', label = 'AbilityVua'
from public.reference_list rl
where rl.id = ro.list_id
  and rl.key = 'salesRepresentative'
  and (ro.value = 'AbilityAPP' or ro.label = 'AbilityAPP');

-- Client sales rep field
update public.client
set sales_representative = 'AbilityVua'
where sales_representative = 'AbilityAPP';

-- Support locations
update public.support_location
set email = replace(email, '@abilityapp.local', '@abilityvua.local')
where email ilike '%@abilityapp.local%';

-- Service bookings seeded with product org name (not AbilityERP parity rows)
update public.service_booking
set organization = 'AbilityVua'
where organization = 'AbilityAPP';

-- Document template HTML blocks (org name in headers/footers)
update public.app_document_template_block
set content_html = replace(content_html, 'AbilityAPP', 'AbilityVua')
where content_html ilike '%AbilityAPP%';

update public.app_document_email_template
set subject = replace(subject, 'AbilityAPP', 'AbilityVua'),
    body = replace(body, 'AbilityAPP', 'AbilityVua')
where subject ilike '%AbilityAPP%' or body ilike '%AbilityAPP%';

-- Catch-all text columns that may still hold the old product name
update public.enquiry
set description = replace(description, 'AbilityAPP', 'AbilityVua')
where description ilike '%AbilityAPP%';

update public.app_task
set description = replace(description, 'AbilityAPP', 'AbilityVua')
where description ilike '%AbilityAPP%';
